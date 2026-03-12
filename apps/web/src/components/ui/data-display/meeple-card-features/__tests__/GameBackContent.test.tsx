import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { GameBackContent, GameBackData, GameBackActions } from '../GameBackContent';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock date-fns to control relative time output
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn((date: Date) => {
    // Return predictable strings based on date
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'tra 2 giorni';
    if (diffMs < 86400000) return 'meno di un giorno fa';
    return '3 giorni fa';
  }),
}));

vi.mock('date-fns/locale', () => ({
  it: { code: 'it' },
}));

const defaultData: GameBackData = {
  complexityRating: 3.2,
  playingTimeMinutes: 90,
  minPlayers: 2,
  maxPlayers: 4,
  averageRating: 7.8,
  timesPlayed: 12,
  kbDocuments: [
    { id: '1', fileName: 'rules.pdf', status: 'Ready' },
    { id: '2', fileName: 'faq.pdf', status: 'processing' },
  ],
  hasKb: true,
  kbCardCount: 5,
  lastPlayedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  winRate: 65,
  nextGameNight: new Date(Date.now() + 2 * 86400000).toISOString(),
  entityLinkCount: 3,
  noteCount: 2,
};

const defaultActions: GameBackActions = {
  onChatAgent: vi.fn(),
  onToggleFavorite: vi.fn(),
  isFavorite: false,
  onNewSession: vi.fn(),
  onAddToGameNight: vi.fn(),
  onViewLinks: vi.fn(),
};

function renderComponent(
  dataOverrides?: Partial<GameBackData>,
  actionsOverrides?: Partial<GameBackActions> | null,
  props?: { title?: string; detailHref?: string; entityColor?: string }
) {
  const data = { ...defaultData, ...dataOverrides };
  const actions =
    actionsOverrides === null ? undefined : { ...defaultActions, ...actionsOverrides };
  return render(
    <GameBackContent
      data={data}
      actions={actions}
      title={props?.title ?? 'Catan'}
      detailHref={props?.detailHref ?? '/games/catan'}
      entityColor={props?.entityColor}
      {...props}
    />
  );
}

// ============================================================================
// GameBackContent — basic render
// ============================================================================

describe('GameBackContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with all data provided', () => {
    renderComponent();
    expect(screen.getByTestId('game-back-content')).toBeInTheDocument();
    expect(screen.getByText('Catan')).toBeInTheDocument();
  });

  it('falls back to "Statistiche" when no title', () => {
    renderComponent({}, {}, { title: undefined });
    expect(screen.getByText('Statistiche')).toBeInTheDocument();
  });
});

// ============================================================================
// Enriched Header
// ============================================================================

describe('Enriched Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "Mai giocato" when lastPlayedAt is undefined', () => {
    renderComponent({ lastPlayedAt: undefined });
    expect(screen.getByText(/Mai giocato/)).toBeInTheDocument();
  });

  it('shows relative date when lastPlayedAt is provided', () => {
    renderComponent({ lastPlayedAt: new Date(Date.now() - 3 * 86400000).toISOString() });
    expect(screen.getByText(/3 giorni fa/)).toBeInTheDocument();
  });

  it('shows win rate when provided', () => {
    renderComponent({ winRate: 65 });
    expect(screen.getByText(/Win rate 65%/)).toBeInTheDocument();
  });

  it('omits win rate when not provided', () => {
    renderComponent({ winRate: undefined });
    expect(screen.queryByText(/Win rate/)).not.toBeInTheDocument();
  });
});

// ============================================================================
// InfoChips
// ============================================================================

describe('InfoChips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders player range chip', () => {
    renderComponent({ minPlayers: 2, maxPlayers: 4 });
    expect(screen.getByText('2-4')).toBeInTheDocument();
  });

  it('renders single player count when min equals max', () => {
    renderComponent({ minPlayers: 3, maxPlayers: 3, entityLinkCount: 0 });
    const infoChips = screen.getByTestId('info-chips');
    expect(infoChips).toHaveTextContent('3');
  });

  it('renders playing time chip', () => {
    renderComponent({ playingTimeMinutes: 90 });
    expect(screen.getByText('90m')).toBeInTheDocument();
  });

  it('renders 5 complexity dots', () => {
    renderComponent({ complexityRating: 3.2 });
    const dotsContainer = screen.getByTestId('complexity-dots');
    const dots = dotsContainer.querySelectorAll('span.rounded-full');
    expect(dots).toHaveLength(5);
  });

  it('renders filled dots matching rounded complexity', () => {
    renderComponent({ complexityRating: 3.2 });
    const dotsContainer = screen.getByTestId('complexity-dots');
    const dots = dotsContainer.querySelectorAll('span.rounded-full');
    const filled = Array.from(dots).filter(d => d.classList.contains('bg-current'));
    expect(filled).toHaveLength(3);
  });

  it('hides complexity chip when null', () => {
    renderComponent({ complexityRating: null });
    expect(screen.queryByTestId('complexity-dots')).not.toBeInTheDocument();
  });
});

