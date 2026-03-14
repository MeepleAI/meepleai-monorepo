using MediatR;
using Api.BoundedContexts.SessionTracking.Application.Commands;
using Api.BoundedContexts.SessionTracking.Domain.Entities;
using Api.BoundedContexts.SessionTracking.Domain.Repositories;
using Api.Middleware.Exceptions;

namespace Api.BoundedContexts.SessionTracking.Application.Handlers;

/// <summary>
/// Issue #278: Handles creating a session checkpoint.
/// </summary>
public class CreateCheckpointCommandHandler : IRequestHandler<CreateCheckpointCommand, CreateCheckpointResult>
{
    private readonly ISessionCheckpointRepository _checkpointRepository;
    private readonly ISessionRepository _sessionRepository;

    public CreateCheckpointCommandHandler(
        ISessionCheckpointRepository checkpointRepository,
        ISessionRepository sessionRepository)
    {
        _checkpointRepository = checkpointRepository ?? throw new ArgumentNullException(nameof(checkpointRepository));
        _sessionRepository = sessionRepository ?? throw new ArgumentNullException(nameof(sessionRepository));
    }

    public async Task<CreateCheckpointResult> Handle(CreateCheckpointCommand request, CancellationToken cancellationToken)
    {
        // Verify session exists
        _ = await _sessionRepository.GetByIdAsync(request.SessionId, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException($"Session {request.SessionId} not found");

        var checkpoint = SessionCheckpoint.Create(
            request.SessionId,
            request.Name,
            request.SnapshotData,
            request.DiaryEventCount,
            request.CreatedBy);

        await _checkpointRepository.AddAsync(checkpoint, cancellationToken).ConfigureAwait(false);

        return new CreateCheckpointResult(checkpoint.Id, checkpoint.Timestamp);
    }
}

/// <summary>
/// Issue #278: Handles deleting a session checkpoint.
/// </summary>
public class DeleteCheckpointCommandHandler : IRequestHandler<DeleteCheckpointCommand>
{
    private readonly ISessionCheckpointRepository _checkpointRepository;

    public DeleteCheckpointCommandHandler(ISessionCheckpointRepository checkpointRepository)
    {
        _checkpointRepository = checkpointRepository ?? throw new ArgumentNullException(nameof(checkpointRepository));
    }

    public async Task Handle(DeleteCheckpointCommand request, CancellationToken cancellationToken)
    {
        _ = await _checkpointRepository.GetByIdAsync(request.CheckpointId, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException($"Checkpoint {request.CheckpointId} not found");

        await _checkpointRepository.DeleteAsync(request.CheckpointId, cancellationToken).ConfigureAwait(false);
    }
}
