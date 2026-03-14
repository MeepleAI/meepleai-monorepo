using MediatR;

namespace Api.BoundedContexts.SessionTracking.Application.Commands;

public record AddNoteCommand(
    Guid SessionId,
    Guid ParticipantId,
    string NoteType, // 'Private' | 'Shared' | 'Template'
    string? TemplateKey,
    string Content,
    bool IsHidden,
    string? Source = null // "text" (default) or "voice" — Issue #274
) : IRequest<AddNoteResult>;

public record AddNoteResult(
    Guid NoteId
);
