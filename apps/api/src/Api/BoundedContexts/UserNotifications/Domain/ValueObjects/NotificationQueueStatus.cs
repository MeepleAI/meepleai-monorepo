using Api.SharedKernel.Domain.ValueObjects;

namespace Api.BoundedContexts.UserNotifications.Domain.ValueObjects;

/// <summary>
/// Value object representing the processing status of a queued notification.
/// Tracks lifecycle from creation through delivery or failure.
/// </summary>
internal sealed class NotificationQueueStatus : ValueObject
{
    public string Value { get; }

    public static readonly NotificationQueueStatus Pending = new("pending");
    public static readonly NotificationQueueStatus Processing = new("processing");
    public static readonly NotificationQueueStatus Sent = new("sent");
    public static readonly NotificationQueueStatus Failed = new("failed");
    public static readonly NotificationQueueStatus DeadLetter = new("dead_letter");

    private NotificationQueueStatus(string value)
    {
        Value = value;
    }

    /// <summary>
    /// Creates a NotificationQueueStatus from a string value.
    /// Validates against known queue statuses.
    /// </summary>
    public static NotificationQueueStatus FromString(string value)
    {
        var normalized = value.ToLowerInvariant();
        return normalized switch
        {
            "pending" => Pending,
            "processing" => Processing,
            "sent" => Sent,
            "failed" => Failed,
            "dead_letter" => DeadLetter,
            _ => throw new ArgumentException($"Unknown notification queue status: {value}", nameof(value))
        };
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Value;
    }

    public override string ToString() => Value;
}
