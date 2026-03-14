using Api.BoundedContexts.SessionTracking.Domain.Entities;
using Api.BoundedContexts.SessionTracking.Domain.Repositories;
using Api.Infrastructure;
using Api.Infrastructure.Entities.SessionTracking;
using Microsoft.EntityFrameworkCore;

namespace Api.BoundedContexts.SessionTracking.Infrastructure.Persistence;

/// <summary>
/// Issue #278: EF Core repository for session checkpoints.
/// </summary>
internal sealed class SessionCheckpointRepository : ISessionCheckpointRepository
{
    private readonly MeepleAiDbContext _context;

    public SessionCheckpointRepository(MeepleAiDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<SessionCheckpoint?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.SessionCheckpoints
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken)
            .ConfigureAwait(false);

        return entity is null ? null : SessionCheckpointMapper.ToDomain(entity);
    }

    public async Task<IReadOnlyList<SessionCheckpoint>> GetBySessionIdAsync(Guid sessionId, CancellationToken cancellationToken = default)
    {
        var entities = await _context.SessionCheckpoints
            .AsNoTracking()
            .Where(e => e.SessionId == sessionId)
            .OrderByDescending(e => e.Timestamp)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return entities.Select(SessionCheckpointMapper.ToDomain).ToList();
    }

    public async Task AddAsync(SessionCheckpoint checkpoint, CancellationToken cancellationToken = default)
    {
        var entity = SessionCheckpointMapper.ToEntity(checkpoint);
        _context.SessionCheckpoints.Add(entity);
        await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.SessionCheckpoints
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken)
            .ConfigureAwait(false);

        if (entity is not null)
        {
            _context.SessionCheckpoints.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }
    }
}

/// <summary>
/// Maps between SessionCheckpoint domain entity and SessionCheckpointEntity persistence entity.
/// </summary>
internal static class SessionCheckpointMapper
{
    public static SessionCheckpointEntity ToEntity(SessionCheckpoint domain)
    {
        ArgumentNullException.ThrowIfNull(domain);

        return new SessionCheckpointEntity
        {
            Id = domain.Id,
            SessionId = domain.SessionId,
            Name = domain.Name,
            Timestamp = domain.Timestamp,
            SnapshotData = domain.SnapshotData,
            DiaryEventCount = domain.DiaryEventCount,
            CreatedBy = domain.CreatedBy
        };
    }

    public static SessionCheckpoint ToDomain(SessionCheckpointEntity entity)
    {
        ArgumentNullException.ThrowIfNull(entity);

        var checkpoint = (SessionCheckpoint)Activator.CreateInstance(typeof(SessionCheckpoint), true)!;

        typeof(SessionCheckpoint).GetProperty(nameof(SessionCheckpoint.Id))!.SetValue(checkpoint, entity.Id);
        typeof(SessionCheckpoint).GetProperty(nameof(SessionCheckpoint.SessionId))!.SetValue(checkpoint, entity.SessionId);
        typeof(SessionCheckpoint).GetProperty(nameof(SessionCheckpoint.Name))!.SetValue(checkpoint, entity.Name);
        typeof(SessionCheckpoint).GetProperty(nameof(SessionCheckpoint.Timestamp))!.SetValue(checkpoint, entity.Timestamp);
        typeof(SessionCheckpoint).GetProperty(nameof(SessionCheckpoint.SnapshotData))!.SetValue(checkpoint, entity.SnapshotData);
        typeof(SessionCheckpoint).GetProperty(nameof(SessionCheckpoint.DiaryEventCount))!.SetValue(checkpoint, entity.DiaryEventCount);
        typeof(SessionCheckpoint).GetProperty(nameof(SessionCheckpoint.CreatedBy))!.SetValue(checkpoint, entity.CreatedBy);

        return checkpoint;
    }
}
