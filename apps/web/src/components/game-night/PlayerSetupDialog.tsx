'use client';

import { useState, useCallback } from 'react';

import { Gamepad2, Loader2, Plus, Trash2, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/overlays/dialog';
import { Input } from '@/components/ui/primitives/input';
import type { PlayerColor } from '@/lib/api/schemas/live-sessions.schemas';

const PLAYER_COLORS: ReadonlyArray<{ name: PlayerColor; hex: string }> = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Teal', hex: '#14b8a6' },
];

export interface PlayerSetup {
  displayName: string;
  color: PlayerColor;
}

interface PlayerSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameName: string;
  minPlayers: number;
  maxPlayers: number;
  onStart: (players: PlayerSetup[]) => void;
  isLoading: boolean;
}

export function PlayerSetupDialog({
  open,
  onOpenChange,
  gameName,
  minPlayers,
  maxPlayers,
  onStart,
  isLoading,
}: PlayerSetupDialogProps) {
  const [players, setPlayers] = useState<PlayerSetup[]>([
    { displayName: '', color: PLAYER_COLORS[0].name },
  ]);

  const addPlayer = useCallback(() => {
    if (players.length >= maxPlayers) return;
    const usedColors = new Set(players.map(p => p.color));
    const nextColor =
      PLAYER_COLORS.find(c => !usedColors.has(c.name))?.name ?? PLAYER_COLORS[0].name;
    setPlayers(prev => [...prev, { displayName: '', color: nextColor }]);
  }, [players, maxPlayers]);

  const removePlayer = useCallback((index: number) => {
    setPlayers(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updatePlayerName = useCallback((index: number, value: string) => {
    setPlayers(prev => prev.map((p, i) => (i === index ? { ...p, displayName: value } : p)));
  }, []);

  const updatePlayerColor = useCallback((index: number, value: PlayerColor) => {
    setPlayers(prev => prev.map((p, i) => (i === index ? { ...p, color: value } : p)));
  }, []);

  const validPlayers = players.filter(p => p.displayName.trim().length > 0);
  const canStart = validPlayers.length >= Math.max(1, minPlayers);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="player-setup-dialog">
        <DialogTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-amber-600" />
          {gameName} — Giocatori
        </DialogTitle>

        <div className="space-y-3 pt-2">
          <p className="text-sm text-muted-foreground">
            Aggiungi i giocatori ({minPlayers}&ndash;{maxPlayers} giocatori).
          </p>

          {players.map((player, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-full flex-shrink-0 border"
                style={{
                  backgroundColor:
                    PLAYER_COLORS.find(c => c.name === player.color)?.hex ?? '#9ca3af',
                }}
              />
              <Input
                value={player.displayName}
                onChange={e => updatePlayerName(i, e.target.value)}
                placeholder="Nome giocatore"
                className="flex-1"
              />
              <select
                value={player.color}
                onChange={e => updatePlayerColor(i, e.target.value as PlayerColor)}
                className="text-xs border rounded px-2 py-1.5 bg-background"
                aria-label={`Colore giocatore ${i + 1}`}
              >
                {PLAYER_COLORS.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              {players.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removePlayer(i)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}

          {players.length < maxPlayers && (
            <Button variant="outline" size="sm" onClick={addPlayer} className="w-full">
              <Plus className="h-4 w-4 mr-1" /> Aggiungi giocatore
            </Button>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button
              size="sm"
              disabled={!canStart || isLoading}
              onClick={() => onStart(validPlayers)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Gamepad2 className="h-4 w-4 mr-2" />
              )}
              Inizia Partita
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
