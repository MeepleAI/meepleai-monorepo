using System.Text.Json;
using Api.BoundedContexts.UserNotifications.Application.Commands;
using Api.BoundedContexts.UserNotifications.Domain.Aggregates;
using Api.BoundedContexts.UserNotifications.Domain.Repositories;
using Api.BoundedContexts.UserNotifications.Domain.ValueObjects;
using Api.Infrastructure;
using Api.Infrastructure.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.BoundedContexts.UserNotifications.Application.Handlers;

/// <summary>
/// Handles sending manual notifications from admin to users.
/// Creates in-app notifications and optionally enqueues emails.
/// Follows the same pattern as NewShareRequestAdminAlertHandler.
/// </summary>
internal sealed class SendManualNotificationCommandHandler
    : IRequestHandler<SendManualNotificationCommand, SendManualNotificationResult>
{
    private const int MaxRecipients = 100;

    private readonly INotificationRepository _notificationRepo;
    private readonly MeepleAiDbContext _dbContext;
    private readonly IMediator _mediator;
    private readonly ILogger<SendManualNotificationCommandHandler> _logger;

    public SendManualNotificationCommandHandler(
        INotificationRepository notificationRepo,
        MeepleAiDbContext dbContext,
        IMediator mediator,
        ILogger<SendManualNotificationCommandHandler> logger)
    {
        _notificationRepo = notificationRepo;
        _dbContext = dbContext;
        _mediator = mediator;
        _logger = logger;
    }

    public async Task<SendManualNotificationResult> Handle(
        SendManualNotificationCommand request, CancellationToken cancellationToken)
    {
        var recipientIds = await ResolveRecipientsAsync(request, cancellationToken).ConfigureAwait(false);

        if (recipientIds.Count == 0)
            return new SendManualNotificationResult(0, 0, 0);

        if (recipientIds.Count > MaxRecipients)
        {
            _logger.LogWarning(
                "Manual notification capped at {Max} recipients (requested {Requested})",
                MaxRecipients, recipientIds.Count);
            recipientIds = recipientIds.Take(MaxRecipients).ToList();
        }

        var channels = request.Channels.Select(c => c.ToLowerInvariant()).ToHashSet(StringComparer.Ordinal);
        var dispatched = 0;
        var skipped = 0;

        var metadata = JsonSerializer.Serialize(new
        {
            sentByAdminId = request.SentByAdminId,
            sentByAdminName = request.SentByAdminName,
            recipientType = request.RecipientType,
            channels = request.Channels
        });

        // Resolve user emails for email channel
        Dictionary<Guid, (string Email, string? DisplayName)>? userEmails = null;
        if (channels.Contains("email"))
        {
            userEmails = await _dbContext.Set<UserEntity>()
                .AsNoTracking()
                .Where(u => recipientIds.Contains(u.Id))
                .Select(u => new { u.Id, u.Email, u.DisplayName })
                .ToDictionaryAsync(
                    u => u.Id,
                    u => (u.Email, u.DisplayName),
                    cancellationToken)
                .ConfigureAwait(false);
        }

        foreach (var userId in recipientIds)
        {
            try
            {
                // In-app notification
                if (channels.Contains("inapp"))
                {
                    var notification = new Notification(
                        id: Guid.NewGuid(),
                        userId: userId,
                        type: NotificationType.AdminManualNotification,
                        severity: NotificationSeverity.Info,
                        title: request.Title,
                        message: request.Message,
                        link: request.DeepLinkPath,
                        metadata: metadata);

                    await _notificationRepo.AddAsync(notification, cancellationToken).ConfigureAwait(false);
                }

                // Email via queue
                if (channels.Contains("email") && userEmails != null && userEmails.TryGetValue(userId, out var userInfo))
                {
                    await _mediator.Send(new EnqueueEmailCommand(
                        UserId: userId,
                        To: userInfo.Email,
                        Subject: $"{request.Title} - MeepleAI",
                        TemplateName: "admin_manual_notification",
                        UserName: userInfo.DisplayName,
                        FileName: request.Title
                    ), cancellationToken).ConfigureAwait(false);
                }

                dispatched++;
            }
#pragma warning disable CA1031
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to dispatch manual notification to user {UserId}", userId);
                skipped++;
            }
#pragma warning restore CA1031
        }

        await _dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        _logger.LogInformation(
            "Admin {AdminName} sent manual notification '{Title}' to {Dispatched}/{Total} recipients",
            request.SentByAdminName, request.Title, dispatched, recipientIds.Count);

        return new SendManualNotificationResult(recipientIds.Count, dispatched, skipped);
    }

    private async Task<List<Guid>> ResolveRecipientsAsync(
        SendManualNotificationCommand request, CancellationToken ct)
    {
        var query = _dbContext.Set<UserEntity>().AsNoTracking();

        return request.RecipientType.ToLowerInvariant() switch
        {
            "all" => await query.Select(u => u.Id).ToListAsync(ct).ConfigureAwait(false),
            "role" => await query
                .Where(u => u.Role == request.RecipientRole)
                .Select(u => u.Id)
                .ToListAsync(ct).ConfigureAwait(false),
            "users" => request.RecipientUserIds?.ToList() ?? [],
            _ => []
        };
    }
}
