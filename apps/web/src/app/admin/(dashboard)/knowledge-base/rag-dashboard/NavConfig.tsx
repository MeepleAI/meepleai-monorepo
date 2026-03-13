'use client';

/**
 * RagDashboardNavConfig - Registers ActionBar actions for RAG Dashboard
 * Issue #259 - Admin RAG Dashboard
 */

import { useEffect } from 'react';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useSetNavConfig } from '@/hooks/useSetNavConfig';

export function RagDashboardNavConfig() {
  const setNavConfig = useSetNavConfig();
  const router = useRouter();

  useEffect(() => {
    setNavConfig({
      miniNav: [],
      actionBar: [
        {
          id: 'refresh',
          label: 'Refresh',
          icon: RefreshCw,
          variant: 'primary',
          onClick: () => router.push('/admin/knowledge-base/rag-dashboard?action=refresh'),
        },
      ],
    });
  }, [setNavConfig, router]);

  return null;
}
