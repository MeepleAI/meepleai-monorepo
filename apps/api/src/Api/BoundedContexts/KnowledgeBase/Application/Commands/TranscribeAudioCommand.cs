using MediatR;

namespace Api.BoundedContexts.KnowledgeBase.Application.Commands;

/// <summary>
/// Issue #327: Command to transcribe audio to text using Whisper API.
/// Tier-gated: Free tier is blocked (403).
/// </summary>
public record TranscribeAudioCommand(
    byte[] AudioData,
    string FileName,
    string? Language,
    Guid UserId
) : IRequest<TranscribeAudioResult>;

/// <summary>
/// Result of audio transcription.
/// </summary>
public record TranscribeAudioResult(
    string Text,
    string DetectedLanguage,
    double DurationSeconds);
