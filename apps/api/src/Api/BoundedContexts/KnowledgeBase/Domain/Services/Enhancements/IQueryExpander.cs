namespace Api.BoundedContexts.KnowledgeBase.Domain.Services.Enhancements;

/// <summary>
/// RAG Enhancement: Query expansion for RAG-Fusion.
/// Generates alternative query phrasings to improve retrieval recall.
/// </summary>
internal interface IQueryExpander
{
    /// <summary>
    /// Expands a user question into multiple query variants for multi-query retrieval.
    /// </summary>
    Task<List<string>> ExpandAsync(string userQuestion, CancellationToken ct);
}
