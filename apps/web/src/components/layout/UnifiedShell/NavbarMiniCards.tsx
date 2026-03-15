'use client';

import type { HandCard } from '@/stores/use-card-hand';

const ENTITY_COLORS: Record<string, string> = {
  game: '25 95% 45%',
  player: '262 83% 58%',
  session: '240 60% 55%',
  agent: '38 92% 50%',
  kb: '174 60% 40%',
  chatSession: '220 80% 55%',
  event: '350 89% 60%',
  toolkit: '142 70% 45%',
  tool: '195 80% 50%',
  custom: '220 70% 50%',
};

const ENTITY_EMOJI: Record<string, string> = {
  game: '\uD83C\uDFB2',
  player: '\uD83D\uDC64',
  session: '\uD83D\uDCCB',
  agent: '\uD83E\uDD16',
  kb: '\uD83D\uDCDA',
  chatSession: '\uD83D\uDCAC',
  event: '\uD83C\uDF89',
  toolkit: '\uD83D\uDD27',
  tool: '\u2699\uFE0F',
  custom: '\u2B50',
};

interface NavbarMiniCardsProps {
  cards: HandCard[];
  onExpand: (cardId: string) => void;
}

export function NavbarMiniCards({ cards, onExpand }: NavbarMiniCardsProps) {
  return (
    <div className="flex items-center gap-0.5">
      {cards.map(card => (
        <button
          key={card.id}
          type="button"
          aria-label={card.title}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
          onClick={() => onExpand(card.id)}
        >
          {card.imageUrl ? (
            <img src={card.imageUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
              style={{
                backgroundColor: `hsl(${ENTITY_COLORS[card.entity] ?? ENTITY_COLORS.custom})`,
              }}
            >
              {ENTITY_EMOJI[card.entity] ?? ENTITY_EMOJI.custom}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
