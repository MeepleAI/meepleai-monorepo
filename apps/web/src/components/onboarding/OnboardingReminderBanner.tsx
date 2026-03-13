'use client';

/**
 * OnboardingReminderBanner Component
 * Issue #326 - Reminder banner for users who skipped the onboarding wizard
 *
 * Self-contained: fetches profile to check hasCompletedOnboarding.
 * Dismissible per session via localStorage.
 */

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import { api } from '@/lib/api';

const DISMISS_KEY = 'meepleai_onboarding_banner_dismissed';

export function OnboardingReminderBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    if (localStorage.getItem(DISMISS_KEY) === 'true') return;

    let cancelled = false;
    api.auth
      .getProfile()
      .then(profile => {
        if (cancelled) return;
        if (profile && !profile.hasCompletedOnboarding) {
          setVisible(true);
        }
      })
      .catch(() => {
        // Silently ignore — user may not be logged in
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, 'true');
    }
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm"
      role="status"
      data-testid="onboarding-reminder-banner"
    >
      <div className="flex items-center gap-2">
        <span className="text-amber-600 text-lg" aria-hidden="true">
          &#9734;
        </span>
        <p className="text-amber-800">
          Complete your setup to get the most out of MeepleAI.{' '}
          <Link href="/setup" className="font-medium text-amber-700 underline hover:text-amber-900">
            Finish onboarding
          </Link>
        </p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 text-amber-500 hover:text-amber-700"
        aria-label="Dismiss onboarding reminder"
        data-testid="dismiss-onboarding-banner"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
