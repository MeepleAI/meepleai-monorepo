using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Api.Infrastructure.Seeders;

/// <summary>
/// Entry point for all seeding operations. Replaces AutoConfigurationService.
/// Resolves profile, acquires advisory lock, runs ISeedLayer implementations in order.
/// </summary>
internal sealed class SeedOrchestrator
{
    private readonly IEnumerable<ISeedLayer> _layers;
    private readonly ILogger<SeedOrchestrator> _logger;

    public SeedOrchestrator(
        IEnumerable<ISeedLayer> layers,
        ILogger<SeedOrchestrator> logger)
    {
        _layers = layers;
        _logger = logger;
    }

    /// <summary>
    /// Run all applicable seed layers inside an advisory lock.
    /// Called from Program.cs startup and the admin endpoint.
    /// </summary>
    public async Task RunAsync(MeepleAiDbContext db, IServiceProvider services, CancellationToken ct = default)
    {
        var profile = ResolveProfile(services.GetService(typeof(IConfiguration)) as IConfiguration);

        if (profile == SeedProfile.None)
        {
            _logger.LogInformation("Seed profile is None — skipping all seeding");
            return;
        }

        _logger.LogInformation("Seeding with profile: {Profile}", profile);
        var sw = Stopwatch.StartNew();

        await AdvisoryLockHelper.AcquireAsync(db, _logger, ct).ConfigureAwait(false);
        try
        {
            var adminUser = await db.Users
                .FirstOrDefaultAsync(u => u.Role == "admin", ct)
                .ConfigureAwait(false);
            var systemUserId = adminUser?.Id ?? Guid.Empty;

            var context = new SeedContext(profile, db, services, _logger, systemUserId);

            foreach (var layer in FilterLayers(_layers, profile))
            {
                _logger.LogInformation("Running seed layer: {Layer} (min profile: {MinProfile})",
                    layer.Name, layer.MinimumProfile);
                await layer.SeedAsync(context, ct).ConfigureAwait(false);
            }

            _logger.LogInformation("Seeding completed in {Elapsed}ms", sw.ElapsedMilliseconds);
        }
        finally
        {
            await AdvisoryLockHelper.ReleaseAsync(db, _logger, ct).ConfigureAwait(false);
        }
    }

    /// <summary>
    /// Resolve seed profile from SEED_PROFILE env var → Seeding:Profile config → default Dev.
    /// </summary>
    internal static SeedProfile ResolveProfile(IConfiguration? configuration)
    {
        // 1. Environment variable takes priority
        var envVar = Environment.GetEnvironmentVariable("SEED_PROFILE");
        if (!string.IsNullOrWhiteSpace(envVar) && Enum.TryParse<SeedProfile>(envVar, ignoreCase: true, out var envProfile))
            return envProfile;

        // 2. Configuration section
        var configValue = configuration?["Seeding:Profile"];
        if (!string.IsNullOrWhiteSpace(configValue) && Enum.TryParse<SeedProfile>(configValue, ignoreCase: true, out var cfgProfile))
            return cfgProfile;

        // 3. Default to Dev for local development
        return SeedProfile.Dev;
    }

    /// <summary>
    /// Filter layers by profile ordinal: layer runs if MinimumProfile &lt;= active profile.
    /// </summary>
    internal static IEnumerable<ISeedLayer> FilterLayers(IEnumerable<ISeedLayer> layers, SeedProfile profile)
        => layers.Where(l => l.MinimumProfile <= profile).OrderBy(l => l.MinimumProfile);
}
