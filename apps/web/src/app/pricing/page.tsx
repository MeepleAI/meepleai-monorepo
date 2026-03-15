/**
 * Public Pricing Page (Game Night Improvvisata)
 *
 * Shows tier comparison cards: Free / Premium / Contributor.
 * This is a PUBLIC page — NOT under the (authenticated) route group.
 */

import { CheckCircle, XCircle, Crown, Users, Gamepad2 } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prezzi | MeepleAI',
  description: 'Scegli il piano giusto per la tua esperienza di gioco da tavolo con MeepleAI.',
};

// ── Feature table data ─────────────────────────────────────────────────────────

interface Feature {
  label: string;
  free: string | boolean;
  premium: string | boolean;
  contributor: string | boolean;
}

const FEATURES: Feature[] = [
  {
    label: 'Giochi privati',
    free: '3',
    premium: '15',
    contributor: 'Illimitati',
  },
  {
    label: 'PDF / mese',
    free: '3',
    premium: '15',
    contributor: 'Illimitati',
  },
  {
    label: 'Agent AI',
    free: '1',
    premium: '10',
    contributor: 'Illimitati',
  },
  {
    label: 'Query / giorno',
    free: '20',
    premium: '200',
    contributor: 'Illimitate',
  },
  {
    label: 'Giocatori / sessione',
    free: '6',
    premium: '12',
    contributor: '12',
  },
  {
    label: 'Foto / sessione',
    free: '5',
    premium: '20',
    contributor: '20',
  },
  {
    label: 'Salvataggio sessione',
    free: false,
    premium: true,
    contributor: true,
  },
  {
    label: 'Modelli AI',
    free: 'Base',
    premium: 'Standard',
    contributor: 'Standard',
  },
];

// ── Cell renderer ──────────────────────────────────────────────────────────────

function FeatureCell({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <CheckCircle
        className={cn('mx-auto h-5 w-5', highlight ? 'text-amber-500' : 'text-green-500')}
        aria-label="Incluso"
      />
    ) : (
      <XCircle className="mx-auto h-5 w-5 text-muted-foreground/50" aria-label="Non incluso" />
    );
  }
  return (
    <span className={cn('font-medium', highlight && 'text-amber-700 dark:text-amber-400')}>
      {value}
    </span>
  );
}

// ── Tier card ──────────────────────────────────────────────────────────────────

interface TierCardProps {
  name: string;
  price: string;
  priceNote?: string;
  description: string;
  icon: React.ReactNode;
  ctaLabel: string;
  ctaHref: string;
  ctaVariant?: 'primary' | 'outline';
  highlighted?: boolean;
  badge?: string;
}

function TierCard({
  name,
  price,
  priceNote,
  description,
  icon,
  ctaLabel,
  ctaHref,
  ctaVariant = 'outline',
  highlighted,
  badge,
}: TierCardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md',
        highlighted
          ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-950/20'
          : 'border-border bg-white/70 backdrop-blur-md dark:bg-zinc-900/70'
      )}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow">
            {badge}
          </span>
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            highlighted
              ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {icon}
        </div>
        <div>
          <h3 className="font-quicksand text-lg font-bold">{name}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mb-6">
        <span className="font-quicksand text-3xl font-extrabold">{price}</span>
        {priceNote && <span className="ml-1 text-sm text-muted-foreground">{priceNote}</span>}
      </div>

      <Link
        href={ctaHref}
        className={cn(
          'block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors',
          ctaVariant === 'primary'
            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow'
            : 'border border-border bg-transparent hover:bg-muted'
        )}
        data-testid={`cta-${name.toLowerCase()}`}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-12 text-center">
          <h1 className="font-quicksand text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Scegli il tuo piano
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Inizia gratis. Passa a Premium quando sei pronto.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid gap-6 sm:grid-cols-3 mb-16">
          <TierCard
            name="Free"
            price="€0"
            priceNote="per sempre"
            description="Per iniziare a giocare"
            icon={<Gamepad2 className="h-5 w-5" />}
            ctaLabel="Inizia gratis"
            ctaHref="/auth/register"
            ctaVariant="outline"
          />

          <TierCard
            name="Premium"
            price="€4.99"
            priceNote="/ mese"
            description="Per chi gioca seriamente"
            icon={<Crown className="h-5 w-5" />}
            ctaLabel="Passa a Premium"
            ctaHref="/auth/register?plan=premium"
            ctaVariant="primary"
            highlighted
            badge="Consigliato"
          />

          <TierCard
            name="Contributor"
            price="Ruolo"
            priceNote="gratuito"
            description="Per chi contribuisce al catalogo"
            icon={<Users className="h-5 w-5" />}
            ctaLabel="Diventa Contributor"
            ctaHref="/library?tab=proposals"
            ctaVariant="outline"
          />
        </div>

        {/* Feature comparison table */}
        <div className="overflow-x-auto rounded-2xl border bg-white/80 shadow-sm dark:bg-zinc-900/80">
          <table className="w-full text-sm" data-testid="pricing-table">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-4 text-left font-medium text-muted-foreground">
                  Funzionalità
                </th>
                <th className="px-4 py-4 text-center font-quicksand font-bold">Free</th>
                <th className="px-4 py-4 text-center font-quicksand font-bold text-amber-600">
                  Premium
                </th>
                <th className="px-4 py-4 text-center font-quicksand font-bold">Contributor</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature, idx) => (
                <tr
                  key={feature.label}
                  className={cn(
                    'border-b last:border-0',
                    idx % 2 === 0 ? 'bg-transparent' : 'bg-muted/30'
                  )}
                >
                  <td className="px-6 py-3 text-muted-foreground">{feature.label}</td>
                  <td className="px-4 py-3 text-center">
                    <FeatureCell value={feature.free} />
                  </td>
                  <td className="px-4 py-3 text-center bg-amber-50/40 dark:bg-amber-950/10">
                    <FeatureCell value={feature.premium} highlight />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <FeatureCell value={feature.contributor} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Contributor note */}
        <div className="mt-8 rounded-xl border border-border bg-white/60 px-6 py-4 text-sm text-muted-foreground backdrop-blur-sm dark:bg-zinc-900/60">
          <span className="font-semibold text-foreground">Nota Contributor:</span> Contributor è un
          ruolo, non un piano a pagamento. Richiede l&apos;approvazione di 5 o più giochi nel
          catalogo condiviso. Una volta ottenuto il ruolo, accedi ai limiti estesi gratuitamente.
        </div>

        {/* FAQ teaser / bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm mb-4">
            Hai domande? Contattaci o consulta la documentazione.
          </p>
          <Link
            href="/auth/register"
            className="inline-block rounded-xl bg-amber-500 px-8 py-3 font-quicksand font-bold text-white shadow hover:bg-amber-600 transition-colors"
            data-testid="cta-bottom"
          >
            Inizia gratis oggi
          </Link>
        </div>
      </div>
    </main>
  );
}
