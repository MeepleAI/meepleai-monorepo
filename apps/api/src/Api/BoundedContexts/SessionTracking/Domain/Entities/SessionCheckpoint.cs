namespace Api.BoundedContexts.SessionTracking.Domain.Entities;

/// <summary>
/// Issue #278: Session checkpoint for deep save/restore of full session state.
/// Captures a snapshot of all toolkit states, phase/round/turn, and diary event count.
/// </summary>
public class SessionCheckpoint
{
    public Guid Id { get; private set; }
    public Guid SessionId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public DateTime Timestamp { get; private set; }
    public string SnapshotData { get; private set; } = "{}";
    public int DiaryEventCount { get; private set; }
    public Guid? CreatedBy { get; private set; }

    private SessionCheckpoint() { }

    /// <summary>
    /// Creates a new session checkpoint.
    /// </summary>
    /// <param name="sessionId">The session to checkpoint.</param>
    /// <param name="name">User-given name for the checkpoint.</param>
    /// <param name="snapshotData">JSON snapshot of full session state.</param>
    /// <param name="diaryEventCount">Number of diary events at checkpoint time.</param>
    /// <param name="createdBy">User who created the checkpoint.</param>
    public static SessionCheckpoint Create(
        Guid sessionId,
        string name,
        string snapshotData,
        int diaryEventCount,
        Guid? createdBy = null)
    {
        if (sessionId == Guid.Empty)
            throw new ArgumentException("Session ID cannot be empty.", nameof(sessionId));

        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Checkpoint name cannot be empty.", nameof(name));

        if (name.Length > 200)
            throw new ArgumentException("Checkpoint name cannot exceed 200 characters.", nameof(name));

        return new SessionCheckpoint
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            Name = name.Trim(),
            Timestamp = DateTime.UtcNow,
            SnapshotData = snapshotData,
            DiaryEventCount = diaryEventCount,
            CreatedBy = createdBy
        };
    }
}
