using Api.BoundedContexts.KnowledgeBase.Application.Commands;
using Api.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Api.Routing;

/// <summary>
/// Issue #327: Speech-to-text transcription endpoints.
/// POST /api/v1/speech/transcribe — multipart audio upload → text
/// </summary>
internal static class SpeechEndpoints
{
    public static RouteGroupBuilder MapSpeechEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/speech/transcribe", HandleTranscribe)
            .DisableAntiforgery()
            .RequireSession()
            .WithMetadata(new RequestSizeLimitAttribute(26_214_400)) // 25 MB
            .WithTags("Speech")
            .WithName("TranscribeAudio")
            .WithOpenApi(operation =>
            {
                operation.Summary = "Transcribe audio to text";
                operation.Description = "Uploads an audio file and returns transcribed text using Whisper API. " +
                    "Free tier is blocked (403). Supported formats: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, webm.";
                return operation;
            });

        return group;
    }

    private static async Task<IResult> HandleTranscribe(
        HttpContext context,
        IMediator mediator,
        ILogger<Program> logger,
        CancellationToken ct)
    {
        var (authenticated, session, error) = context.TryGetActiveSession();
        if (!authenticated) return error!;

        var userId = session!.User!.Id;

        var form = await context.Request.ReadFormAsync(ct).ConfigureAwait(false);
        var file = form.Files.GetFile("file");

        if (file is null || file.Length == 0)
        {
            return Results.BadRequest(new
            {
                error = "validation_failed",
                message = "No audio file provided. Send a 'file' field with multipart/form-data."
            });
        }

        var language = form.TryGetValue("language", out var langValues)
            ? langValues.FirstOrDefault()
            : null;

        byte[] audioData;
        using (var ms = new MemoryStream())
        {
            await file.CopyToAsync(ms, ct).ConfigureAwait(false);
            audioData = ms.ToArray();
        }

        try
        {
            var result = await mediator.Send(new TranscribeAudioCommand(
                audioData,
                file.FileName,
                language,
                userId), ct).ConfigureAwait(false);

            return Results.Ok(new
            {
                text = result.Text,
                language = result.DetectedLanguage,
                duration = result.DurationSeconds
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            logger.LogWarning(ex, "User {UserId} blocked from transcription", userId);
            return Results.Json(
                new { error = "tier_blocked", message = ex.Message },
                statusCode: 403);
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new { error = "validation_failed", message = ex.Message });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Whisper API"))
        {
            logger.LogError(ex, "Whisper API error for user {UserId}", userId);
            return Results.Json(
                new { error = "transcription_failed", message = "Speech transcription service temporarily unavailable." },
                statusCode: 502);
        }
    }
}
