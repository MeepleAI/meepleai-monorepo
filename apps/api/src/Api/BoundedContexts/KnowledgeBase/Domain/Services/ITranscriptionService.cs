namespace Api.BoundedContexts.KnowledgeBase.Domain.Services;

/// <summary>
/// Issue #327: Service for transcribing audio to text using speech-to-text providers.
/// </summary>
public interface ITranscriptionService
{
    /// <summary>
    /// Transcribes audio data to text.
    /// </summary>
    /// <param name="audioData">Raw audio bytes</param>
    /// <param name="fileName">Original filename with extension (used for format detection)</param>
    /// <param name="language">Optional language hint (e.g., "it", "en")</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Transcription result with text and metadata</returns>
    Task<TranscriptionResult> TranscribeAsync(
        byte[] audioData,
        string fileName,
        string? language = null,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Result of a speech-to-text transcription.
/// </summary>
public record TranscriptionResult(
    string Text,
    string Language,
    double DurationSeconds);
