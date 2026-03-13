using Api.BoundedContexts.DocumentProcessing.Application.Queries;
using Api.Infrastructure;
using Api.SharedKernel.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Api.BoundedContexts.DocumentProcessing.Application.Handlers;

/// <summary>
/// Handler for GetRecentProcessingActivityQuery.
/// Returns recent PdfDocuments ordered by upload date.
/// Issue #263: Recent processing activity.
/// </summary>
internal sealed class GetRecentProcessingActivityQueryHandler
    : IQueryHandler<GetRecentProcessingActivityQuery, RecentProcessingActivityDto>
{
    private readonly MeepleAiDbContext _dbContext;

    public GetRecentProcessingActivityQueryHandler(MeepleAiDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<RecentProcessingActivityDto> Handle(
        GetRecentProcessingActivityQuery request, CancellationToken cancellationToken)
    {
        var limit = Math.Clamp(request.Limit, 1, 100);

        var items = await _dbContext.PdfDocuments
            .AsNoTracking()
            .OrderByDescending(p => p.UploadedAt)
            .Take(limit)
            .Select(p => new ProcessingActivityItem(
                p.Id,
                p.FileName,
                p.ProcessingState,
                p.UploadedAt,
                p.ProcessedAt,
                p.PageCount,
                p.ProcessingError,
                p.GameId ?? Guid.Empty))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var totalCount = await _dbContext.PdfDocuments
            .AsNoTracking()
            .CountAsync(cancellationToken)
            .ConfigureAwait(false);

        return new RecentProcessingActivityDto(items, totalCount);
    }
}
