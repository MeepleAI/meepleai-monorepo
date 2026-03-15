using System.Text.Json;
using Api.Services;
using Microsoft.Extensions.Logging;

namespace Api.BoundedContexts.KnowledgeBase.Domain.Services.Enhancements;

/// <summary>
/// RAG-Fusion query expander: generates alternative query phrasings via LLM
/// to improve retrieval recall through multi-query search.
/// </summary>
internal sealed class QueryExpander : IQueryExpander
{
    private readonly ILlmService _llmService;
    private readonly ILogger<QueryExpander> _logger;

    private const string SystemPrompt =
        "You are a query expansion assistant for board game documentation search. " +
        "Given a user question, generate 2-3 alternative phrasings that might match game rules documentation. " +
        "Return ONLY a JSON array of strings, no other text. Example: [\"alt1\", \"alt2\"]";

    public QueryExpander(ILlmService llmService, ILogger<QueryExpander> logger)
    {
        _llmService = llmService ?? throw new ArgumentNullException(nameof(llmService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<List<string>> ExpandAsync(string userQuestion, CancellationToken ct)
    {
        var queries = new List<string> { userQuestion };

        try
        {
            var result = await _llmService.GenerateCompletionAsync(
                SystemPrompt,
                userQuestion,
                RequestSource.RagPipeline,
                ct).ConfigureAwait(false);

            if (result.Success && !string.IsNullOrWhiteSpace(result.Response))
            {
                var expansions = JsonSerializer.Deserialize<List<string>>(result.Response.Trim());
                if (expansions != null)
                {
                    queries.AddRange(expansions.Where(e => !string.IsNullOrWhiteSpace(e)).Take(3));
                    _logger.LogDebug("Query expanded: original + {ExpansionCount} alternatives", expansions.Count);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Query expansion failed, using original query only");
        }

        return queries;
    }
}
