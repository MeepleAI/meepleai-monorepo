using MediatR;

namespace Api.BoundedContexts.SessionTracking.Application.Queries;

/// <summary>
/// Issue #278: Retrieves a specific checkpoint's snapshot data for restore.
/// </summary>
public record GetCheckpointSnapshotQuery(Guid CheckpointId) : IRequest<GetCheckpointSnapshotResult>;

public record GetCheckpointSnapshotResult(
    Guid Id,
    Guid SessionId,
    string Name,
    DateTime Timestamp,
    string SnapshotData,
    int DiaryEventCount,
    Guid? CreatedBy
);
