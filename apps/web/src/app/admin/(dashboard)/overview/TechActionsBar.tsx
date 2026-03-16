'use client';

import { useState } from 'react';

import { Download, HeartPulse, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

type TechActionId = 'clear-cache' | 'reindex-all' | 'system-health' | 'export-users';

interface TechActionConfig {
  id: TechActionId;
  label: string;
  icon: React.ElementType;
  type: 'button' | 'link';
  href?: string;
}

// ============================================================================
// Constants
// ============================================================================

const TECH_ACTIONS: TechActionConfig[] = [
  {
    id: 'clear-cache',
    label: 'Clear Cache',
    icon: Trash2,
    type: 'button',
  },
  {
    id: 'reindex-all',
    label: 'Reindex All',
    icon: RefreshCw,
    type: 'button',
  },
  {
    id: 'system-health',
    label: 'System Health',
    icon: HeartPulse,
    type: 'link',
    href: '/admin/monitor',
  },
  {
    id: 'export-users',
    label: 'Export Users',
    icon: Download,
    type: 'button',
  },
];

const BUTTON_CLASS =
  'inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md px-3 py-1.5 transition-colors';

const SEPARATOR_CLASS = 'text-slate-300 dark:text-zinc-600';

// ============================================================================
// Component
// ============================================================================

export function TechActionsBar() {
  const [loadingId, setLoadingId] = useState<TechActionId | null>(null);

  const handleButtonClick = async (id: TechActionId) => {
    setLoadingId(id);
    try {
      // API placeholder — wire up when endpoints are available
      await Promise.resolve();
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1 pt-2 border-t border-slate-200/60 dark:border-zinc-700/40"
      data-testid="tech-actions-bar"
    >
      {TECH_ACTIONS.map((action, index) => {
        const isLoading = loadingId === action.id;
        const Icon = action.icon;

        const iconNode = isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        );

        const content = (
          <>
            {iconNode}
            {action.label}
          </>
        );

        return (
          <span key={action.id} className="inline-flex items-center gap-1">
            {index > 0 && <span className={SEPARATOR_CLASS}>·</span>}

            {action.type === 'link' ? (
              <Link
                href={action.href!}
                className={BUTTON_CLASS}
                data-testid={`tech-action-${action.id}`}
              >
                {content}
              </Link>
            ) : (
              <button
                className={BUTTON_CLASS}
                data-testid={`tech-action-${action.id}`}
                disabled={isLoading}
                onClick={() => handleButtonClick(action.id)}
              >
                {content}
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}

export default TechActionsBar;
