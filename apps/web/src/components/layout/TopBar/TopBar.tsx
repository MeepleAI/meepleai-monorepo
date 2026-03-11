/**
 * TopBar — 48px sticky header (Level 1)
 * Issue #154 — TopBar with breadcrumb, Command-K search, UserMenu
 *
 * Slim bar replacing TopNavbar for the Game Table layout.
 *
 *   [hamburger (mobile)] [Logo (mobile)] [Breadcrumb (desktop)]   [Cerca... cmd+K]   [bell] [Avatar]
 */

'use client';

import { Suspense, useEffect, useRef, useState } from 'react';

import { ChevronDown, LogOut, Search, Settings, User } from 'lucide-react';
import Link from 'next/link';

import { logoutAction } from '@/actions/auth';
import { DesktopBreadcrumb } from '@/components/layout/Breadcrumb/DesktopBreadcrumb';
import { MobileNavDrawer } from '@/components/layout/MobileNavDrawer';
import { Logo } from '@/components/layout/Navbar/Logo';
import { NotificationBell } from '@/components/notifications';
import { ThemeToggle } from '@/components/ui/navigation/ThemeToggle';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { useScrollState } from '@/hooks/useScrollState';
import { cn } from '@/lib/utils';

// ─── User Menu ────────────────────────────────────────────────────────────────

interface UserMenuProps {
  userName?: string;
  userRole?: string;
}

function UserMenu({ userName, userRole }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const initials = userName
    ? userName
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="User menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-2 rounded-lg px-2 py-1.5',
          'transition-colors duration-200',
          'hover:bg-muted'
        )}
      >
        <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
          <span className="text-xs font-bold text-primary-foreground font-quicksand">
            {initials}
          </span>
        </div>
        <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full right-0 mt-2 z-50',
            'w-52 rounded-xl border border-border bg-card',
            'shadow-lg shadow-black/10 p-1.5',
            'animate-in fade-in-0 zoom-in-95 duration-150'
          )}
        >
          {/* User info */}
          <div className="px-3 py-2 mb-1 border-b border-border">
            <p className="text-sm font-semibold font-quicksand text-foreground truncate">
              {userName ?? 'Utente'}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{userRole ?? 'user'}</p>
          </div>

          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
          >
            <User className="h-4 w-4" />
            Il mio profilo
          </Link>
          <Link
            href="/profile?tab=settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
          >
            <Settings className="h-4 w-4" />
            Impostazioni
          </Link>

          <div className="my-1 border-t border-border" />

          <div className="px-3 py-1">
            <ThemeToggle showLabel size="sm" className="w-full justify-start" />
          </div>

          <div className="my-1 border-t border-border" />

          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void logoutAction();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Esci
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Search Trigger ───────────────────────────────────────────────────────────

function SearchTrigger() {
  const { toggle } = useCommandPalette();

  return (
    <button
      onClick={toggle}
      aria-label="Apri ricerca"
      className={cn(
        'hidden md:flex items-center gap-2',
        'rounded-lg border border-border/60 bg-muted/40',
        'px-3 py-1.5 text-sm text-muted-foreground',
        'hover:bg-muted hover:border-border transition-colors duration-200',
        'min-w-[200px] max-w-[280px]'
      )}
    >
      <Search className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">Cerca...</span>
      <kbd
        className={cn(
          'ml-auto hidden lg:inline-flex',
          'h-5 items-center gap-0.5 rounded border border-border/80',
          'bg-background px-1.5 text-[10px] font-medium text-muted-foreground'
        )}
      >
        <span className="text-xs">&#x2318;</span>K
      </kbd>
    </button>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

export interface TopBarProps {
  className?: string;
}

export function TopBar({ className }: TopBarProps) {
  const { user } = useAuthUser();
  const { isScrolled: scrolled } = useScrollState({ scrolledThreshold: 4 });

  return (
    <>
      {/* Skip to main content — keyboard/screen-reader navigation (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className={cn(
          'sr-only focus:not-sr-only',
          'focus:fixed focus:top-2 focus:left-2 focus:z-[100]',
          'focus:px-4 focus:py-2 focus:rounded-lg',
          'focus:bg-background focus:text-foreground',
          'focus:border focus:border-border',
          'focus:text-sm focus:font-semibold focus:font-nunito',
          'focus:shadow-md'
        )}
      >
        Vai al contenuto principale
      </a>

      <header
        data-testid="top-bar"
        className={cn(
          'sticky top-0 z-40 w-full',
          'h-12',
          'bg-background/95 backdrop-blur-md backdrop-saturate-150',
          'border-b border-border/60',
          'transition-shadow duration-200',
          scrolled && 'shadow-sm',
          className
        )}
      >
        <div className="flex h-full items-center justify-between px-4 md:px-6 gap-2">
          {/* ── LEFT: MobileNavDrawer (mobile) + Logo (mobile) + Breadcrumb (desktop) ── */}
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            {/* Mobile-only: hamburger + logo */}
            <div className="flex items-center gap-2 md:hidden">
              <Suspense>
                <MobileNavDrawer />
              </Suspense>
              <Logo variant="auto" size="sm" />
            </div>

            {/* Desktop-only: breadcrumb trail */}
            <div className="hidden md:block min-w-0">
              <DesktopBreadcrumb />
            </div>
          </div>

          {/* ── CENTER: Command-K search trigger (desktop only) ── */}
          <SearchTrigger />

          {/* ── RIGHT: Notifications + UserMenu ── */}
          <div className="flex items-center gap-1 shrink-0">
            <NotificationBell />
            <UserMenu userName={user?.displayName ?? user?.email} userRole={user?.role} />
          </div>
        </div>
      </header>
    </>
  );
}
