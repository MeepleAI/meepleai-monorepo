using MediatR;
using Api.BoundedContexts.SessionTracking.Application.Queries;
using Api.BoundedContexts.SessionTracking.Domain.Repositories;

namespace Api.BoundedContexts.SessionTracking.Application.Handlers;

/// <summary>
/// Issue #277: Handles retrieving session events for AI turn summary generation.
/// </summary>
public class GetTurnSummaryDataQueryHandler : IRequestHandler<GetTurnSummaryDataQuery, GetTurnSummaryDataResult>
{
    private readonly ISessionEventRepository _eventRepository;

    public GetTurnSummaryDataQueryHandler(ISessionEventRepository eventRepository)
    {
        _eventRepository = eventRepository ?? throw new ArgumentNullException(nameof(eventRepository));
    }

    public async Task<GetTurnSummaryDataResult> Handle(GetTurnSummaryDataQuery request, CancellationToken cancellationToken)
    {
        var events = await _eventRepository.GetBySessionIdAsync(
            request.SessionId,
            eventType: null,
            limit: request.LastNEvents ?? 200,
            offset: 0,
            cancellationToken).ConfigureAwait(false);

        // Apply time range filter if specified
        var filtered = events.AsEnumerable();

        if (request.FromTimestamp.HasValue)
            filtered = filtered.Where(e => e.Timestamp >= request.FromTimestamp.Value);

        if (request.ToTimestamp.HasValue)
            filtered = filtered.Where(e => e.Timestamp <= request.ToTimestamp.Value);

        var eventList = filtered.ToList();

        var dtos = eventList.Select(e => new TurnEventDto(
            e.EventType,
            e.Timestamp,
            e.Payload,
            e.Source)).ToList();

        return new GetTurnSummaryDataResult(
            request.SessionId,
            dtos,
            dtos.Count,
            dtos.Count > 0 ? dtos.Min(e => e.Timestamp) : null,
            dtos.Count > 0 ? dtos.Max(e => e.Timestamp) : null);
    }
}
