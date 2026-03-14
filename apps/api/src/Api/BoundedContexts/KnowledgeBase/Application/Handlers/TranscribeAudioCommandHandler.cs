using Api.BoundedContexts.KnowledgeBase.Application.Commands;
using Api.BoundedContexts.KnowledgeBase.Domain.Services;
using Api.SharedKernel.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Api.BoundedContexts.KnowledgeBase.Application.Handlers;

/// <summary>
/// Issue #327: Handles audio transcription with tier gating.
/// Free tier users receive 403; Normal/Premium users can transcribe.
/// Rate limited via TierEnforcementService (AgentQuery action).
/// </summary>
public class TranscribeAudioCommandHandler : IRequestHandler<TranscribeAudioCommand, TranscribeAudioResult>
{
    private readonly ITranscriptionService _transcriptionService;
    private readonly ITierEnforcementService _tierEnforcement;
    private readonly ILogger<TranscribeAudioCommandHandler> _logger;

    public TranscribeAudioCommandHandler(
        ITranscriptionService transcriptionService,
        ITierEnforcementService tierEnforcement,
        ILogger<TranscribeAudioCommandHandler> logger)
    {
        _transcriptionService = transcriptionService ?? throw new ArgumentNullException(nameof(transcriptionService));
        _tierEnforcement = tierEnforcement ?? throw new ArgumentNullException(nameof(tierEnforcement));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<TranscribeAudioResult> Handle(
        TranscribeAudioCommand request,
        CancellationToken cancellationToken)
    {
        // Tier gating: check if user can perform speech transcription
        var canTranscribe = await _tierEnforcement.CanPerformAsync(
            request.UserId, TierAction.SpeechTranscription, cancellationToken).ConfigureAwait(false);

        if (!canTranscribe)
        {
            _logger.LogWarning(
                "User {UserId} blocked from speech transcription (tier limit reached)",
                request.UserId);
            throw new UnauthorizedAccessException(
                "Speech transcription is not available for your current tier or rate limit has been reached.");
        }

        var result = await _transcriptionService.TranscribeAsync(
            request.AudioData,
            request.FileName,
            request.Language,
            cancellationToken).ConfigureAwait(false);

        // Record usage after successful transcription
        await _tierEnforcement.RecordUsageAsync(
            request.UserId, TierAction.SpeechTranscription, cancellationToken).ConfigureAwait(false);

        _logger.LogInformation(
            "User {UserId} transcribed audio: {Duration}s, language={Language}",
            request.UserId, result.DurationSeconds, result.Language);

        return new TranscribeAudioResult(
            result.Text,
            result.Language,
            result.DurationSeconds);
    }
}
