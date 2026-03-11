'use client';

/**
 * KbProcessingBanner — Degraded mode banner when KB is still processing.
 *
 * Polls document status every 10 seconds. Shows processing state,
 * then transitions to "ready" when KB indexing completes.
 *
 * Issue #123 — Game Night Quick Start Wizard
 */

import { useEffect, useState } from 'react';

import { Check, Loader2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface KbProcessingBannerProps {
  gameId: string;
  onReady?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function KbProcessingBanner({ gameId, onReady }: KbProcessingBannerProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/documents/game/${gameId}/status`);
        const data = await response.json();
        if (data.isReady) {
          setReady(true);
          onReady?.();
          clearInterval(interval);
        }
      } catch {
        // Ignore polling errors — will retry on next interval
      }
    }, 10_000);

    return () => clearInterval(interval);
  }, [gameId, onReady]);

  if (ready) {
    return (
      <div
        className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm flex items-center gap-2 text-green-700 dark:text-green-300"
        data-testid="kb-banner-ready"
      >
        <Check className="h-4 w-4" aria-hidden="true" />
        Regolamento pronto! L&apos;agente AI conosce le regole.
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm flex items-center gap-2 text-amber-700 dark:text-amber-200"
      data-testid="kb-banner-processing"
    >
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      Regolamento in elaborazione... L&apos;agente avrà accesso alle regole tra poco.
    </div>
  );
}
