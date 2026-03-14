using MediatR;

namespace Api.BoundedContexts.SessionTracking.Application.Commands;

/// <summary>
/// Issue #278: Creates a session checkpoint (deep save).
/// </summary>
public record CreateCheckpointCommand(
    Guid SessionId,
    string Name,
    string SnapshotData,
    int DiaryEventCount,
    Guid? CreatedBy = null
) : IRequest<CreateCheckpointResult>;

public record CreateCheckpointResult(
    Guid CheckpointId,
    DateTime Timestamp
);
