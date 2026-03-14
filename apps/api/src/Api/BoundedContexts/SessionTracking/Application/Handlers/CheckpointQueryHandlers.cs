using MediatR;
using Api.BoundedContexts.SessionTracking.Application.Queries;
using Api.BoundedContexts.SessionTracking.Domain.Repositories;
using Api.Middleware.Exceptions;

namespace Api.BoundedContexts.SessionTracking.Application.Handlers;

/// <summary>
/// Issue #278: Handles listing checkpoints for a session.
/// </summary>
public class GetCheckpointsQueryHandler : IRequestHandler<GetCheckpointsQuery, GetCheckpointsResult>
{
    private readonly ISessionCheckpointRepository _checkpointRepository;

    public GetCheckpointsQueryHandler(ISessionCheckpointRepository checkpointRepository)
    {
        _checkpointRepository = checkpointRepository ?? throw new ArgumentNullException(nameof(checkpointRepository));
    }

    public async Task<GetCheckpointsResult> Handle(GetCheckpointsQuery request, CancellationToken cancellationToken)
    {
        var checkpoints = await _checkpointRepository.GetBySessionIdAsync(request.SessionId, cancellationToken).ConfigureAwait(false);

        var dtos = checkpoints.Select(c => new CheckpointDto(
            c.Id,
            c.SessionId,
            c.Name,
            c.Timestamp,
            c.DiaryEventCount,
            c.CreatedBy)).ToList();

        return new GetCheckpointsResult(dtos);
    }
}

/// <summary>
/// Issue #278: Handles retrieving a specific checkpoint's snapshot data.
/// </summary>
public class GetCheckpointSnapshotQueryHandler : IRequestHandler<GetCheckpointSnapshotQuery, GetCheckpointSnapshotResult>
{
    private readonly ISessionCheckpointRepository _checkpointRepository;

    public GetCheckpointSnapshotQueryHandler(ISessionCheckpointRepository checkpointRepository)
    {
        _checkpointRepository = checkpointRepository ?? throw new ArgumentNullException(nameof(checkpointRepository));
    }

    public async Task<GetCheckpointSnapshotResult> Handle(GetCheckpointSnapshotQuery request, CancellationToken cancellationToken)
    {
        var checkpoint = await _checkpointRepository.GetByIdAsync(request.CheckpointId, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException($"Checkpoint {request.CheckpointId} not found");

        return new GetCheckpointSnapshotResult(
            checkpoint.Id,
            checkpoint.SessionId,
            checkpoint.Name,
            checkpoint.Timestamp,
            checkpoint.SnapshotData,
            checkpoint.DiaryEventCount,
            checkpoint.CreatedBy);
    }
}
