using Api.SharedKernel.Application.Interfaces;

namespace Api.BoundedContexts.GameManagement.Application.Commands.LiveSessions;

/// <summary>
/// Applies the default phase template (Setup → Play → Scoring → End) to a live session.
/// Issue #273: Phase/Round Tracker Tool.
/// </summary>
internal sealed record ApplyDefaultPhasesCommand(Guid SessionId) : ICommand;
