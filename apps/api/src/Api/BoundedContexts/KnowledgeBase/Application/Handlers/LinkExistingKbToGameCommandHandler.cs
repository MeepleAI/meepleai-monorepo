using Api.BoundedContexts.KnowledgeBase.Application.Commands;
using Api.BoundedContexts.KnowledgeBase.Application.DTOs;
using Api.BoundedContexts.KnowledgeBase.Domain.Entities;
using Api.BoundedContexts.KnowledgeBase.Domain.Repositories;
using Api.Infrastructure;
using Api.Middleware.Exceptions;
using Api.SharedKernel.Application.Interfaces;
using Api.SharedKernel.Exceptions;
using Api.SharedKernel.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Api.BoundedContexts.KnowledgeBase.Application.Handlers;

/// <summary>
/// Handler uses MeepleAiDbContext for read-only cross-BC queries (same pattern as RagAccessService).
/// Write operations go through IVectorDocumentRepository.
/// </summary>
internal class LinkExistingKbToGameCommandHandler
    : ICommandHandler<LinkExistingKbToGameCommand, LinkKbResultDto>
{
    private readonly MeepleAiDbContext _db;
    private readonly IVectorDocumentRepository _vectorDocumentRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<LinkExistingKbToGameCommandHandler> _logger;

    public LinkExistingKbToGameCommandHandler(
        MeepleAiDbContext db,
        IVectorDocumentRepository vectorDocumentRepo,
        IUnitOfWork unitOfWork,
        ILogger<LinkExistingKbToGameCommandHandler> logger)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _vectorDocumentRepo = vectorDocumentRepo ?? throw new ArgumentNullException(nameof(vectorDocumentRepo));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<LinkKbResultDto> Handle(
        LinkExistingKbToGameCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        // 1. Validate source PDF exists and is accessible
        var sourcePdf = await _db.PdfDocuments
            .AsNoTracking()
            .Where(p => p.Id == command.SourcePdfDocumentId)
            .Select(p => new { p.Id, p.UploadedByUserId, p.SharedGameId, p.ProcessingState, p.FileName, p.Language })
            .FirstOrDefaultAsync(cancellationToken).ConfigureAwait(false);

        if (sourcePdf == null)
            throw new NotFoundException($"PdfDocument {command.SourcePdfDocumentId} not found");

        // 2. Access check: user owns the PDF OR it's a SharedGame PDF
        var isOwner = sourcePdf.UploadedByUserId == command.UserId;
        var isShared = sourcePdf.SharedGameId != null;
        if (!isOwner && !isShared)
            throw new ForbiddenException("Cannot link a PDF you don't own");

        // 3. Resolve target GameId (may be SharedGame ID → games.Id)
        var targetGameId = await _db.Games
            .AsNoTracking()
            .Where(g => g.Id == command.TargetGameId || g.SharedGameId == command.TargetGameId)
            .Select(g => g.Id)
            .FirstOrDefaultAsync(cancellationToken).ConfigureAwait(false);

        if (targetGameId == Guid.Empty)
            throw new NotFoundException($"Game {command.TargetGameId} not found");

        // 4. Check if already linked (idempotency)
        var alreadyLinked = await _db.VectorDocuments
            .AnyAsync(vd => vd.GameId == targetGameId
                         && vd.PdfDocumentId == command.SourcePdfDocumentId,
                cancellationToken).ConfigureAwait(false);

        if (alreadyLinked)
        {
            var existingVdId = await _db.VectorDocuments
                .Where(vd => vd.GameId == targetGameId && vd.PdfDocumentId == command.SourcePdfDocumentId)
                .Select(vd => vd.Id)
                .FirstAsync(cancellationToken).ConfigureAwait(false);

            return new LinkKbResultDto(existingVdId, targetGameId, command.SourcePdfDocumentId, "linked");
        }

        // 5. Find source VectorDocument (if PDF is Ready)
        // VectorDocumentEntity (infra) has ChunkCount; Language comes from PdfDocumentEntity
        var sourceVd = await _db.VectorDocuments
            .AsNoTracking()
            .Where(vd => vd.PdfDocumentId == command.SourcePdfDocumentId)
            .Select(vd => new { vd.Id, vd.ChunkCount, vd.SharedGameId })
            .FirstOrDefaultAsync(cancellationToken).ConfigureAwait(false);

        if (sourceVd == null)
        {
            _logger.LogInformation(
                "PDF {PdfId} not yet indexed, link will be pending for game {GameId}",
                command.SourcePdfDocumentId, targetGameId);

            return new LinkKbResultDto(Guid.Empty, targetGameId, command.SourcePdfDocumentId, "pending");
        }

        // 6. Create VectorDocument clone for the target game
        var language = sourcePdf.Language ?? "en";
        var clonedVd = new VectorDocument(
            id: Guid.NewGuid(),
            gameId: targetGameId,
            pdfDocumentId: command.SourcePdfDocumentId,
            language: language,
            totalChunks: sourceVd.ChunkCount,
            sharedGameId: sourcePdf.SharedGameId);

        await _vectorDocumentRepo.AddAsync(clonedVd, cancellationToken).ConfigureAwait(false);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        _logger.LogInformation(
            "Linked KB {SourceVdId} → cloned as {ClonedVdId} for game {TargetGameId}",
            sourceVd.Id, clonedVd.Id, targetGameId);

        return new LinkKbResultDto(clonedVd.Id, targetGameId, command.SourcePdfDocumentId, "linked");
    }
}
