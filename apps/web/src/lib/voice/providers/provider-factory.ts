/**
 * Speech Recognition Provider Factory
 *
 * Creates the appropriate ISpeechRecognitionProvider based on
 * user tier and environment configuration.
 *
 * - Paid tiers (premium/admin): WhisperProvider (cloud STT via backend proxy)
 * - Free tier / fallback: WebSpeechProvider (browser native API)
 */

import { WebSpeechProvider } from './web-speech-provider';
import { WhisperProvider } from './whisper-provider';

import type { ISpeechRecognitionProvider } from '../types';

export type UserTier = 'free' | 'premium' | 'admin';

/**
 * Creates a speech recognition provider based on user tier.
 *
 * @param tier - User's subscription tier. Defaults to 'free'.
 * @returns The appropriate ISpeechRecognitionProvider for the tier.
 */
export function createSpeechRecognitionProvider(
  tier: UserTier = 'free'
): ISpeechRecognitionProvider {
  if (tier === 'premium' || tier === 'admin') {
    const whisper = new WhisperProvider();
    if (whisper.isSupported) {
      return whisper;
    }
    // Fall back to WebSpeech if MediaRecorder not available
  }

  return new WebSpeechProvider();
}
