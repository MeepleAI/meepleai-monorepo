using Api.BoundedContexts.GameManagement.Application.Commands.Session;
using Api.BoundedContexts.GameManagement.Application.Queries.Session;
using Api.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Api.Routing;

/// <summary>
/// Endpoints for session invite flow: create invite, join session, list participants.
/// E3-1: Session Invite Flow.
/// </summary>
internal static class SessionInviteEndpoints
{
    public static RouteGroupBuilder MapSessionInviteEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/live-sessions/{sessionId}/invite", HandleCreateInvite)
            .RequireAuthenticatedUser()
            .Produces<SessionInviteResultDto>(201)
            .Produces(403)
            .Produces(404)
            .WithTags("SessionInvites")
            .WithSummary("Create a session invite")
            .WithDescription("Creates an invite with PIN and link token. Host only.");

        group.MapPost("/live-sessions/join", HandleJoinSession)
            .Produces<JoinSessionResultDto>(200)
            .Produces(400)
            .Produces(404)
            .Produces(409)
            .WithTags("SessionInvites")
            .WithSummary("Join a session via invite")
            .WithDescription("Join using a PIN or link token. No auth required for guests.");

        group.MapGet("/live-sessions/{sessionId}/participants", HandleGetParticipants)
            .RequireAuthenticatedUser()
            .Produces<IReadOnlyList<SessionParticipantDto>>(200)
            .Produces(404)
            .WithTags("SessionInvites")
            .WithSummary("Get session participants")
            .WithDescription("List all participants (active and left) in a session.");

        return group;
    }

    private static async Task<IResult> HandleCreateInvite(
        Guid sessionId,
        [FromBody] CreateInviteRequest? request,
        [FromServices] IMediator mediator,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var userId = httpContext.User.GetUserId();
        var command = new CreateSessionInviteCommand(
            sessionId,
            userId,
            request?.MaxUses ?? 10,
            request?.ExpiryMinutes ?? 30);

        var result = await mediator.Send(command, cancellationToken).ConfigureAwait(false);
        return Results.Created($"/api/v1/live-sessions/{sessionId}/invite", result);
    }

    private static async Task<IResult> HandleJoinSession(
        [FromBody] JoinSessionRequest request,
        [FromServices] IMediator mediator,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        // Try to get userId from auth if present
        Guid? userId = null;
        try { userId = httpContext.User.GetUserId(); } catch { /* Guest - no auth */ }

        // GetUserId returns Guid.Empty when no auth claim is found
        if (userId == Guid.Empty) userId = null;

        var command = new JoinSessionCommand(
            request.Token,
            request.GuestName,
            userId);

        var result = await mediator.Send(command, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> HandleGetParticipants(
        Guid sessionId,
        [FromServices] IMediator mediator,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetSessionParticipantsQuery(sessionId), cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private sealed record CreateInviteRequest(int MaxUses = 10, int ExpiryMinutes = 30);
    private sealed record JoinSessionRequest(string Token, string? GuestName = null);
}
