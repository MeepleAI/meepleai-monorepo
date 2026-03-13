/**
 * useRagDashboard - TanStack Query hooks for Admin RAG Dashboard
 *
 * Issue #259: Admin RAG Dashboard
 *
 * Provides query hooks for RAG pipeline stats, vector metrics,
 * embedding service status, and recent processing activity.
 */

import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

/**
 * Query key factory for RAG dashboard queries
 */
export const ragDashboardKeys = {
  all: ['rag-dashboard'] as const,
  pipelineStats: () => [...ragDashboardKeys.all, 'pipeline-stats'] as const,
  vectorMetrics: () => [...ragDashboardKeys.all, 'vector-metrics'] as const,
  embeddingStatus: () => [...ragDashboardKeys.all, 'embedding-status'] as const,
  recentActivity: (limit?: number) => [...ragDashboardKeys.all, 'recent-activity', limit] as const,
};

/**
 * Hook to fetch RAG pipeline document counts by processing state
 */
export function useRagPipelineStats() {
  return useQuery({
    queryKey: ragDashboardKeys.pipelineStats(),
    queryFn: () => api.admin.getRagPipelineStats(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

/**
 * Hook to fetch vector store collection metrics
 */
export function useRagVectorMetrics() {
  return useQuery({
    queryKey: ragDashboardKeys.vectorMetrics(),
    queryFn: () => api.admin.getRagVectorMetrics(),
    staleTime: 60_000,
  });
}

/**
 * Hook to fetch embedding service health status
 */
export function useRagEmbeddingStatus() {
  return useQuery({
    queryKey: ragDashboardKeys.embeddingStatus(),
    queryFn: () => api.admin.getRagEmbeddingStatus(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

/**
 * Hook to fetch recent PDF processing activity
 */
export function useRagRecentActivity(limit?: number) {
  return useQuery({
    queryKey: ragDashboardKeys.recentActivity(limit),
    queryFn: () => api.admin.getRagRecentActivity(limit),
    staleTime: 15_000,
    refetchInterval: 15_000,
  });
}
