using Api.BoundedContexts.DocumentProcessing.Application.Queries;
using Api.BoundedContexts.DocumentProcessing.Domain.Enums;
using Api.Infrastructure;
using Api.SharedKernel.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Api.BoundedContexts.DocumentProcessing.Application.Handlers;

/// <summary>
/// Handler for GetRagPipelineStatsQuery.
/// Aggregates PdfDocument counts by ProcessingState.
/// Issue #260: RAG pipeline stats.
/// </summary>
internal sealed class GetRagPipelineStatsQueryHandler
    : IQueryHandler<GetRagPipelineStatsQuery, RagPipelineStatsDto>
{
    private readonly MeepleAiDbContext _dbContext;

    public GetRagPipelineStatsQueryHandler(MeepleAiDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<RagPipelineStatsDto> Handle(
        GetRagPipelineStatsQuery request, CancellationToken cancellationToken)
    {
        // ProcessingState is already string on the EF entity
        var countByState = await _dbContext.PdfDocuments
            .AsNoTracking()
            .GroupBy(p => p.ProcessingState)
            .Select(g => new { State = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.State, x => x.Count, StringComparer.Ordinal, cancellationToken)
            .ConfigureAwait(false);

        var totalDocuments = countByState.Values.Sum();

        countByState.TryGetValue(PdfProcessingState.Ready.ToString(), out var readyCount);
        countByState.TryGetValue(PdfProcessingState.Failed.ToString(), out var failedCount);

        // In-progress = everything except Pending, Ready, and Failed
        var inProgressStates = new HashSet<string>(StringComparer.Ordinal)
        {
            PdfProcessingState.Uploading.ToString(),
            PdfProcessingState.Extracting.ToString(),
            PdfProcessingState.Chunking.ToString(),
            PdfProcessingState.Embedding.ToString(),
            PdfProcessingState.Indexing.ToString()
        };

        var inProgressCount = countByState
            .Where(kvp => inProgressStates.Contains(kvp.Key))
            .Sum(kvp => kvp.Value);

        return new RagPipelineStatsDto(
            CountByState: countByState,
            TotalDocuments: totalDocuments,
            ReadyDocuments: readyCount,
            FailedDocuments: failedCount,
            InProgressDocuments: inProgressCount,
            MeasuredAt: DateTime.UtcNow);
    }
}
