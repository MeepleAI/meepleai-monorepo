'use client';

/**
 * useVoiceInput - Speech-to-Text React Hook
 *
 * Manages the full STT lifecycle: microphone permission, speech recognition,
 * interim/final results, silence detection, and error handling.
 *
 * Creates the ISpeechRecognitionProvider lazily on first startListening() call,
 * and disposes it on unmount.
 *
 * @example
 * ```tsx
 * const { state, interimText, finalText, startListening, stopListening, isSupported } =
 *   useVoiceInput({
 *     language: 'it-IT',
 *     onTranscript: (text, confidence) => sendMessage(text),
 *   });
 * ```
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createSpeechRecognitionProvider } from '@/lib/voice/providers/provider-factory';
import type {
  ISpeechRecognitionProvider,
  SpeechRecognitionConfig,
  SpeechRecognitionEvents,
  VoiceError,
  VoiceRecognitionState,
} from '@/lib/voice/types';
import { DEFAULT_VOICE_CONFIG } from '@/lib/voice/types';
import { isSpeechRecognitionSupported } from '@/lib/voice/utils/voice-detection';

// ============================================================================
// Types
// ============================================================================

export type UserTier = 'free' | 'premium' | 'admin';

export interface UseVoiceInputOptions {
  /** BCP 47 language tag (default: from DEFAULT_VOICE_CONFIG) */
  language?: string;
  /** Whether to treat final result as ready-to-send (default: true) */
  autoSend?: boolean;
  /** Silence timeout in ms before auto-stopping (default: from DEFAULT_VOICE_CONFIG) */
  silenceTimeoutMs?: number;
  /** User subscription tier for provider selection (default: 'free') */
  tier?: UserTier;
  /** Called when a final transcript is produced */
  onTranscript?: (text: string, confidence: number) => void;
  /** Called when an error occurs */
  onError?: (error: VoiceError) => void;
}

export interface UseVoiceInputReturn {
  /** Current recognition state machine value */
  state: VoiceRecognitionState;
  /** In-progress transcript (updates live while speaking) */
  interimText: string;
  /** Last confirmed transcript */
  finalText: string;
  /** Begin listening for speech */
  startListening: () => void;
  /** Gracefully stop listening (processes remaining audio) */
  stopListening: () => void;
  /** Immediately cancel listening (discards pending audio) */
  cancelListening: () => void;
  /** Whether the browser supports speech recognition */
  isSupported: boolean;
  /** Current error, or null */
  error: VoiceError | null;
  /** Clear the current error */
  clearError: () => void;
  /** Name of the active STT provider ('whisper' | 'web-speech') */
  providerName: 'whisper' | 'web-speech';
}

// ============================================================================
// Constants
// ============================================================================

const AUTO_CLEAR_ERROR_MS = 3000;

// ============================================================================
// Hook Implementation
// ============================================================================

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    language = DEFAULT_VOICE_CONFIG.language,
    silenceTimeoutMs = DEFAULT_VOICE_CONFIG.silenceTimeoutMs,
    tier = 'free',
    onTranscript,
    onError,
  } = options;

  // Render-triggering state
  const [state, setState] = useState<VoiceRecognitionState>('idle');
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [error, setError] = useState<VoiceError | null>(null);

  // Mutable refs for provider and timers (never trigger re-renders)
  const providerRef = useRef<ISpeechRecognitionProvider | null>(null);
  const errorClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable refs for latest callback values to avoid stale closures
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Browser support check (SSR-safe, computed once)
  const [isSupported] = useState(() => isSpeechRecognitionSupported());

  // Determine provider name based on tier + support
  const providerName: 'whisper' | 'web-speech' = useMemo(() => {
    if (tier === 'premium' || tier === 'admin') {
      // Check if MediaRecorder is available for WhisperProvider
      if (typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined') {
        return 'whisper';
      }
    }
    return 'web-speech';
  }, [tier]);

  // ------------------------------------------------------------------
  // Error helpers
  // ------------------------------------------------------------------

  const clearErrorTimer = useCallback(() => {
    if (errorClearTimerRef.current !== null) {
      clearTimeout(errorClearTimerRef.current);
      errorClearTimerRef.current = null;
    }
  }, []);

  const clearError = useCallback(() => {
    clearErrorTimer();
    setError(null);
  }, [clearErrorTimer]);

  const scheduleErrorClear = useCallback(
    (voiceError: VoiceError) => {
      clearErrorTimer();
      if (voiceError.recoverable) {
        errorClearTimerRef.current = setTimeout(() => {
          setError(null);
          errorClearTimerRef.current = null;
        }, AUTO_CLEAR_ERROR_MS);
      }
    },
    [clearErrorTimer]
  );

  // ------------------------------------------------------------------
  // Provider lifecycle
  // ------------------------------------------------------------------

  const getOrCreateProvider = useCallback((): ISpeechRecognitionProvider => {
    if (providerRef.current === null) {
      // TODO: Pass tier to createSpeechRecognitionProvider once #328 merges
      providerRef.current = createSpeechRecognitionProvider();
    }
    return providerRef.current;
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    // If already listening or processing, ignore
    const provider = getOrCreateProvider();
    if (provider.state !== 'idle' && provider.state !== 'error') return;

    // Clear any previous state
    clearError();
    setInterimText('');
    setFinalText('');

    const config: SpeechRecognitionConfig = {
      language,
      interimResults: true,
      silenceTimeoutMs,
      maxDurationMs: DEFAULT_VOICE_CONFIG.maxDurationMs,
      noSpeechTimeoutMs: DEFAULT_VOICE_CONFIG.noSpeechTimeoutMs,
    };

    const events: SpeechRecognitionEvents = {
      onInterimResult: (text: string) => {
        setInterimText(text);
      },

      onFinalResult: (text: string, confidence: number) => {
        setInterimText('');
        setFinalText(text);
        onTranscriptRef.current?.(text, confidence);
      },

      onSpeechStart: () => {
        // State is managed via onStateChange
      },

      onSpeechEnd: () => {
        // State is managed via onStateChange
      },

      onError: (voiceError: VoiceError) => {
        setError(voiceError);
        scheduleErrorClear(voiceError);
        onErrorRef.current?.(voiceError);
      },

      onStateChange: (newState: VoiceRecognitionState) => {
        setState(newState);
      },
    };

    provider.start(config, events);
  }, [
    isSupported,
    getOrCreateProvider,
    clearError,
    language,
    silenceTimeoutMs,
    scheduleErrorClear,
  ]);

  const stopListening = useCallback(() => {
    providerRef.current?.stop();
  }, []);

  const cancelListening = useCallback(() => {
    providerRef.current?.abort();
    setInterimText('');
    setFinalText('');
    setState('idle');
  }, []);

  // ------------------------------------------------------------------
  // Cleanup on unmount
  // ------------------------------------------------------------------

  useEffect(() => {
    return () => {
      clearErrorTimer();
      if (providerRef.current !== null) {
        providerRef.current.dispose();
        providerRef.current = null;
      }
    };
  }, [clearErrorTimer]);

  return {
    state,
    interimText,
    finalText,
    startListening,
    stopListening,
    cancelListening,
    isSupported,
    error,
    clearError,
    providerName,
  };
}
