using Api.SharedKernel.Application.Interfaces;

namespace Api.BoundedContexts.DocumentProcessing.Application.Queries;

/// <summary>
/// Query to check embedding service health status.
/// Issue #262: Embedding service health check for RAG dashboard.
/// </summary>
internal record GetEmbeddingServiceStatusQuery : IQuery<EmbeddingServiceStatusDto>;

internal record EmbeddingServiceStatusDto(
    string Status,
    string? Model,
    string? Device,
    int Dimension,
    DateTime CheckedAt);
