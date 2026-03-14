using Api.SharedKernel.Application.Interfaces;

namespace Api.BoundedContexts.GameManagement.Application.Commands.LiveSessions;

/// <summary>
/// Jumps to a specific phase by index in a live session.
/// Issue #273: Phase/Round Tracker Tool — supports non-sequential phase navigation.
/// </summary>
internal sealed record SetPhaseIndexCommand(Guid SessionId, int PhaseIndex) : ICommand;
