using Api.SharedKernel.Application.Interfaces;

namespace Api.BoundedContexts.Authentication.Application.Commands.UserProfile;

/// <summary>
/// Command to mark the user's onboarding wizard as completed.
/// Issue #326: Reminder banner for skipped wizard.
/// </summary>
internal record CompleteOnboardingCommand(
    Guid UserId
) : ICommand;
