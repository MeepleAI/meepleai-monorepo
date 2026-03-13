using Api.BoundedContexts.Administration.Application.Queries.Resources;
using Api.BoundedContexts.DocumentProcessing.Application.Queries;
using Api.Filters;
using MediatR;

namespace Api.Routing;

/// <summary>
/// Admin endpoints for the RAG dashboard overview.
/// Issue #264: Wire endpoints under /api/v1/admin/rag-dashboard/.
/// </summary>
internal static class AdminRagDashboardEndpoints
{
    public static RouteGroupBuilder MapAdminRagDashboardEndpoints(this RouteGroupBuilder group)
    {
        var ragGroup = group.MapGroup("/admin/rag-dashboard")
            .WithTags("Admin", "RAG Dashboard")
            .AddEndpointFilter<RequireAdminSessionFilter>();

        // GET /api/v1/admin/rag-dashboard/pipeline-stats
        ragGroup.MapGet("/pipeline-stats", GetPipelineStats)
            .WithName("GetRagPipelineStats")
            .WithSummary("Get RAG pipeline document counts by processing state");

        // GET /api/v1/admin/rag-dashboard/vector-metrics
        ragGroup.MapGet("/vector-metrics", GetVectorMetrics)
            .WithName("GetRagVectorMetrics")
            .WithSummary("Get vector store collection statistics");

        // GET /api/v1/admin/rag-dashboard/embedding-status
        ragGroup.MapGet("/embedding-status", GetEmbeddingStatus)
            .WithName("GetRagEmbeddingStatus")
            .WithSummary("Get embedding service health status");

        // GET /api/v1/admin/rag-dashboard/recent-activity
        ragGroup.MapGet("/recent-activity", GetRecentActivity)
            .WithName("GetRagRecentActivity")
            .WithSummary("Get recent PDF processing activity");

        return group;
    }

    private static async Task<IResult> GetPipelineStats(
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetRagPipelineStatsQuery(), cancellationToken)
            .ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetVectorMetrics(
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetVectorStoreMetricsQuery(), cancellationToken)
            .ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetEmbeddingStatus(
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetEmbeddingServiceStatusQuery(), cancellationToken)
            .ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetRecentActivity(
        IMediator mediator,
        int? limit,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(
            new GetRecentProcessingActivityQuery(limit ?? 20), cancellationToken)
            .ConfigureAwait(false);
        return Results.Ok(result);
    }
}