// ============================================================================
// ContextualActions
// ============================================================================

describe('ContextualActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fires onNewSession with stopPropagation', () => {
    const onNewSession = vi.fn();
    renderComponent({}, { onNewSession });
    const btn = screen.getByText('Nuova Sessione').closest('button')!;
    const event = new MouseEvent('click', { bubbles: true });
    const stopProp = vi.spyOn(event, 'stopPropagation');
    fireEvent(btn, event);
    expect(onNewSession).toHaveBeenCalledTimes(1);
    expect(stopProp).toHaveBeenCalled();
  });

  it('shows "Nessuna partita" for timesPlayed=0', () => {
    renderComponent({ timesPlayed: 0 });
    expect(screen.getByText('Nessuna partita')).toBeInTheDocument();
  });

  it('shows play count context', () => {
    renderComponent({ timesPlayed: 12 });
    expect(screen.getByText('12 partite giocate')).toBeInTheDocument();
  });

  it('shows Espansioni when entityLinkCount > 0', () => {
    renderComponent({ entityLinkCount: 3 });
    expect(screen.getByText('Espansioni')).toBeInTheDocument();
  });

  it('hides Espansioni when entityLinkCount is 0', () => {
    renderComponent({ entityLinkCount: 0 });
    expect(screen.queryByText('Espansioni')).not.toBeInTheDocument();
  });

  it('shows Aggiungi a serata when onAddToGameNight is provided', () => {
    renderComponent({}, { onAddToGameNight: vi.fn() });
    expect(screen.getByText('Aggiungi a serata')).toBeInTheDocument();
  });

  it('hides Aggiungi a serata when onAddToGameNight is undefined', () => {
    renderComponent({}, { onAddToGameNight: undefined });
    expect(screen.queryByText('Aggiungi a serata')).not.toBeInTheDocument();
  });
});

// ============================================================================
// KB Context Label
// ============================================================================

describe('KB Context Label', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "KB pronta · N doc" when hasKb and kbCardCount > 0', () => {
    renderComponent({ hasKb: true, kbCardCount: 5 });
    const label = screen.getByTestId('kb-context-label');
    expect(label).toHaveTextContent('KB pronta · 5 doc');
  });

  it('shows "KB in elaborazione" when hasKb but kbCardCount is 0', () => {
    renderComponent({ hasKb: true, kbCardCount: 0 });
    const label = screen.getByTestId('kb-context-label');
    expect(label).toHaveTextContent('KB in elaborazione');
  });

  it('does not show KB label when hasKb is false', () => {
    renderComponent({ hasKb: false, kbCardCount: 0 });
    expect(screen.queryByText(/KB pronta/)).not.toBeInTheDocument();
    expect(screen.queryByText(/KB in elaborazione/)).not.toBeInTheDocument();
  });
});

// ============================================================================
// Compact Footer
// ============================================================================

describe('Compact Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders filled heart when isFavorite is true', () => {
    renderComponent({}, { isFavorite: true });
    const favBtn = screen.getByTestId('favorite-toggle');
    expect(favBtn.querySelector('[data-filled="true"]')).toBeInTheDocument();
  });

  it('renders outline heart when isFavorite is false', () => {
    renderComponent({}, { isFavorite: false });
    const favBtn = screen.getByTestId('favorite-toggle');
    expect(favBtn.querySelector('[data-filled="false"]')).toBeInTheDocument();
  });

  it('shows noteCount when > 0', () => {
    renderComponent({ noteCount: 2 });
    const noteIndicator = screen.getByTestId('note-count-indicator');
    expect(noteIndicator).toHaveTextContent('2');
  });

  it('hides noteCount indicator when 0', () => {
    renderComponent({ noteCount: 0 });
    // StickyNote icon should not appear in footer when noteCount is 0
    expect(screen.queryByTestId('note-count-indicator')).not.toBeInTheDocument();
  });

  it('renders detail link', () => {
    renderComponent({}, {}, { detailHref: '/games/catan' });
    const link = screen.getByTestId('game-detail-link');
    expect(link).toHaveAttribute('href', '/games/catan');
    expect(link).toHaveTextContent('Dettaglio →');
  });

  it('rejects unsafe href', () => {
    renderComponent({}, {}, { detailHref: '//evil.com' });
    expect(screen.queryByTestId('game-detail-link')).not.toBeInTheDocument();
  });

  it('rejects javascript href', () => {
    renderComponent({}, {}, { detailHref: 'javascript:alert(1)' });
    expect(screen.queryByTestId('game-detail-link')).not.toBeInTheDocument();
  });
});
