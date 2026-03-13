using System.Text.Json;
using Api.BoundedContexts.DocumentProcessing.Application.Queries;
using Api.SharedKernel.Application.Interfaces;

namespace Api.BoundedContexts.DocumentProcessing.Application.Handlers;

/// <summary>
/// Handler for GetEmbeddingServiceStatusQuery.
/// Calls the embedding service /health endpoint.
/// Issue #262: Embedding service health check.
/// </summary>
internal sealed class GetEmbeddingServiceStatusQueryHandler
    : IQueryHandler<GetEmbeddingServiceStatusQuery, EmbeddingServiceStatusDto>
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<GetEmbeddingServiceStatusQueryHandler> _logger;

    public GetEmbeddingServiceStatusQueryHandler(
        IHttpClientFactory httpClientFactory,
        ILogger<GetEmbeddingServiceStatusQueryHandler> logger)
    {
        _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<EmbeddingServiceStatusDto> Handle(
        GetEmbeddingServiceStatusQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var client = _httpClientFactory.CreateClient("EmbeddingService");
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(5));

            var response = await client.GetAsync("/health", cts.Token).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                return new EmbeddingServiceStatusDto(
                    Status: "unhealthy",
                    Model: null,
                    Device: null,
                    Dimension: 0,
                    CheckedAt: DateTime.UtcNow);
            }

            var json = await response.Content.ReadAsStringAsync(cts.Token).ConfigureAwait(false);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            return new EmbeddingServiceStatusDto(
                Status: root.TryGetProperty("status", out var s) ? s.GetString() ?? "unknown" : "unknown",
                Model: root.TryGetProperty("model", out var m) ? m.GetString() : null,
                Device: root.TryGetProperty("device", out var d) ? d.GetString() : null,
                Dimension: 1024,
                CheckedAt: DateTime.UtcNow);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check embedding service health");
            return new EmbeddingServiceStatusDto(
                Status: "unavailable",
                Model: null,
                Device: null,
                Dimension: 0,
                CheckedAt: DateTime.UtcNow);
        }
    }
}
