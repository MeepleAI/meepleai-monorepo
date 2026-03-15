using Api.BoundedContexts.UserNotifications.Application.Commands;
using Api.BoundedContexts.UserNotifications.Application.Handlers;
using Api.BoundedContexts.UserNotifications.Infrastructure.Configuration;
using Api.Tests.Constants;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace Api.Tests.BoundedContexts.UserNotifications.Application.Handlers;

[Trait("Category", TestCategories.Unit)]
public class ConnectSlackCommandHandlerTests
{
    private readonly Mock<IOptions<SlackNotificationConfiguration>> _configMock;
    private readonly Mock<ILogger<ConnectSlackCommandHandler>> _loggerMock;
    private readonly ConnectSlackCommandHandler _handler;
    private readonly SlackNotificationConfiguration _config;

    public ConnectSlackCommandHandlerTests()
    {
        _config = new SlackNotificationConfiguration
        {
            ClientId = "test-client-id",
            ClientSecret = "test-client-secret",
            RedirectUri = "https://app.meepleai.com/api/v1/integrations/slack/callback"
        };
        _configMock = new Mock<IOptions<SlackNotificationConfiguration>>();
        _configMock.Setup(c => c.Value).Returns(_config);
        _loggerMock = new Mock<ILogger<ConnectSlackCommandHandler>>();
        _handler = new ConnectSlackCommandHandler(_configMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task Handle_ReturnsValidOAuthUrl_WithClientIdAndRedirectUri()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var command = new ConnectSlackCommand(userId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.Contains("https://slack.com/oauth/v2/authorize", result);
        Assert.Contains("client_id=test-client-id", result);
        Assert.Contains("scope=chat:write,im:write", result);
        Assert.Contains($"state={userId}", result);
        Assert.Contains("redirect_uri=", result);
    }

    [Fact]
    public async Task Handle_IncludesRequiredScopes()
    {
        // Arrange
        var command = new ConnectSlackCommand(Guid.NewGuid());

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert - scope contains both required Slack scopes
        Assert.Contains("scope=chat:write,im:write", result);
    }

    [Fact]
    public async Task Handle_UsesUserIdAsState()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var command = new ConnectSlackCommand(userId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.Contains($"state={userId}", result);
    }
}
