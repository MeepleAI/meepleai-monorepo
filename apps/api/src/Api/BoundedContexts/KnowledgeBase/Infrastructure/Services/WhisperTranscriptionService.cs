using System.Net.Http.Headers;
using System.Text.Json;
using Api.BoundedContexts.KnowledgeBase.Domain.Services;
using Api.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Api.BoundedContexts.KnowledgeBase.Infrastructure.Services;

/// <summary>
/// Issue #327: OpenAI Whisper API proxy for speech-to-text transcription.
/// </summary>
internal sealed class WhisperTranscriptionService : ITranscriptionService
{
    private static readonly Uri WhisperApiUri = new("https://api.openai.com/v1/audio/transcriptions");
    private const long MaxFileSizeBytes = 25 * 1024 * 1024; // 25 MB (Whisper limit)

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".flac", ".m4a", ".mp3", ".mp4", ".mpeg", ".mpga", ".oga", ".ogg", ".wav", ".webm"
    };

    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _model;
    private readonly ILogger<WhisperTranscriptionService> _logger;

    public WhisperTranscriptionService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<WhisperTranscriptionService> logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        _apiKey = SecretsHelper.GetSecretOrValue(configuration, "WHISPER_API_KEY", logger, required: false)
            ?? SecretsHelper.GetSecretOrValue(configuration, "OPENROUTER_API_KEY", logger, required: false)
            ?? throw new InvalidOperationException(
                "Speech transcription requires WHISPER_API_KEY or OPENROUTER_API_KEY to be configured.");

        _model = configuration["WHISPER_MODEL"] ?? "whisper-1";
    }

    public async Task<TranscriptionResult> TranscribeAsync(
        byte[] audioData,
        string fileName,
        string? language = null,
        CancellationToken cancellationToken = default)
    {
        if (audioData is null || audioData.Length == 0)
            throw new ArgumentException("Audio data cannot be empty.", nameof(audioData));

        if (audioData.Length > MaxFileSizeBytes)
            throw new ArgumentException(
                $"Audio file exceeds maximum size of {MaxFileSizeBytes / (1024 * 1024)} MB.",
                nameof(audioData));

        var extension = Path.GetExtension(fileName);
        if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
            throw new ArgumentException(
                $"Unsupported audio format '{extension}'. Supported: {string.Join(", ", AllowedExtensions)}",
                nameof(fileName));

        _logger.LogInformation(
            "Transcribing audio: {FileName} ({Size} bytes, language: {Language})",
            fileName, audioData.Length, language ?? "auto");

        using var content = new MultipartFormDataContent();

        var fileContent = new ByteArrayContent(audioData);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(GetMimeType(extension));
        content.Add(fileContent, "file", fileName);
        content.Add(new StringContent(_model), "model");
        content.Add(new StringContent("verbose_json"), "response_format");

        if (!string.IsNullOrWhiteSpace(language))
        {
            content.Add(new StringContent(language), "language");
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, WhisperApiUri)
        {
            Content = content
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

        using var response = await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            _logger.LogError(
                "Whisper API error {StatusCode}: {Body}",
                (int)response.StatusCode, errorBody);
            throw new InvalidOperationException(
                $"Whisper API returned {(int)response.StatusCode}: {response.ReasonPhrase}");
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var text = root.GetProperty("text").GetString() ?? string.Empty;
        var detectedLanguage = root.TryGetProperty("language", out var langProp)
            ? langProp.GetString() ?? "unknown"
            : language ?? "unknown";
        var duration = root.TryGetProperty("duration", out var durProp)
            ? durProp.GetDouble()
            : 0.0;

        _logger.LogInformation(
            "Transcription complete: {Length} chars, language={Language}, duration={Duration}s",
            text.Length, detectedLanguage, duration);

        return new TranscriptionResult(text, detectedLanguage, duration);
    }

    private static string GetMimeType(string extension) => extension.ToLowerInvariant() switch
    {
        ".mp3" => "audio/mpeg",
        ".mp4" or ".m4a" => "audio/mp4",
        ".wav" => "audio/wav",
        ".webm" => "audio/webm",
        ".ogg" or ".oga" => "audio/ogg",
        ".flac" => "audio/flac",
        ".mpeg" or ".mpga" => "audio/mpeg",
        _ => "application/octet-stream"
    };
}
