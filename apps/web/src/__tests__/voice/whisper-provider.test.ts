import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SpeechRecognitionConfig, SpeechRecognitionEvents } from '@/lib/voice/types';
import { WhisperProvider } from '@/lib/voice/providers/whisper-provider';
import { WebSpeechProvider } from '@/lib/voice/providers/web-speech-provider';

// ---------------------------------------------------------------------------
// Mock MediaRecorder
// ---------------------------------------------------------------------------

let lastMockRecorder: MockMediaRecorder | null = null;

class MockMediaRecorder {
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstart: (() => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;

  start = vi.fn(() => {
    this.state = 'recording';
    // Trigger onstart asynchronously like real MediaRecorder
    setTimeout(() => this.onstart?.(), 0);
  });

  stop = vi.fn(() => {
    this.state = 'inactive';
    setTimeout(() => this.onstop?.(), 0);
  });

  static isTypeSupported = vi.fn(() => true);

  constructor() {
    lastMockRecorder = this;
  }
}

// ---------------------------------------------------------------------------
// Mock getUserMedia
// ---------------------------------------------------------------------------

function createMockStream(): MediaStream {
  const track = { stop: vi.fn(), kind: 'audio' } as unknown as MediaStreamTrack;
  return {
    getTracks: () => [track],
    getAudioTracks: () => [track],
  } as unknown as MediaStream;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConfig(overrides?: Partial<SpeechRecognitionConfig>): SpeechRecognitionConfig {
  return {
    language: 'it-IT',
    interimResults: true,
    silenceTimeoutMs: 2000,
    maxDurationMs: 30000,
    noSpeechTimeoutMs: 5000,
    ...overrides,
  };
}

function makeEvents(overrides?: Partial<SpeechRecognitionEvents>): SpeechRecognitionEvents {
  return {
    onInterimResult: vi.fn(),
    onFinalResult: vi.fn(),
    onSpeechStart: vi.fn(),
    onSpeechEnd: vi.fn(),
    onError: vi.fn(),
    onStateChange: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup and teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
  lastMockRecorder = null;

  // Provide MediaRecorder global
  vi.stubGlobal('MediaRecorder', MockMediaRecorder);

  // Provide navigator.mediaDevices.getUserMedia
  const mockStream = createMockStream();
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
    },
  });

  // Stub AudioContext to avoid errors in setupAudioAnalyser
  vi.stubGlobal(
    'AudioContext',
    vi.fn(() => ({
      createMediaStreamSource: vi.fn(() => ({
        connect: vi.fn(),
      })),
      createAnalyser: vi.fn(() => ({
        fftSize: 256,
        getFloatTimeDomainData: vi.fn(),
      })),
      close: vi.fn().mockResolvedValue(undefined),
    }))
  );

  // Default fetch mock
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WhisperProvider', () => {
  describe('isSupported', () => {
    it('returns true when MediaRecorder and getUserMedia are available', () => {
      const provider = new WhisperProvider();
      expect(provider.isSupported).toBe(true);
    });

    it('returns false when MediaRecorder is not available', () => {
      vi.stubGlobal('MediaRecorder', undefined);
      const provider = new WhisperProvider();
      expect(provider.isSupported).toBe(false);
    });
  });

  describe('start()', () => {
    it('transitions through requesting → listening states', async () => {
      const events = makeEvents();
      const provider = new WhisperProvider();

      provider.start(makeConfig(), events);

      expect(provider.state).toBe('requesting');
      expect(events.onStateChange).toHaveBeenCalledWith('requesting');

      // Let getUserMedia resolve and MediaRecorder.onstart fire
      await vi.advanceTimersByTimeAsync(10);

      expect(provider.state).toBe('listening');
      expect(events.onStateChange).toHaveBeenCalledWith('listening');
    });

    it('emits permission_denied error when getUserMedia rejects with NotAllowedError', async () => {
      const events = makeEvents();
      const provider = new WhisperProvider();

      const notAllowedError = new DOMException('Permission denied', 'NotAllowedError');
      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(notAllowedError);

      provider.start(makeConfig(), events);
      await vi.advanceTimersByTimeAsync(10);

      expect(provider.state).toBe('error');
      expect(events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'permission_denied',
          recoverable: false,
        })
      );
    });

