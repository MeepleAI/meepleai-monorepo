using MediatR;

namespace Api.BoundedContexts.SessionTracking.Application.Queries;

/// <summary>
/// Issue #278: Retrieves all checkpoints for a session.
/// </summary>
public record GetCheckpointsQuery(Guid SessionId) : IRequest<GetCheckpointsResult>;

public record CheckpointDto(
    Guid Id,
    Guid SessionId,
    string Name,
    DateTime Timestamp,
    int DiaryEventCount,
    Guid? CreatedBy
);

public record GetCheckpointsResult(IReadOnlyList<CheckpointDto> Checkpoints);
