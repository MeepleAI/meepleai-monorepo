'use client';

/**
 * RagDashboard - Main RAG Dashboard component
 *
 * Issue #259: Admin RAG Dashboard
 *
 * Shows pipeline stats, vector metrics, embedding service status,
 * and recent processing activity in a glassmorphism card layout.
 */

import { AlertCircle, CheckCircle2, Clock, Database, Cpu, FileText, Loader2 } from 'lucide-react';

import {
  useRagPipelineStats,
  useRagVectorMetrics,
  useRagEmbeddingStatus,
  useRagRecentActivity,
} from '@/hooks/queries/useRagDashboard';
import type { ProcessingActivityItem } from '@/lib/api/schemas/rag-dashboard.schemas';

// ========== Sub-components ==========

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  status,
  testId,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof Database;
  status?: 'healthy' | 'warning' | 'error' | 'loading';
  testId?: string;
}) {
  const statusColor = {
    healthy: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
    loading: 'text-muted-foreground',
  }[status ?? 'healthy'];

  return (
    <div
      className="rounded-xl border bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-4"
      data-testid={testId}
    >
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 bg-muted/50 ${statusColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground truncate">{title}</p>
          <p className="text-xl font-semibold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function PipelineStatsSection() {
  const { data, isLoading, error } = useRagPipelineStats();

  if (isLoading) {
    return (
      <div
        className="rounded-xl border bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-6"
        data-testid="pipeline-stats-loading"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading pipeline stats...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="rounded-xl border bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-6"
        data-testid="pipeline-stats-error"
      >
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Failed to load pipeline stats</span>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="pipeline-stats">
      <h2 className="text-lg font-semibold mb-3">Pipeline Stats</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Total Documents"
          value={data.totalDocuments}
          icon={FileText}
          testId="stat-total-documents"
        />
        <StatCard
          title="Ready"
          value={data.readyDocuments}
          icon={CheckCircle2}
          status="healthy"
          testId="stat-ready-documents"
        />
        <StatCard
          title="In Progress"
          value={data.inProgressDocuments}
          icon={Clock}
          status={data.inProgressDocuments > 0 ? 'warning' : 'healthy'}
          testId="stat-in-progress-documents"
        />
        <StatCard
          title="Failed"
          value={data.failedDocuments}
          icon={AlertCircle}
          status={data.failedDocuments > 0 ? 'error' : 'healthy'}
          testId="stat-failed-documents"
        />
      </div>

      {/* State breakdown */}
      {Object.keys(data.countByState).length > 0 && (
        <div className="mt-3 rounded-xl border bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">By State</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.countByState).map(([state, count]) => (
              <span
                key={state}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-0.5 text-xs font-medium"
              >
                {state}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VectorMetricsSection() {
  const { data, isLoading, error } = useRagVectorMetrics();

  if (isLoading) {
    return (
      <div
        className="rounded-xl border bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-6"
        data-testid="vector-metrics-loading"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading vector metrics...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="rounded-xl border bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-6"
        data-testid="vector-metrics-error"
      >
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Failed to load vector metrics</span>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="vector-metrics">
      <h2 className="text-lg font-semibold mb-3">Vector Store</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          title="Collections"
          value={data.totalCollections}
          icon={Database}
          testId="stat-collections"
        />
        <StatCard
          title="Total Vectors"
          value={data.totalVectors.toLocaleString()}
          icon={Database}
          testId="stat-vectors"
        />
        <StatCard
          title="Memory"
          value={data.memoryFormatted}
          icon={Database}
          testId="stat-memory"
        />
      </div>
    </div>
  );
}

function EmbeddingStatusSection() {
  const { data, isLoading, error } = useRagEmbeddingStatus();

  if (isLoading) {
    return (
      <div
        className="rounded-xl border bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-6"
        data-testid="embedding-status-loading"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Checking embedding service...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="rounded-xl border bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-6"
        data-testid="embedding-status-error"
      >
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Failed to check embedding service</span>
        </div>
      </div>
    );
  }

  const isHealthy = data.status === 'healthy' || data.status === 'ok';

  return (
    <div data-testid="embedding-status">
      <h2 className="text-lg font-semibold mb-3">Embedding Service</h2>
      <div className="rounded-xl border bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-4">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-lg p-2 ${isHealthy ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}
          >
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium" data-testid="embedding-service-status">
              {isHealthy ? 'Healthy' : data.status}
            </p>
            {data.model && <p className="text-sm text-muted-foreground">Model: {data.model}</p>}
            {data.device && (
              <p className="text-xs text-muted-foreground">
                Device: {data.device} | Dimensions: {data.dimension}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

function stateColor(state: string): string {
  switch (state) {
    case 'Ready':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'Failed':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'Pending':
      return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
    default:
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  }
}

function RecentActivitySection() {
  const { data, isLoading, error } = useRagRecentActivity(15);

  if (isLoading) {
    return (
      <div
        className="rounded-xl border bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-6"
        data-testid="recent-activity-loading"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading recent activity...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="rounded-xl border bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-6"
        data-testid="recent-activity-error"
      >
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Failed to load recent activity</span>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="recent-activity">
      <h2 className="text-lg font-semibold mb-3">
        Recent Activity
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          ({data.totalCount} total)
        </span>
      </h2>
      <div className="rounded-xl border bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md overflow-hidden">
        {data.items.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            No processing activity yet
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.items.map((item: ProcessingActivityItem) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${stateColor(item.processingState)}`}
                >
                  {item.processingState}
                </span>
                <span className="text-sm font-medium truncate flex-1 min-w-0">{item.fileName}</span>
                {item.pageCount && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {item.pageCount}p
                  </span>
                )}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimeAgo(item.uploadedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== Main Dashboard ==========

export function RagDashboard() {
  return (
    <div className="space-y-6" data-testid="rag-dashboard">
      <PipelineStatsSection />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VectorMetricsSection />
        <EmbeddingStatusSection />
      </div>
      <RecentActivitySection />
    </div>
  );
}