    it('emits audio_capture_error for generic getUserMedia failures', async () => {
      const events = makeEvents();
      const provider = new WhisperProvider();

      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(new Error('No mic'));

      provider.start(makeConfig(), events);
      await vi.advanceTimersByTimeAsync(10);

      expect(provider.state).toBe('error');
      expect(events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'audio_capture_error',
          recoverable: true,
        })
      );
    });

    it('emits not_supported error when MediaRecorder unavailable', () => {
      vi.stubGlobal('MediaRecorder', undefined);
      const events = makeEvents();
      const provider = new WhisperProvider();

      provider.start(makeConfig(), events);

      expect(provider.state).toBe('error');
      expect(events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'not_supported',
          recoverable: false,
        })
      );
    });

    it('does nothing if already listening', async () => {
      const events = makeEvents();
      const provider = new WhisperProvider();

      provider.start(makeConfig(), events);
      await vi.advanceTimersByTimeAsync(10);

      expect(provider.state).toBe('listening');
      const callCount = vi.mocked(events.onStateChange).mock.calls.length;

      provider.start(makeConfig(), events);
      expect(vi.mocked(events.onStateChange).mock.calls.length).toBe(callCount);
    });
  });

  describe('stop()', () => {
    it('transitions to processing and triggers transcription', async () => {
      const events = makeEvents();
      const provider = new WhisperProvider();

      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ text: 'Hello world', language: 'en', duration: 1.5 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      provider.start(makeConfig(), events);
      await vi.advanceTimersByTimeAsync(10);

      // Simulate data available
      lastMockRecorder?.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) });

      provider.stop();
      expect(provider.state).toBe('processing');

      // Let onstop fire and transcription complete
      await vi.advanceTimersByTimeAsync(10);
      await vi.runAllTimersAsync();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/speech/transcribe'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(events.onFinalResult).toHaveBeenCalledWith('Hello world', 1.0);
    });
  });

  describe('transcription responses', () => {
    it('handles 403 tier-blocked response', async () => {
      const events = makeEvents();
      const provider = new WhisperProvider();

      vi.mocked(fetch).mockResolvedValueOnce(new Response('Forbidden', { status: 403 }));

      provider.start(makeConfig(), events);
      await vi.advanceTimersByTimeAsync(10);

      lastMockRecorder?.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) });
      provider.stop();
      await vi.advanceTimersByTimeAsync(10);
      await vi.runAllTimersAsync();

      expect(events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'permission_denied',
          recoverable: false,
        })
      );
    });

    it('handles server error response', async () => {
      const events = makeEvents();
      const provider = new WhisperProvider();

      vi.mocked(fetch).mockResolvedValueOnce(new Response('Internal error', { status: 500 }));

      provider.start(makeConfig(), events);
      await vi.advanceTimersByTimeAsync(10);

      lastMockRecorder?.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) });
      provider.stop();
      await vi.advanceTimersByTimeAsync(10);
      await vi.runAllTimersAsync();

      expect(events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'server_error',
          recoverable: true,
        })
      );
    });

    it('handles empty transcription result', async () => {
      const events = makeEvents();
      const provider = new WhisperProvider();

      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ text: '', language: 'en', duration: 0.5 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      provider.start(makeConfig(), events);
      await vi.advanceTimersByTimeAsync(10);

      lastMockRecorder?.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) });
      provider.stop();
      await vi.advanceTimersByTimeAsync(10);
      await vi.runAllTimersAsync();

      expect(events.onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'no_speech' }));
    });

    it('handles network failure', async () => {
      const events = makeEvents();
      const provider = new WhisperProvider();

      vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      provider.start(makeConfig(), events);
      await vi.advanceTimersByTimeAsync(10);

      lastMockRecorder?.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) });
      provider.stop();
      await vi.advanceTimersByTimeAsync(10);
      await vi.runAllTimersAsync();

      expect(events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'network_error',
          recoverable: true,
        })
      );
    });
  });

  describe('abort()', () => {
    it('stops recording and transitions to idle', async () => {
      const events = makeEvents();
      const provider = new WhisperProvider();

      provider.start(makeConfig(), events);
      await vi.advanceTimersByTimeAsync(10);

      provider.abort();
      await vi.advanceTimersByTimeAsync(10);

      expect(provider.state).toBe('idle');
    });
  });

  describe('dispose()', () => {
    it('aborts and cleans up', async () => {
      const events = makeEvents();
      const provider = new WhisperProvider();

      provider.start(makeConfig(), events);
      await vi.advanceTimersByTimeAsync(10);

      provider.dispose();
      await vi.advanceTimersByTimeAsync(10);

      expect(provider.state).toBe('idle');
    });
  });

  describe('no-speech timeout', () => {
    it('fires error after noSpeechTimeoutMs with no audio', async () => {
      const events = makeEvents();
      const provider = new WhisperProvider();

      provider.start(makeConfig({ noSpeechTimeoutMs: 3000 }), events);
      await vi.advanceTimersByTimeAsync(10);

      // Advance past the no-speech timeout
      await vi.advanceTimersByTimeAsync(3100);

      expect(events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'no_speech',
          recoverable: true,
        })
      );
    });
  });

  describe('max duration timeout', () => {
    it('stops recording after maxDurationMs', async () => {
      const events = makeEvents();
      const provider = new WhisperProvider();

      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ text: 'result', language: 'en', duration: 30.0 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      provider.start(makeConfig({ maxDurationMs: 5000, noSpeechTimeoutMs: 60000 }), events);
      await vi.advanceTimersByTimeAsync(10);

      // Simulate some data
      lastMockRecorder?.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) });

      // Advance past max duration
      await vi.advanceTimersByTimeAsync(5100);

      // Should have called stop() internally
      expect(lastMockRecorder?.stop).toHaveBeenCalled();
    });
  });

  describe('language handling', () => {
    it('sends language prefix to backend', async () => {
      const events = makeEvents();
      const provider = new WhisperProvider();

      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ text: 'Ciao mondo', language: 'it', duration: 1.0 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      provider.start(makeConfig({ language: 'it-IT' }), events);
      await vi.advanceTimersByTimeAsync(10);

      lastMockRecorder?.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) });
      provider.stop();
      await vi.advanceTimersByTimeAsync(10);
      await vi.runAllTimersAsync();

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const formData = fetchCall[1]?.body as FormData;
      expect(formData.get('language')).toBe('it');
    });
  });
});

