import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { VoiceChatButton } from '../VoiceChatButton';

describe('VoiceChatButton', () => {
  it('renders mic button and quality badge', () => {
    render(<VoiceChatButton state="idle" onTap={vi.fn()} providerName="whisper" />);

    expect(screen.getByTestId('voice-chat-button')).toBeInTheDocument();
    expect(screen.getByTestId('voice-quality-badge')).toBeInTheDocument();
  });

  it('shows AI badge for whisper provider', () => {
    render(<VoiceChatButton state="idle" onTap={vi.fn()} providerName="whisper" />);

    const badge = screen.getByTestId('voice-quality-badge');
    expect(badge).toHaveTextContent('AI');
  });

  it('shows STT badge for web-speech provider', () => {
    render(<VoiceChatButton state="idle" onTap={vi.fn()} providerName="web-speech" />);

    const badge = screen.getByTestId('voice-quality-badge');
    expect(badge).toHaveTextContent('STT');
  });

  it('forwards onTap to underlying VoiceMicButton', () => {
    const onTap = vi.fn();
    render(<VoiceChatButton state="idle" onTap={onTap} providerName="whisper" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onTap).toHaveBeenCalledOnce();
  });

  it('disables button when disabled prop is true', () => {
    render(<VoiceChatButton state="idle" onTap={vi.fn()} disabled providerName="whisper" />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders with listening state', () => {
    render(<VoiceChatButton state="listening" onTap={vi.fn()} providerName="whisper" />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });
});
