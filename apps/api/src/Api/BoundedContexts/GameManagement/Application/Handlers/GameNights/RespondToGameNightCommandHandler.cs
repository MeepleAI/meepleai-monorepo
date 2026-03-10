using Api.BoundedContexts.GameManagement.Application.Commands.GameNights;
using Api.BoundedContexts.GameManagement.Domain.Entities.GameNightEvent;
using Api.BoundedContexts.GameManagement.Domain.Enums;
using Api.BoundedContexts.GameManagement.Domain.Events;
using Api.Middleware.Exceptions;
using Api.SharedKernel.Application.Interfaces;
using Api.SharedKernel.Infrastructure.Persistence;
using MediatR;

namespace Api.BoundedContexts.GameManagement.Application.Handlers.GameNights;

/// <summary>
/// Handles RSVP responses to game night invitations.
/// Issue #46: GameNight API endpoints.
/// Issue #43: Uses NotFoundException, checks IsFull for Accept, publishes GameNightRsvpReceivedEvent.
/// </summary>
internal sealed class RespondToGameNightCommandHandler : ICommandHandler<RespondToGameNightCommand>
{
    private readonly IGameNightEventRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMediator _mediator;

    public RespondToGameNightCommandHandler(
        IGameNightEventRepository repository,
        IUnitOfWork unitOfWork,
        IMediator mediator)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
    }

    public async Task Handle(RespondToGameNightCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var gameNight = await _repository.GetByIdAsync(command.GameNightId, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException("GameNightEvent", command.GameNightId.ToString());

        var rsvp = gameNight.GetRsvp(command.UserId)
            ?? throw new NotFoundException("GameNightRsvp", $"EventId={command.GameNightId}, UserId={command.UserId}");

        switch (command.Response)
        {
            case RsvpStatus.Accepted:
                if (gameNight.IsFull)
                    throw new InvalidOperationException("This game night is full and cannot accept more players");
                rsvp.Accept();
                break;
            case RsvpStatus.Declined:
                rsvp.Decline();
                break;
            case RsvpStatus.Maybe:
                rsvp.SetMaybe();
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(command), $"Invalid RSVP response: {command.Response}");
        }

        await _repository.UpdateAsync(gameNight, cancellationToken).ConfigureAwait(false);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        await _mediator.Publish(
            new GameNightRsvpReceivedEvent(command.GameNightId, command.UserId, command.Response, gameNight.OrganizerId),
            cancellationToken).ConfigureAwait(false);
    }
}
