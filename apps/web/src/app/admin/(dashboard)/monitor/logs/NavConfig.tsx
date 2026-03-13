'use client';

/**
 * LogsNavConfig — sets breadcrumb/nav for the Log Viewer page
 * Issue #140
 */

import { useEffect } from 'react';

import { useSetNavConfig } from '@/hooks/useSetNavConfig';

export function LogsNavConfig(): null {
  const setNavConfig = useSetNavConfig();

  useEffect(() => {
    setNavConfig({
      title: 'Log Viewer',
      breadcrumbs: [
        { label: 'Admin', href: '/admin' },
        { label: 'Monitor', href: '/admin/monitor' },
        { label: 'Log Viewer' },
      ],
    });
  }, [setNavConfig]);

  return null;
}
