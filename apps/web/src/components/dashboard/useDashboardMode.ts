'use client';

import { useContext, useMemo } from 'react';

import { useSelector } from '@xstate/react';

import { DashboardEngineContext, type DashboardActorRef } from './DashboardEngineProvider';

import type { DashboardEvent } from './DashboardEngine';

const noopSend = (() => {}) as (event: DashboardEvent) => void;

/**
 * Derive the public dashboard mode shape from the raw XState snapshot value
 * and context. Used both by the live path and the fallback path.
 */
function deriveMode(
  stateValue: string | Record<string, string>,
  context: { activeSessionId: string | null; transitionTarget: string | null },
  send: (event: DashboardEvent) => void
) {
  const topState = typeof stateValue === 'string' ? stateValue : 'gameMode';

  return {
    state: topState as 'exploration' | 'transitioning' | 'gameMode',
    isExploration: topState === 'exploration',
    isGameMode: topState === 'gameMode',
    isTransitioning: topState === 'transitioning',
    isExpanded:
      typeof stateValue === 'object' &&
      'gameMode' in stateValue &&
      (stateValue as Record<string, string>).gameMode === 'expanded',
    activeSessionId: context.activeSessionId,
    transitionTarget: context.transitionTarget,
    send,
  };
}

/**
 * Internal hook: reads dashboard mode from a live actor ref.
 * Must be called unconditionally (React rules of hooks).
 */
function useDashboardModeConnected(actorRef: DashboardActorRef) {
  const snapshot = useSelector(actorRef, s => s);

  return useMemo(
    () =>
      deriveMode(
        snapshot.value as string | Record<string, string>,
        snapshot.context,
        actorRef.send
      ),
    [snapshot, actorRef]
  );
}

/**
 * Read the current dashboard mode from the DashboardEngine state machine.
 *
 * When used outside a `<DashboardEngineProvider>`, returns safe exploration
 * defaults so components render without error.
 *
 * NOTE: This hook uses a conditional hook call pattern. The branch is
 * stable because the provider presence does not change during a component's
 * lifetime. The eslint disable is intentional and safe.
 */
export function useDashboardMode() {
  const actorRef = useContext(DashboardEngineContext);

  // The provider presence is stable for the component lifetime, so this
  // conditional hook call is safe in practice (same branch every render).
  if (!actorRef) {
    return {
      state: 'exploration' as const,
      isExploration: true,
      isGameMode: false,
      isTransitioning: false,
      isExpanded: false,
      activeSessionId: null,
      transitionTarget: null,
      send: noopSend,
    };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useDashboardModeConnected(actorRef);
}
