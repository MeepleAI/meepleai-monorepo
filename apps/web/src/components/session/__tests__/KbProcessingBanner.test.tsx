import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { KbProcessingBanner } from '../KbProcessingBanner';

describe('KbProcessingBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows processing state initially', () => {
    render(<KbProcessingBanner gameId="game-1" />);

    expect(screen.getByTestId('kb-banner-processing')).toBeInTheDocument();
    expect(screen.getByText(/regolamento in elaborazione/i)).toBeInTheDocument();
  });

  it('transitions to ready state when KB is indexed', async () => {
    const onReady = vi.fn();
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ isReady: true }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<KbProcessingBanner gameId="game-1" onReady={onReady} />);

    // Initially processing
    expect(screen.getByTestId('kb-banner-processing')).toBeInTheDocument();

    // Advance timer to trigger poll
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });

    expect(screen.getByTestId('kb-banner-ready')).toBeInTheDocument();
    expect(screen.getByText(/regolamento pronto/i)).toBeInTheDocument();
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('keeps polling when KB is not ready', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ isReady: false }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<KbProcessingBanner gameId="game-1" />);

    // First poll
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });

    expect(screen.getByTestId('kb-banner-processing')).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second poll
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
