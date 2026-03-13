using Api.SharedKernel.Application.Interfaces;

namespace Api.BoundedContexts.DocumentProcessing.Application.Queries;

/// <summary>
/// Query to get recent PDF processing activity for the RAG dashboard.
/// Issue #263: Recent processing activity.
/// </summary>
internal record GetRecentProcessingActivityQuery(int Limit = 20) : IQuery<RecentProcessingActivityDto>;

internal record RecentProcessingActivityDto(
    List<ProcessingActivityItem> Items,
    int TotalCount);

internal record ProcessingActivityItem(
    Guid Id,
    string FileName,
    string ProcessingState,
    DateTime UploadedAt,
    DateTime? ProcessedAt,
    int? PageCount,
    string? ProcessingError,
    Guid GameId);