describe('createSpeechRecognitionProvider', () => {
  // Import after globals are set up
  let createSpeechRecognitionProvider: typeof import('@/lib/voice/providers/provider-factory').createSpeechRecognitionProvider;

  beforeEach(async () => {
    const mod = await import('@/lib/voice/providers/provider-factory');
    createSpeechRecognitionProvider = mod.createSpeechRecognitionProvider;
  });

  it('returns WebSpeechProvider for free tier', () => {
    const provider = createSpeechRecognitionProvider('free');
    expect(provider).toBeInstanceOf(WebSpeechProvider);
  });

  it('returns WebSpeechProvider when no tier specified (default)', () => {
    const provider = createSpeechRecognitionProvider();
    expect(provider).toBeInstanceOf(WebSpeechProvider);
  });

  it('returns WhisperProvider for premium tier', () => {
    const provider = createSpeechRecognitionProvider('premium');
    expect(provider).toBeInstanceOf(WhisperProvider);
  });

  it('returns WhisperProvider for admin tier', () => {
    const provider = createSpeechRecognitionProvider('admin');
    expect(provider).toBeInstanceOf(WhisperProvider);
  });

  it('falls back to WebSpeechProvider for premium if MediaRecorder unavailable', () => {
    vi.stubGlobal('MediaRecorder', undefined);
    const provider = createSpeechRecognitionProvider('premium');
    expect(provider).toBeInstanceOf(WebSpeechProvider);
  });
});
