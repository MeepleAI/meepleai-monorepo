'use client';

/**
 * CreateSessionStep — Step 3 of GameNightWizard.
 *
 * Player name inputs (2-8 players) + create session.
 *
 * Issue #123 — Game Night Quick Start Wizard
 */

import { useCallback, useState } from 'react';

import { Loader2, Plus, Trash2, Users } from 'lucide-react';

import { Button } from '@/components/ui/primitives/button';
import { Input } from '@/components/ui/primitives/input';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface CreateSessionStepProps {
  gameId: string;
  gameTitle: string;
  onSessionCreated: (sessionId: string) => void;
}

const PLAYER_COLORS = [
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Purple',
  'Orange',
  'Pink',
  'Teal',
] as const;

// ============================================================================
// Component
// ============================================================================

export function CreateSessionStep({ gameId, gameTitle, onSessionCreated }: CreateSessionStepProps) {
  const [players, setPlayers] = useState<string[]>(['', '']);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAddPlayer = players.length < 8;
  const canRemovePlayer = players.length > 2;
  const validPlayers = players.filter(p => p.trim().length > 0);
  const canCreate = validPlayers.length >= 2 && !isCreating;

  const handlePlayerChange = useCallback((index: number, value: string) => {
    setPlayers(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleAddPlayer = useCallback(() => {
    if (canAddPlayer) {
      setPlayers(prev => [...prev, '']);
    }
  }, [canAddPlayer]);

  const handleRemovePlayer = useCallback(
    (index: number) => {
      if (canRemovePlayer) {
        setPlayers(prev => prev.filter((_, i) => i !== index));
      }
    },
    [canRemovePlayer]
  );

  const handleCreate = useCallback(async () => {
    if (!canCreate) return;
    setIsCreating(true);
    setError(null);

    try {
      // Create session
      const sessionId = await api.liveSessions.createSession({
        gameId,
        gameName: gameTitle,
      });

      // Add players
      for (let i = 0; i < validPlayers.length; i++) {
        await api.liveSessions.addPlayer(sessionId, {
          displayName: validPlayers[i],
          color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        });
      }

      // Start the session
      await api.liveSessions.startSession(sessionId);

      onSessionCreated(sessionId);
    } catch {
      setError('Errore nella creazione della sessione. Riprova.');
      setIsCreating(false);
    }
  }, [canCreate, gameId, gameTitle, validPlayers, onSessionCreated]);

  return (
    <div className="space-y-4" data-testid="create-session-step">
      <div>
        <h3 className="font-quicksand font-bold text-lg text-slate-900 dark:text-slate-100">
          Giocatori
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Aggiungi i giocatori per <strong>{gameTitle}</strong> (min 2, max 8).
        </p>
      </div>

      <div className="space-y-2">
        {players.map((name, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
              style={{
                backgroundColor:
                  index === 0
                    ? '#ef4444'
                    : index === 1
                      ? '#3b82f6'
                      : index === 2
                        ? '#22c55e'
                        : index === 3
                          ? '#eab308'
                          : index === 4
                            ? '#a855f7'
                            : index === 5
                              ? '#f97316'
                              : index === 6
                                ? '#ec4899'
                                : '#14b8a6',
              }}
            >
              {index + 1}
            </div>
            <Input
              placeholder={`Giocatore ${index + 1}`}
              value={name}
              onChange={e => handlePlayerChange(index, e.target.value)}
              data-testid={`player-input-${index}`}
            />
            {canRemovePlayer && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemovePlayer(index)}
                className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Rimuovi giocatore ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {canAddPlayer && (
        <Button
          variant="outline"
          onClick={handleAddPlayer}
          className="w-full"
          data-testid="add-player-button"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Aggiungi giocatore
        </Button>
      )}

      {error && (
        <p className="text-sm text-destructive text-center" data-testid="create-session-error">
          {error}
        </p>
      )}

      <Button
        onClick={handleCreate}
        disabled={!canCreate}
        className={cn('w-full bg-amber-600 hover:bg-amber-700 text-white')}
        data-testid="create-session-button"
      >
        {isCreating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            Creazione in corso...
          </>
        ) : (
          <>
            <Users className="h-4 w-4 mr-2" aria-hidden="true" />
            Inizia Partita ({validPlayers.length} giocatori)
          </>
        )}
      </Button>
    </div>
  );
}
