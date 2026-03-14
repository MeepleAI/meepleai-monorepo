'use client';

/**
 * Whisper API Provider
 *
 * Cloud-based implementation of ISpeechRecognitionProvider using
 * MediaRecorder to capture audio and proxying to the backend
 * POST /api/v1/speech/transcribe endpoint (OpenAI Whisper API).
 *
 * Handles:
 * - MediaRecorder audio capture with webm/opus codec
 * - Silence timeout (auto-stop after speech ends with no audio activity)
 * - Max duration timeout (hard limit on recording session)
 * - No-speech timeout (no audio level detected after start)
 * - Backend proxy with multipart form upload
 * - Clean state machine transitions matching ISpeechRecognitionProvider
 */

import type {
  ISpeechRecognitionProvider,
  SpeechRecognitionConfig,
  SpeechRecognitionEvents,
  VoiceRecognitionState,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface TranscriptionResponse {
  text: string;
  language: string;
  duration: number;
}

export class WhisperProvider implements ISpeechRecognitionProvider {
  private _state: VoiceRecognitionState = 'idle';
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private events: SpeechRecognitionEvents | null = null;
  private config: SpeechRecognitionConfig | null = null;
  private abortController: AbortController | null = null;

  private maxDurationTimer: ReturnType<typeof setTimeout> | null = null;
  private noSpeechTimer: ReturnType<typeof setTimeout> | null = null;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;

  private analyserNode: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;
  private silenceCheckInterval: ReturnType<typeof setInterval> | null = null;
  private hasSpeechDetected = false;

  /** Minimum RMS amplitude to consider as speech (0-1 scale). */
  private static readonly SPEECH_THRESHOLD = 0.01;
  /** How often to check audio levels in ms. */
  private static readonly LEVEL_CHECK_INTERVAL_MS = 100;

  get isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      typeof MediaRecorder !== 'undefined' &&
      typeof navigator?.mediaDevices?.getUserMedia === 'function'
    );
  }

  get state(): VoiceRecognitionState {
    return this._state;
  }

  start(config: SpeechRecognitionConfig, events: SpeechRecognitionEvents): void {
    if (this._state !== 'idle' && this._state !== 'error') {
      return;
    }

    if (!this.isSupported) {
      this.setState('error', events);
      events.onError({
        code: 'not_supported',
        message: 'MediaRecorder is not supported in this browser.',
        recoverable: false,
      });
      return;
    }

    this.config = config;
    this.events = events;
    this.audioChunks = [];
    this.hasSpeechDetected = false;

    this.setState('requesting', events);
    this.requestMicrophone();
  }

  stop(): void {
    if (!this.mediaRecorder) return;

    if (this._state === 'listening') {
      this.setState('processing', this.events);
    }

    this.clearAllTimers();
    this.stopSilenceDetection();

    if (this.mediaRecorder.state === 'recording') {
      // onstop handler will trigger transcription
      this.mediaRecorder.stop();
    }
  }

  abort(): void {
    this.clearAllTimers();
    this.stopSilenceDetection();
    this.abortController?.abort();

    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }

    this.releaseMediaStream();
    this.cleanup();
  }

  dispose(): void {
    this.abort();
    this.events = null;
    this.config = null;
  }

  // ---------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------

  private async requestMicrophone(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      this.mediaStream = stream;
      this.setupMediaRecorder(stream);
      this.setupAudioAnalyser(stream);
    } catch (err) {
      this.setState('error', this.events);
      const isDenied =
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');

      this.events?.onError({
        code: isDenied ? 'permission_denied' : 'audio_capture_error',
        message: isDenied
          ? 'Microphone permission was denied. Please allow microphone access and try again.'
          : 'Could not capture audio. Please check your microphone.',
        recoverable: !isDenied,
      });
    }
  }

  private setupMediaRecorder(stream: MediaStream): void {
    const mimeType = this.getPreferredMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    recorder.onstart = () => {
      this.setState('listening', this.events);
      this.startNoSpeechTimer();
      this.startMaxDurationTimer();
      this.startSilenceDetection();
      this.events?.onSpeechStart();
    };

    recorder.onstop = () => {
      this.releaseMediaStream();

      if (this._state === 'processing' && this.audioChunks.length > 0) {
        this.transcribeAudio();
      } else {
        this.cleanup();
      }
    };

    recorder.onerror = () => {
      this.clearAllTimers();
      this.stopSilenceDetection();
      this.releaseMediaStream();
      this.setState('error', this.events);
      this.events?.onError({
        code: 'audio_capture_error',
        message: 'An error occurred during audio recording.',
        recoverable: true,
      });
    };

    this.mediaRecorder = recorder;
    // Collect data every 250ms for interim feedback
    recorder.start(250);
  }

  private setupAudioAnalyser(stream: MediaStream): void {
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      this.audioContext = ctx;
      this.analyserNode = analyser;
    } catch {
      // Audio analysis is best-effort; recording still works without it
    }
  }

  private startSilenceDetection(): void {
    if (!this.analyserNode) return;

    const bufferLength = this.analyserNode.fftSize;
    const dataArray = new Float32Array(bufferLength);

    this.silenceCheckInterval = setInterval(() => {
      if (!this.analyserNode) return;
      this.analyserNode.getFloatTimeDomainData(dataArray);

      // Calculate RMS amplitude
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);

      if (rms > WhisperProvider.SPEECH_THRESHOLD) {
        this.hasSpeechDetected = true;
        this.clearTimer('noSpeech');
        this.clearTimer('silence');
        // Provide interim feedback based on audio activity
        this.events?.onInterimResult('...');
      } else if (this.hasSpeechDetected) {
        // Speech was detected before but now it's silent — start silence timer
        this.startSilenceTimer();
      }
    }, WhisperProvider.LEVEL_CHECK_INTERVAL_MS);
  }

  private stopSilenceDetection(): void {
    if (this.silenceCheckInterval !== null) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyserNode = null;
  }

  private async transcribeAudio(): Promise<void> {
    const mimeType = this.audioChunks[0]?.type || 'audio/webm';
    const audioBlob = new Blob(this.audioChunks, { type: mimeType });
    this.audioChunks = [];

    // Determine file extension from mime type
    const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';
    const fileName = `recording.${ext}`;

    const formData = new FormData();
    formData.append('file', audioBlob, fileName);
    if (this.config?.language) {
      // Send only the language prefix (e.g., 'it' from 'it-IT')
      formData.append('language', this.config.language.substring(0, 2));
    }

    this.abortController = new AbortController();

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/speech/transcribe`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorCode = response.status === 403 ? 'permission_denied' : 'server_error';
        const errorMsg =
          response.status === 403
            ? 'Speech transcription is not available on your current plan.'
            : `Transcription failed (${response.status}).`;

        this.setState('error', this.events);
        this.events?.onError({
          code: errorCode,
          message: errorMsg,
          recoverable: response.status !== 403,
        });
        return;
      }

      const result = (await response.json()) as TranscriptionResponse;

      if (result.text && result.text.trim().length > 0) {
        this.events?.onFinalResult(result.text.trim(), 1.0);
        this.events?.onSpeechEnd();
      } else {
        this.events?.onSpeechEnd();
        this.setState('error', this.events);
        this.events?.onError({
          code: 'no_speech',
          message: 'No speech was detected in the audio.',
          recoverable: true,
        });
        return;
      }

      this.setState('idle', this.events);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        this.setState('idle', this.events);
        return;
      }

      this.setState('error', this.events);
      this.events?.onError({
        code: 'network_error',
        message: 'Failed to connect to the transcription service.',
        recoverable: true,
      });
    } finally {
      this.abortController = null;
    }
  }

  private getPreferredMimeType(): string | null {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];
    for (const candidate of candidates) {
      if (MediaRecorder.isTypeSupported(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  private releaseMediaStream(): void {
    if (this.mediaStream) {
      for (const track of this.mediaStream.getTracks()) {
        track.stop();
      }
      this.mediaStream = null;
    }
  }

  // ---------------------------------------------------------------
  // Timer management
  // ---------------------------------------------------------------

  private startSilenceTimer(): void {
    if (this.silenceTimer !== null) return; // Already running
    if (!this.config) return;

    this.silenceTimer = setTimeout(() => {
      this.silenceTimer = null;
      this.stop();
    }, this.config.silenceTimeoutMs);
  }

  private startMaxDurationTimer(): void {
    this.clearTimer('maxDuration');
    if (!this.config) return;

    this.maxDurationTimer = setTimeout(() => {
      this.stop();
    }, this.config.maxDurationMs);
  }

  private startNoSpeechTimer(): void {
    this.clearTimer('noSpeech');
    if (!this.config) return;

    this.noSpeechTimer = setTimeout(() => {
      if (!this.hasSpeechDetected) {
        this.abort();
        this.setState('error', this.events);
        this.events?.onError({
          code: 'no_speech',
          message: 'No speech was detected. Please try again.',
          recoverable: true,
        });
      }
    }, this.config.noSpeechTimeoutMs);
  }

  private clearTimer(which: 'silence' | 'maxDuration' | 'noSpeech'): void {
    switch (which) {
      case 'silence':
        if (this.silenceTimer !== null) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }
        break;
      case 'maxDuration':
        if (this.maxDurationTimer !== null) {
          clearTimeout(this.maxDurationTimer);
          this.maxDurationTimer = null;
        }
        break;
      case 'noSpeech':
        if (this.noSpeechTimer !== null) {
          clearTimeout(this.noSpeechTimer);
          this.noSpeechTimer = null;
        }
        break;
    }
  }

  private clearAllTimers(): void {
    this.clearTimer('silence');
    this.clearTimer('maxDuration');
    this.clearTimer('noSpeech');
  }

  private setState(newState: VoiceRecognitionState, events: SpeechRecognitionEvents | null): void {
    if (this._state === newState) return;
    this._state = newState;
    events?.onStateChange(newState);
  }

  private cleanup(): void {
    this.clearAllTimers();
    this.stopSilenceDetection();
    if (this._state !== 'error') {
      this.setState('idle', this.events);
    }
    this.mediaRecorder = null;
  }
}
