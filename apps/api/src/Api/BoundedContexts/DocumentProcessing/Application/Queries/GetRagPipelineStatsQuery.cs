using Api.SharedKernel.Application.Interfaces;

namespace Api.BoundedContexts.DocumentProcessing.Application.Queries;

/// <summary>
/// Aggregates PdfDocument counts by ProcessingState for the RAG pipeline dashboard.
/// Issue #260: RAG pipeline stats query.
/// </summary>
internal record GetRagPipelineStatsQuery : IQuery<RagPipelineStatsDto>;

internal record RagPipelineStatsDto(
    Dictionary<string, int> CountByState,
    int TotalDocuments,
    int ReadyDocuments,
    int FailedDocuments,
    int InProgressDocuments,
    DateTime MeasuredAt);
