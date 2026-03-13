/**
 * RagDashboard Component Tests
 * Issue #259 - Admin RAG Dashboard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type {
  RagPipelineStats,
  VectorStoreMetricsResponse,
  EmbeddingServiceStatus,
  RecentProcessingActivity,
} from '@/lib/api/schemas/rag-dashboard.schemas';

// ========== Mock API ==========

const mockGetRagPipelineStats = vi.hoisted(() => vi.fn());
const mockGetRagVectorMetrics = vi.hoisted(() => vi.fn());
const mockGetRagEmbeddingStatus = vi.hoisted(() => vi.fn());
const mockGetRagRecentActivity = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  api: {
    admin: {
      getRagPipelineStats: mockGetRagPipelineStats,
      getRagVectorMetrics: mockGetRagVectorMetrics,
      getRagEmbeddingStatus: mockGetRagEmbeddingStatus,
      getRagRecentActivity: mockGetRagRecentActivity,
    },
  },
}));

import { RagDashboard } from '../RagDashboard';

// ========== Test Fixtures ==========

const mockPipelineStats: RagPipelineStats = {
  countByState: {
    Pending: 2,
    Extracting: 1,
    Ready: 15,
    Failed: 3,
  },
  totalDocuments: 21,
  readyDocuments: 15,
  failedDocuments: 3,
  inProgressDocuments: 3,
  measuredAt: new Date().toISOString(),
};

const mockVectorMetrics: VectorStoreMetricsResponse = {
  totalCollections: 3,
  totalVectors: 12500,
  indexedVectors: 12400,
  memoryBytes: 52_428_800,
  memoryFormatted: '50 MB',
  collections: [
    {
      collectionName: 'game_docs',
      vectorCount: 10000,
      indexedCount: 9900,
      vectorDimensions: 1024,
      distanceMetric: 'Cosine',
      memoryBytes: 40_000_000,
      memoryFormatted: '38.15 MB',
    },
  ],
  measuredAt: new Date().toISOString(),
};

const mockEmbeddingStatus: EmbeddingServiceStatus = {
  status: 'healthy',
  model: 'multilingual-e5-large-instruct',
  device: 'cuda',
  dimension: 1024,
  checkedAt: new Date().toISOString(),
};

const mockRecentActivity: RecentProcessingActivity = {
  items: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      fileName: 'catan-rules.pdf',
      processingState: 'Ready',
      uploadedAt: new Date(Date.now() - 3_600_000).toISOString(),
      processedAt: new Date(Date.now() - 3_000_000).toISOString(),
      pageCount: 24,
      processingError: null,
      gameId: '00000000-0000-0000-0000-000000000010',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      fileName: 'ticket-to-ride.pdf',
      processingState: 'Failed',
      uploadedAt: new Date(Date.now() - 7_200_000).toISOString(),
      processedAt: null,
      pageCount: null,
      processingError: 'Extraction timeout',
      gameId: '00000000-0000-0000-0000-000000000020',
    },
  ],
  totalCount: 42,
};

// ========== Test Helpers ==========

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createQueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

// ========== Tests ==========

describe('RagDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRagPipelineStats.mockResolvedValue(mockPipelineStats);
    mockGetRagVectorMetrics.mockResolvedValue(mockVectorMetrics);
    mockGetRagEmbeddingStatus.mockResolvedValue(mockEmbeddingStatus);
    mockGetRagRecentActivity.mockResolvedValue(mockRecentActivity);
  });

  it('renders the dashboard container', async () => {
    renderWithProviders(<RagDashboard />);
    await waitFor(() => {
      expect(screen.getByTestId('rag-dashboard')).toBeInTheDocument();
    });
  });

  it('renders pipeline stats with document counts', async () => {
    renderWithProviders(<RagDashboard />);
    await waitFor(() => {
      expect(screen.getByTestId('pipeline-stats')).toBeInTheDocument();
    });
    expect(screen.getByTestId('stat-total-documents')).toHaveTextContent('21');
    expect(screen.getByTestId('stat-ready-documents')).toHaveTextContent('15');
    expect(screen.getByTestId('stat-failed-documents')).toHaveTextContent('3');
    expect(screen.getByTestId('stat-in-progress-documents')).toHaveTextContent('3');
  });

  it('renders vector store metrics', async () => {
    renderWithProviders(<RagDashboard />);
    await waitFor(() => {
      expect(screen.getByTestId('vector-metrics')).toBeInTheDocument();
    });
    expect(screen.getByTestId('stat-collections')).toHaveTextContent('3');
    // toLocaleString output is locale-dependent; check for the raw number
    expect(screen.getByTestId('stat-vectors')).toHaveTextContent(/12[.,]?500/);
    expect(screen.getByTestId('stat-memory')).toHaveTextContent('50 MB');
  });

  it('renders embedding service status', async () => {
    renderWithProviders(<RagDashboard />);
    await waitFor(() => {
      expect(screen.getByTestId('embedding-status')).toBeInTheDocument();
    });
    expect(screen.getByTestId('embedding-service-status')).toHaveTextContent('Healthy');
    expect(
      screen.getByText('multilingual-e5-large-instruct', { exact: false })
    ).toBeInTheDocument();
  });

  it('renders recent activity list', async () => {
    renderWithProviders(<RagDashboard />);
    await waitFor(() => {
      expect(screen.getByTestId('recent-activity')).toBeInTheDocument();
    });
    expect(screen.getByText('catan-rules.pdf')).toBeInTheDocument();
    expect(screen.getByText('ticket-to-ride.pdf')).toBeInTheDocument();
    expect(screen.getByText('42 total', { exact: false })).toBeInTheDocument();
  });

  it('shows loading states initially', () => {
    mockGetRagPipelineStats.mockReturnValue(new Promise(() => {}));
    mockGetRagVectorMetrics.mockReturnValue(new Promise(() => {}));
    mockGetRagEmbeddingStatus.mockReturnValue(new Promise(() => {}));
    mockGetRagRecentActivity.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<RagDashboard />);
    expect(screen.getByTestId('pipeline-stats-loading')).toBeInTheDocument();
    expect(screen.getByTestId('vector-metrics-loading')).toBeInTheDocument();
    expect(screen.getByTestId('embedding-status-loading')).toBeInTheDocument();
    expect(screen.getByTestId('recent-activity-loading')).toBeInTheDocument();
  });

  it('shows error states when API fails', async () => {
    mockGetRagPipelineStats.mockRejectedValue(new Error('Network error'));
    mockGetRagVectorMetrics.mockRejectedValue(new Error('Network error'));
    mockGetRagEmbeddingStatus.mockRejectedValue(new Error('Network error'));
    mockGetRagRecentActivity.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<RagDashboard />);
    await waitFor(() => {
      expect(screen.getByTestId('pipeline-stats-error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('vector-metrics-error')).toBeInTheDocument();
    expect(screen.getByTestId('embedding-status-error')).toBeInTheDocument();
    expect(screen.getByTestId('recent-activity-error')).toBeInTheDocument();
  });

  it('shows unhealthy embedding status correctly', async () => {
    mockGetRagEmbeddingStatus.mockResolvedValue({
      ...mockEmbeddingStatus,
      status: 'unavailable',
      model: null,
      device: null,
    });

    renderWithProviders(<RagDashboard />);
    await waitFor(() => {
      expect(screen.getByTestId('embedding-service-status')).toHaveTextContent('unavailable');
    });
  });
});
