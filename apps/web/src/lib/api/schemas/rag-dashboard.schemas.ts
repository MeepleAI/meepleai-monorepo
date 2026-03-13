/**
 * RAG Dashboard Schemas (Issue #259)
 *
 * Zod schemas for admin RAG dashboard endpoints:
 * pipeline stats, vector metrics, embedding status, recent activity.
 */

import { z } from 'zod';

// ========== Pipeline Stats (Issue #260) ==========

export const RagPipelineStatsSchema = z.object({
  countByState: z.record(z.string(), z.number()),
  totalDocuments: z.number(),
  readyDocuments: z.number(),
  failedDocuments: z.number(),
  inProgressDocuments: z.number(),
  measuredAt: z.string(),
});

export type RagPipelineStats = z.infer<typeof RagPipelineStatsSchema>;

// ========== Vector Store Metrics (Issue #261) ==========

export const CollectionStatsSchema = z.object({
  collectionName: z.string(),
  vectorCount: z.number(),
  indexedCount: z.number(),
  vectorDimensions: z.number(),
  distanceMetric: z.string(),
  memoryBytes: z.number(),
  memoryFormatted: z.string(),
});

export const VectorStoreMetricsResponseSchema = z.object({
  totalCollections: z.number(),
  totalVectors: z.number(),
  indexedVectors: z.number(),
  memoryBytes: z.number(),
  memoryFormatted: z.string(),
  collections: z.array(CollectionStatsSchema),
  measuredAt: z.string(),
});

export type VectorStoreMetricsResponse = z.infer<typeof VectorStoreMetricsResponseSchema>;

// ========== Embedding Service Status (Issue #262) ==========

export const EmbeddingServiceStatusSchema = z.object({
  status: z.string(),
  model: z.string().nullable(),
  device: z.string().nullable(),
  dimension: z.number(),
  checkedAt: z.string(),
});

export type EmbeddingServiceStatus = z.infer<typeof EmbeddingServiceStatusSchema>;

// ========== Recent Processing Activity (Issue #263) ==========

export const ProcessingActivityItemSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  processingState: z.string(),
  uploadedAt: z.string(),
  processedAt: z.string().nullable(),
  pageCount: z.number().nullable(),
  processingError: z.string().nullable(),
  gameId: z.string(),
});

export const RecentProcessingActivitySchema = z.object({
  items: z.array(ProcessingActivityItemSchema),
  totalCount: z.number(),
});

export type ProcessingActivityItem = z.infer<typeof ProcessingActivityItemSchema>;
export type RecentProcessingActivity = z.infer<typeof RecentProcessingActivitySchema>;
