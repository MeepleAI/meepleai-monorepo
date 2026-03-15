using System.Text.Json;
using Api.BoundedContexts.UserNotifications.Application.Commands;
using Api.BoundedContexts.UserNotifications.Domain.Aggregates;
using Api.BoundedContexts.UserNotifications.Domain.Repositories;
using Api.BoundedContexts.UserNotifications.Infrastructure.Configuration;
using Api.SharedKernel.Application.Interfaces;
using Api.SharedKernel.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Api.BoundedContexts.UserNotifications.Application.Handlers;

/// <summary>
/// Handler for SlackOAuthCallbackCommand.
/// Exchanges the OAuth code for an access token, opens a DM channel,
/// and creates or reconnects a SlackConnection.
/// </summary>
internal class SlackOAuthCallbackCommandHandler : ICommandHandler<SlackOAuthCallbackCommand, bool>
{
#pragma warning disable S1075 // URIs should not be hardcoded - Slack API base URLs
    private const string SlackOAuthTokenUrl = "https://slack.com/api/oauth.v2.access";
    private const string SlackConversationsOpenUrl = "https://slack.com/api/conversations.open";
#pragma warning restore S1075

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ISlackConnectionRepository _connectionRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly SlackNotificationConfiguration _config;
    private readonly ILogger<SlackOAuthCallbackCommandHandler> _logger;

    public SlackOAuthCallbackCommandHandler(
        IHttpClientFactory httpClientFactory,
        ISlackConnectionRepository connectionRepository,
        IUnitOfWork unitOfWork,
        IOptions<SlackNotificationConfiguration> config,
        ILogger<SlackOAuthCallbackCommandHandler> logger)
    {
        ArgumentNullException.ThrowIfNull(httpClientFactory);
        _httpClientFactory = httpClientFactory;
        ArgumentNullException.ThrowIfNull(connectionRepository);
        _connectionRepository = connectionRepository;
        ArgumentNullException.ThrowIfNull(unitOfWork);
        _unitOfWork = unitOfWork;
        ArgumentNullException.ThrowIfNull(config);
        _config = config.Value;
        ArgumentNullException.ThrowIfNull(logger);
        _logger = logger;
    }

    public async Task<bool> Handle(SlackOAuthCallbackCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        if (!Guid.TryParse(command.State, out var userId))
        {
            _logger.LogWarning("Invalid state parameter in Slack OAuth callback: {State}", command.State);
            return false;
        }

        var client = _httpClientFactory.CreateClient("SlackOAuth");

        // Step 1: Exchange code for access token
        var tokenResponse = await ExchangeCodeForTokenAsync(client, command.Code, cancellationToken).ConfigureAwait(false);
        if (tokenResponse == null)
            return false;

        var accessToken = tokenResponse.Value.AccessToken;
        var slackUserId = tokenResponse.Value.SlackUserId;
        var teamId = tokenResponse.Value.TeamId;
        var teamName = tokenResponse.Value.TeamName;

        // Step 2: Open DM channel with the authed user
        var dmChannelId = await OpenDmChannelAsync(client, accessToken, slackUserId, cancellationToken).ConfigureAwait(false);
        if (dmChannelId == null)
            return false;

        // Step 3: Create or reconnect SlackConnection
        var existing = await _connectionRepository.GetByUserIdAsync(userId, cancellationToken).ConfigureAwait(false);
        if (existing != null)
        {
            existing.Reconnect(accessToken, dmChannelId);
            await _connectionRepository.UpdateAsync(existing, cancellationToken).ConfigureAwait(false);
            _logger.LogInformation("Reconnected Slack for user {UserId} in team {TeamName}", userId, teamName);
        }
        else
        {
            var connection = SlackConnection.Create(userId, slackUserId, teamId, teamName, accessToken, dmChannelId);
            await _connectionRepository.AddAsync(connection, cancellationToken).ConfigureAwait(false);
            _logger.LogInformation("Created Slack connection for user {UserId} in team {TeamName}", userId, teamName);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return true;
    }

    private async Task<OAuthTokenResult?> ExchangeCodeForTokenAsync(
        HttpClient client, string code, CancellationToken ct)
    {
        var content = new FormUrlEncodedContent(new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["client_id"] = _config.ClientId,
            ["client_secret"] = _config.ClientSecret,
            ["code"] = code,
            ["redirect_uri"] = _config.RedirectUri
        });

        var response = await client.PostAsync(SlackOAuthTokenUrl, content, ct).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (!root.TryGetProperty("ok", out var okProp) || !okProp.GetBoolean())
        {
            var error = root.TryGetProperty("error", out var errProp) ? errProp.GetString() : "unknown";
            _logger.LogWarning("Slack OAuth token exchange failed: {Error}", error);
            return null;
        }

        var accessToken = root.GetProperty("access_token").GetString()!;
        var slackUserId = root.GetProperty("authed_user").GetProperty("id").GetString()!;
        var teamId = root.GetProperty("team").GetProperty("id").GetString()!;
        var teamName = root.GetProperty("team").GetProperty("name").GetString()!;

        return new OAuthTokenResult(accessToken, slackUserId, teamId, teamName);
    }

    private async Task<string?> OpenDmChannelAsync(
        HttpClient client, string accessToken, string slackUserId, CancellationToken ct)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, SlackConversationsOpenUrl);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
        request.Content = new FormUrlEncodedContent(new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["users"] = slackUserId
        });

        var response = await client.SendAsync(request, ct).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (!root.TryGetProperty("ok", out var okProp) || !okProp.GetBoolean())
        {
            var error = root.TryGetProperty("error", out var errProp) ? errProp.GetString() : "unknown";
            _logger.LogWarning("Failed to open Slack DM channel: {Error}", error);
            return null;
        }

        return root.GetProperty("channel").GetProperty("id").GetString();
    }

    private readonly record struct OAuthTokenResult(
        string AccessToken, string SlackUserId, string TeamId, string TeamName);
}
