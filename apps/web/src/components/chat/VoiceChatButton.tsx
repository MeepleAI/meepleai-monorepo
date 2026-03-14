'use client';

/**
 * VoiceChatButton - Composite voice input button with quality badge (#329)
 *
 * Wraps VoiceMicButton with a provider quality badge showing whether
 * the user is using Whisper (cloud) or WebSpeech (browser) STT.
 * Integrates into the chat input area.
 */

import { cn } from '@/lib/utils';
import type { VoiceRecognitionState } from '@/lib/voice/types';

import { VoiceMicButton } from '../chat-unified/VoiceMicButton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VoiceChatButtonProps {
  state: VoiceRecognitionState;
  onTap: () => void;
  disabled?: boolean;
  /** Which STT provider is active */
  providerName: 'whisper' | 'web-speech';
  /** sm = 32px, md = 40px */
  size?: 'sm' | 'md';
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVIDER_LABELS: Record<'whisper' | 'web-speech', string> = {
  whisper: 'AI',
  'web-speech': 'STT',
};

const PROVIDER_COLORS: Record<'whisper' | 'web-speech', string> = {
  whisper: 'bg-amber-500/90 text-white',
  'web-speech': 'bg-muted text-muted-foreground',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VoiceChatButton({
  state,
  onTap,
  disabled = false,
  providerName,
  size = 'md',
  className,
}: VoiceChatButtonProps) {
  const showBadge = state !== 'idle' || !disabled;

  return (
    <div className={cn('relative inline-flex', className)} data-testid="voice-chat-button">
      <VoiceMicButton state={state} onTap={onTap} disabled={disabled} size={size} />

      {/* Quality badge */}
      {showBadge && (
        <span
          className={cn(
            'absolute -top-1 -right-1 px-1 rounded text-[9px] font-bold leading-tight pointer-events-none select-none',
            PROVIDER_COLORS[providerName]
          )}
          data-testid="voice-quality-badge"
          aria-label={
            providerName === 'whisper' ? 'Cloud AI transcription' : 'Browser speech recognition'
          }
        >
          {PROVIDER_LABELS[providerName]}
        </span>
      )}
    </div>
  );
}
