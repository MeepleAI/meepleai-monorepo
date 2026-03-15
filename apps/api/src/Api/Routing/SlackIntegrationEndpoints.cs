using Api.BoundedContexts.UserNotifications.Application.Commands;
using Api.BoundedContexts.UserNotifications.Application.DTOs;
using Api.BoundedContexts.UserNotifications.Application.Queries;
using Api.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Api.Routing;

/// <summary>
/// Slack integration endpoints for OAuth connect/callback/disconnect and status.
/// Handles user-facing Slack workspace connection lifecycle.
/// </summary>
internal static class SlackIntegrationEndpoints
{
    public static RouteGroupBuilder MapSlackIntegrationEndpoints(this RouteGroupBuilder group)
    {
        var slackGroup = group.MapGroup("/integrations/slack")
            .WithTags("Slack Integration");

        MapConnectEndpoint(slackGroup);
        MapCallbackEndpoint(slackGroup);
        MapDisconnectEndpoint(slackGroup);
        MapStatusEndpoint(slackGroup);
        MapUpdatePreferencesEndpoint(group);

        return group;
    }

    private static void MapConnectEndpoint(RouteGroupBuilder group)
    {
        group.MapGet("/connect", async (
            HttpContext context,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var (authenticated, session, error) = context.TryGetActiveSession();
            if (!authenticated) return error!;

            var command = new ConnectSlackCommand(session!.User!.Id);
            var oauthUrl = await mediator.Send(command, ct).ConfigureAwait(false);

            return Results.Ok(new { url = oauthUrl });
        })
        .RequireSession()
        .Produces<object>(200)
        .WithName("ConnectSlack")
        .WithSummary("Get Slack OAuth authorization URL")
        .WithDescription("Returns the Slack OAuth URL for the user to authorize the MeepleAI app in their workspace.");
    }

    private static void MapCallbackEndpoint(RouteGroupBuilder group)
    {
        group.MapGet("/callback", async (
            [FromQuery] string code,
            [FromQuery] string state,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var command = new SlackOAuthCallbackCommand(code, state);
            var success = await mediator.Send(command, ct).ConfigureAwait(false);

            return success
                ? Results.Ok(new { message = "Slack connected successfully" })
                : Results.BadRequest(new { error = "Failed to connect Slack" });
        })
        .Produces<object>(200)
        .Produces<object>(400)
        .WithName("SlackOAuthCallback")
        .WithSummary("Handle Slack OAuth callback")
        .WithDescription("Exchanges the OAuth authorization code for an access token and creates the Slack connection. Called by Slack after user authorization.");
    }

    private static void MapDisconnectEndpoint(RouteGroupBuilder group)
    {
        group.MapDelete("/disconnect", async (
            HttpContext context,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var (authenticated, session, error) = context.TryGetActiveSession();
            if (!authenticated) return error!;

            var command = new DisconnectSlackCommand(session!.User!.Id);
            var success = await mediator.Send(command, ct).ConfigureAwait(false);

            return success
                ? Results.Ok(new { message = "Slack disconnected" })
                : Results.NotFound(new { error = "No active Slack connection found" });
        })
        .RequireSession()
        .Produces<object>(200)
        .Produces<object>(404)
        .WithName("DisconnectSlack")
        .WithSummary("Disconnect Slack integration")
        .WithDescription("Disconnects the user's Slack workspace connection and revokes the access token.");
    }

    private static void MapStatusEndpoint(RouteGroupBuilder group)
    {
        group.MapGet("/status", async (
            HttpContext context,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var (authenticated, session, error) = context.TryGetActiveSession();
            if (!authenticated) return error!;

            var query = new GetSlackConnectionStatusQuery(session!.User!.Id);
            var status = await mediator.Send(query, ct).ConfigureAwait(false);

            return status != null
                ? Results.Ok(status)
                : Results.Ok(new SlackConnectionStatusDto(false, null, null, null));
        })
        .RequireSession()
        .Produces<SlackConnectionStatusDto>(200)
        .WithName("GetSlackConnectionStatus")
        .WithSummary("Get Slack connection status")
        .WithDescription("Returns the current Slack connection status for the authenticated user.");
    }

    private static void MapUpdatePreferencesEndpoint(RouteGroupBuilder group)
    {
        group.MapPut("/notifications/preferences/slack", async (
            UpdateSlackPreferencesCommand command,
            HttpContext context,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var (authenticated, session, error) = context.TryGetActiveSession();
            if (!authenticated) return error!;

            var updatedCommand = command with { UserId = session!.User!.Id };
            await mediator.Send(updatedCommand, ct).ConfigureAwait(false);
            return Results.NoContent();
        })
        .RequireSession()
        .Produces(204)
        .WithName("UpdateSlackPreferences")
        .WithSummary("Update Slack notification preferences")
        .WithDescription("Updates which notification types are sent via Slack for the authenticated user.");
    }
}
