using Api.BoundedContexts.Authentication.Infrastructure.Persistence;
using Api.Middleware.Exceptions;
using Api.SharedKernel.Application.Interfaces;
using Api.SharedKernel.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;

namespace Api.BoundedContexts.Authentication.Application.Commands.UserProfile;

/// <summary>
/// Handles marking onboarding as completed.
/// Issue #326: Reminder banner for skipped wizard.
/// </summary>
internal sealed class CompleteOnboardingCommandHandler : ICommandHandler<CompleteOnboardingCommand>
{
    private readonly IUserRepository _userRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CompleteOnboardingCommandHandler> _logger;

    public CompleteOnboardingCommandHandler(
        IUserRepository userRepo,
        IUnitOfWork unitOfWork,
        ILogger<CompleteOnboardingCommandHandler> logger)
    {
        _userRepo = userRepo ?? throw new ArgumentNullException(nameof(userRepo));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task Handle(CompleteOnboardingCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var user = await _userRepo.GetByIdAsync(command.UserId, cancellationToken).ConfigureAwait(false);
        if (user == null)
            throw new NotFoundException("User", command.UserId.ToString());

        user.CompleteOnboarding();

        await _userRepo.UpdateAsync(user, cancellationToken).ConfigureAwait(false);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        _logger.LogInformation("Onboarding completed for user {UserId}", command.UserId);
    }
}
