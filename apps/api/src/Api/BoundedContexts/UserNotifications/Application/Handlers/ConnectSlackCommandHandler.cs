using Api.BoundedContexts.UserNotifications.Application.Commands;
using Api.BoundedContexts.UserNotifications.Infrastructure.Configuration;
using Api.SharedKernel.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Api.BoundedContexts.UserNotifications.Application.Handlers;

/// <summary>
/// Handler for ConnectSlackCommand.
/// Builds the Slack OAuth authorization URL for the user to grant permissions.
/// </summary>
internal class ConnectSlackCommandHandler : ICommandHandler<ConnectSlackCommand, string>
{
    private readonly SlackNotificationConfiguration _config;
    private readonly ILogger<ConnectSlackCommandHandler> _logger;

    public ConnectSlackCommandHandler(
        IOptions<SlackNotificationConfiguration> config,
        ILogger<ConnectSlackCommandHandler> logger)
    {
        ArgumentNullException.ThrowIfNull(config);
        _config = config.Value;
        ArgumentNullException.ThrowIfNull(logger);
        _logger = logger;
    }

    public Task<string> Handle(ConnectSlackCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var oauthUrl = $"https://slack.com/oauth/v2/authorize" +
            $"?client_id={Uri.EscapeDataString(_config.ClientId)}" +
            $"&scope=chat:write,im:write" +
            $"&redirect_uri={Uri.EscapeDataString(_config.RedirectUri)}" +
            $"&state={command.UserId}";

        _logger.LogInformation("Generated Slack OAuth URL for user {UserId}", command.UserId);

        return Task.FromResult(oauthUrl);
    }
}
