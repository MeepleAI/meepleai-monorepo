'use client';

import Link from 'next/link';

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

const ENTITY_EMOJIS: Record<string, string> = {
  game: '\uD83C\uDFB2',
  player: '\uD83D\uDC64',
  session: '\uD83C\uDFAE',
  agent: '\uD83E\uDD16',
  kb: '\uD83D\uDCC4',
  chatSession: '\uD83D\uDCAC',
  event: '\uD83D\uDCC5',
  toolkit: '\uD83D\uDD27',
  tool: '\uD83D\uDD28',
  custom: '\uD83D\uDCCC',
};

interface HandDrawerCardProps {
  card: HandCard;
  isFocused: boolean;
  onClick: () => void;
}

export function HandDrawerCard({ card, isFocused, onClick }: HandDrawerCardProps) {
  const entityColor = ENTITY_COLORS[card.entity] ?? ENTITY_COLORS.custom;
  const entityEmoji = ENTITY_EMOJIS[card.entity] ?? ENTITY_EMOJIS.custom;

  const focusedStyle: React.CSSProperties = isFocused
    ? {
        opacity: 1,
        border: `1.5px solid hsl(${entityColor} / 0.6)`,
        boxShadow: `0 0 8px hsl(${entityColor} / 0.2)`,
      }
    : {
        opacity: 0.45,
        border: '1.5px solid transparent',
      };

  return (
    <Link
      href={card.href}
      role="link"
      onClick={onClick}
      aria-current={isFocused ? 'page' : undefined}
      className="block rounded-lg transition-all duration-200 ease-in-out hover:opacity-70 hover:-translate-y-0.5"
      style={{
        width: 36,
        height: 36,
        overflow: 'hidden',
        ...focusedStyle,
      }}
    >
      {card.imageUrl ? (
        <img
          src={card.imageUrl}
          alt={card.title}
          className="h-full w-full object-cover rounded-lg"
          style={{ display: 'block' }}
        />
      ) : (
        <span
          aria-label={card.title}
          className="flex h-full w-full items-center justify-center rounded-lg text-sm"
          style={{
            background: `linear-gradient(135deg, hsl(${entityColor} / 0.25), hsl(${entityColor} / 0.45))`,
          }}
        >
          {entityEmoji}
        </span>
      )}
    </Link>
  );
}
