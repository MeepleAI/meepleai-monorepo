using MediatR;

namespace Api.BoundedContexts.SessionTracking.Application.Commands;

/// <summary>
/// Issue #278: Deletes a session checkpoint.
/// </summary>
public record DeleteCheckpointCommand(Guid CheckpointId) : IRequest;
