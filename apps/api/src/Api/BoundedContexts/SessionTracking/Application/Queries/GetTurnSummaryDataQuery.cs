using MediatR;

namespace Api.BoundedContexts.SessionTracking.Application.Queries;

/// <summary>
/// Issue #277: Retrieves session events for AI turn summary generation.
/// Returns events within a time range or the last N events for summarization.
/// </summary>
public record GetTurnSummaryDataQuery(
    Guid SessionId,
    DateTime? FromTimestamp = null,
    DateTime? ToTimestamp = null,
    int? LastNEvents = null
) : IRequest<GetTurnSummaryDataResult>;

/// <summary>
/// Contains event data ready for AI summarization.
/// </summary>
public record GetTurnSummaryDataResult(
    Guid SessionId,
    IReadOnlyList<TurnEventDto> Events,
    int TotalEvents,
    DateTime? EarliestEvent,
    DateTime? LatestEvent
);

/// <summary>
/// Simplified event DTO for turn summary context.
/// </summary>
public record TurnEventDto(
    string EventType,
    DateTime Timestamp,
    string? Payload,
    string? Source
);
