using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.Infrastructure.Seeders;

/// <summary>
/// PostgreSQL advisory lock wrapper for safe multi-replica seeding.
/// Uses session-level advisory locks (released on disconnect).
/// </summary>
internal static class AdvisoryLockHelper
{
    /// <summary>
    /// Deterministic lock key derived from "MeepleAI_Seeding" hash.
    /// All replicas must use the same key.
    /// </summary>
    public static long SeedingLockKey { get; } = GetDeterministicHashCode("MeepleAI_Seeding");

    public static string AcquireLockSql => $"SELECT pg_advisory_lock({SeedingLockKey})";
    public static string ReleaseLockSql => $"SELECT pg_advisory_unlock({SeedingLockKey})";

    /// <summary>
    /// Acquires the advisory lock. Blocks until the lock is available.
    /// </summary>
    public static async Task AcquireAsync(MeepleAiDbContext db, ILogger logger, CancellationToken ct = default)
    {
        logger.LogInformation("Acquiring seeding advisory lock (key={LockKey})...", SeedingLockKey);
        await db.Database.ExecuteSqlRawAsync(AcquireLockSql, ct).ConfigureAwait(false);
        logger.LogInformation("Seeding advisory lock acquired");
    }

    /// <summary>
    /// Releases the advisory lock.
    /// </summary>
    public static async Task ReleaseAsync(MeepleAiDbContext db, ILogger logger, CancellationToken ct = default)
    {
        await db.Database.ExecuteSqlRawAsync(ReleaseLockSql, ct).ConfigureAwait(false);
        logger.LogInformation("Seeding advisory lock released");
    }

    /// <summary>
    /// Deterministic hash code that doesn't change across app restarts (.NET randomizes GetHashCode).
    /// </summary>
    private static long GetDeterministicHashCode(string str)
    {
        unchecked
        {
            long hash = 5381;
            foreach (var c in str)
            {
                hash = ((hash << 5) + hash) ^ c;
            }
            return hash;
        }
    }
}
