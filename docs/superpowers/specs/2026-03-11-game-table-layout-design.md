# Game Table Layout — Design Specification

**Issue**: #148 — Game Table S1
**Branch**: `feature/issue-148-game-table-s1` (parent: `frontend-dev`)
**Date**: 2026-03-11
**Status**: Approved (brainstorm session completed)

## Overview

"The Game Table" is a layout redesign that reimagines MeepleAI's UX as a board game table. The metaphor: a slim sidebar is your card rack, the main content area is the table where you play, and a contextual side panel is the flipped card showing details.

This extends the previous layout system (Epic #5033) by replacing TopNavbar and Sidebar with **CardRack + TopBar**, while keeping MiniNav, FloatingActionBar, SmartFAB, MobileTabBar, and MobileBreadcrumb as coexisting components that will be gradually migrated or removed.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout concept | C: "The Game Table" | Best balance: slim sidebar (64px) maximizes content, board game metaphor fits domain |
| Game selection | C: Inline picker (no persistent hand) | Zero overhead, contextual smart filters, clean layout. Like Notion inline DB |
| Collapsible panels | Independent left/right collapse | Desktop flexibility: full (both open) → focus (both collapsed to 44px strips) |
| Mobile pattern | Touch-first with bottom sheets | One-hand operation at the game table, native-feeling interactions |

## Responsive Breakpoints

Uses Tailwind breakpoints from `design-tokens.css`:

| Tier | Breakpoint | Layout |
|------|-----------|--------|
| Mobile | `<768px` (below `md`) | No CardRack, MobileTabBar + MobileNavDrawer, bottom sheets |
| Tablet | `768px–1023px` (`md`–`lg`) | CardRack visible (64px), no Quick View panel, single-column content |
| Desktop | `1024px–1279px` (`lg`–`xl`) | Full layout: CardRack + content + optional Quick View |
| Wide | `≥1280px` (`xl`+) | Full layout with both panels open by default |

## Architecture

### Layout Structure (Desktop ≥1024px)

```
┌──────────────────────────────────────────────────────────┐
│ CardRack │ TopBar (h-12/48px): breadcrumb + ⌘K + avatar  │
│  (64px)  ├────────────────────────────────────────────────┤
│  slim    │ MiniNav (context-aware, auto-hides)            │
│  sidebar ├──────────────────────┬─────────────────────────┤
│  hover→  │ Content Area         │ Quick View (300px)      │
│  240px   │ (flex, adaptive)     │ Regole/FAQ/AI tabs      │
│          │                      │ toggle open/close       │
│          │ [FloatingActionBar]  │                         │
└──────────┴──────────────────────┴─────────────────────────┘
```

### Components

#### 1. CardRack (Left Sidebar)
- **Collapsed**: `var(--card-rack-width, 64px)` with icon-only Lucide icons
- **Expanded**: `var(--card-rack-hover-width, 240px)` on hover with labels
- **Nav items** (top): Dashboard, Libreria, Scopri, Chat AI, Sessioni, Serate
- **Bottom items**: Agenti, Badge
- **Visibility**: `hidden md:flex` — hidden below 768px
- **Position**: Fixed left, below TopBar (`top: var(--top-bar-height, 48px)`)
- **Active state**: Orange highlight on current route, `startsWith()` matching

#### 2. TopBar (Top Navigation)
- **Height**: `h-12` (48px via `var(--top-bar-height)`)
- **Position**: Sticky top, z-40, blur backdrop
- **Left (mobile)**: Hamburger (MobileNavDrawer) + Logo
- **Left (desktop)**: DesktopBreadcrumb
- **Center (desktop)**: SearchTrigger — `min-w-[200px] max-w-[280px]`, triggers CommandPalette
- **Right**: NotificationBell + UserMenu (avatar, profile, settings, theme toggle, logout)
- **Scroll shadow**: `shadow-sm` appears after 4px scroll
- **Accessibility**: Skip-to-content link (WCAG 2.4.1)
- **Live mode variant** (future): Green tint, LIVE pulse, timer, turn, Pause/Stop buttons

#### 3. Quick View (Right Side Panel) — NOT YET IMPLEMENTED
- **Width**: 300px (desktop), 280px (compact)
- **Tabs**: Regole / FAQ / Chat (or AI in live sessions)
- **Content**: Contextual — shows rules for selected game, AI chat during sessions
- **Collapsible**: Toggle to 44px strip with icon buttons
- **Opens on**: Click on a game card in the table area

#### 4. Inline Picker (Game Selection) — NOT YET IMPLEMENTED
- **Trigger**: Click "+" on drop zone in Game Night planning
- **Content**: Horizontal carousel of collection games, filterable
- **Smart filter**: Auto-applies "adatti a N giocatori" based on attendees
- **No persistent hand**: Appears contextually, disappears after selection

### Legacy Components (Coexisting)

These components from Epic #5033 remain in LayoutShell and will be migrated or removed incrementally:

| Component | Status | Plan |
|-----------|--------|------|
| `MiniNav` | Active | Keep — provides context-aware tabs per route |
| `FloatingActionBar` | Active | Keep — provides floating primary actions |
| `SmartFAB` | Active | Keep — mobile context-aware FAB |
| `MobileTabBar` | Active | Keep — mobile bottom navigation |
| `MobileBreadcrumb` | Active | Keep — mobile breadcrumb below MiniNav |
| `CardStackPanel` | Active | Keep — "Carte in Mano" panel |
| `ImpersonationBanner` | Active | Keep — admin impersonation UI |
| `Sidebar` | Removed | Replaced by CardRack in commit `9e948f72e` |
| `TopNavbar` | Removed | Replaced by TopBar in commit `9e948f72e` |

### Page-Specific Layouts

#### Game Night List
- Grid of event cards (3 columns on desktop)
- States: PROSSIMA (green), BOZZA (neutral), COMPLETATA (dimmed)
- Each card shows: date, title, location, player avatars, game thumbnails, winner badge

#### Game Night Planning
- **Two-column grid**: Left (320px info + players + AI suggestion) | Right (table + picker + timeline)
- **Table area**: "Dealt cards" with slight rotation (-2°/+1°), drop zone for adding games
- **Inline picker**: Below table, horizontal scroll, filtered by player count
- **Timeline**: Horizontal bar with time slots (game → break → game → free slot)
- **AI Suggestion**: Gradient card with recommendations based on player levels

#### Live Session (3-column)
- **Left (280px)**: Current game card, scoreboard (ranked, with PV breakdown), game toolkit
- **Center (flex)**: Activity feed timeline (vertical), tabs (Cronologia/Media/Note/Statistiche), input bar
- **Right (280px)**: AI chat panel, quick prompts, tab switch (AI/Regole/FAQ/Stats)
- **Collapsible panels**: Left collapses to 44px (mini avatars + scores + dice button), Right to 44px (icons)

#### Live Session — Pause State
- Full overlay: pause icon, game state snapshot (all player scores), resume/photo/note actions

### Mobile Layout (<768px)

#### Navigation
- No CardRack — `MobileNavDrawer` via hamburger in TopBar, `MobileTabBar` at bottom
- Status bar (36px) replaces TopBar in live sessions: LIVE indicator, game name, turn, timer, pause

#### Live Session Mobile
- **Status bar**: 36px — Live pulse, game, turn, timer, pause
- **Scorebar**: 52px — Horizontal scroll of player mini-cards, tap to expand
- **Feed**: Full-width vertical timeline
- **Action bar** (bottom): Text input + Send + quick actions (🎲📸🎥🎙️🤖)
- **Safe area**: iOS bottom padding (20px)

#### Bottom Sheets
- **Dice roller**: Large dice, type selector (2d6/1d6/1d20/card), roll history
- **AI chat**: Tall sheet (420px) with messages, quick prompts, tab switch
- **Camera/recorder**: Native device APIs
- **Player detail**: Score breakdown on tap
- **Pause**: Full-screen overlay

### Tablet Layout (768px–1023px)

- CardRack visible at 64px (no auto-expand, click to expand)
- No Quick View panel — content is single-column full width
- MiniNav and FloatingActionBar visible as on desktop
- Bottom sheets for toolkit and AI (same as mobile pattern)

## Data Flow & State Management

### State Architecture (Zustand)

| Store | Purpose | Key State |
|-------|---------|-----------|
| `useCardRackState` | Sidebar hover expand/collapse | `isExpanded`, `onMouseEnter`, `onMouseLeave` |
| `useNavigation` (context) | Per-route nav config | `tabs`, `actions` via `useSetNavConfig()` |
| `useCommandPalette` | Search palette open/close | `isOpen`, `toggle()` |
| `useGameNightStore` (new) | Game Night CRUD + live state | `gameNight`, `players`, `selectedGames`, `timeline` |
| `useSessionStore` (new) | Live session state | `scores`, `currentTurn`, `events`, `isPaused`, `timer` |
| `useQuickViewStore` (new) | Right panel state | `isOpen`, `selectedGameId`, `activeTab` |

### Real-Time Data (Live Sessions)

- **Transport**: SSE (Server-Sent Events) — same pattern as existing chat (`useAgentChatStream`)
- **Events**: Score updates, dice rolls, turn changes, AI tips → activity feed
- **Pause/Resume**: REST endpoint, client-side timer management
- **Reconnection**: Auto-reconnect on SSE drop, replay missed events from server

### API Endpoints (Required)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/game-nights` | GET/POST | List/create game nights |
| `/api/v1/game-nights/{id}` | GET/PATCH/DELETE | CRUD single game night |
| `/api/v1/game-nights/{id}/players` | GET/POST/DELETE | Manage players |
| `/api/v1/game-nights/{id}/games` | GET/POST/DELETE | Manage selected games |
| `/api/v1/game-nights/{id}/sessions` | POST | Start live session |
| `/api/v1/game-nights/{id}/sessions/{sid}/events` | GET/POST/SSE | Activity feed |
| `/api/v1/game-nights/{id}/sessions/{sid}/scores` | GET/PATCH | Scoreboard |
| `/api/v1/game-nights/{id}/sessions/{sid}/pause` | POST | Pause/resume |
| `/api/v1/game-nights/{id}/ai/suggest` | POST | AI game suggestions |

### Activity Feed Event Types

| Type | Icon | Color | Content |
|------|------|-------|---------|
| Dice roll | 🎲 | Orange | Player, dice values, total, special rules triggered |
| AI tip | 🤖 | Purple | Contextual advice, rule reminders for beginners |
| Score update | 🏆 | Green | Player, action, new score |
| Photo | 📸 | Blue | Player, photo preview |
| Note | 📝 | Yellow | Player, text content |
| Audio note | 🎙️ | Pink | Player, waveform player |
| Turn change | 🔄 | Gray | Turn N → Turn N+1, player name |
| Pause/Resume | ⏸/▶ | Yellow/Green | Duration, state saved timestamp |
| Session start | ▶ | Green | Game, player count, timestamp |

### Game Toolkit

- **Dice roller**: Configurable (2d6, 1d20, custom), animated result, automatic feed entry
- **Card draw**: Deck types configurable per game (from KB)
- **Random generators**: Timer, random player, random color
- All results logged to activity feed automatically

## Design Tokens

### Colors (from `design-tokens.css`)

| Token | CSS Variable | Value |
|-------|-------------|-------|
| Brand primary | `--color-meeple-orange` | `25 85% 45%` (~#D2691E) |
| Entity game | `--color-entity-game` | `25 95% 45%` (used for game cards) |
| Brand purple | `--color-meeple-purple` | `262 83% 62%` (#8b5cf6) |
| Player colors | Tailwind utilities | purple-500, blue-500, yellow-500, pink-500 |
| Status green | Tailwind `green-500` | #22c55e (confirmed/live) |
| Status yellow | Tailwind `yellow-500` | #eab308 (pending/pause) |
| Status red | Tailwind `red-500` | #ef4444 (stop/remove) |

**Dark theme surfaces** (brainstorm prototypes used raw values — future implementation should define these as CSS custom properties):
- Background: `#0d1117` → `#161b22` gradient
- Surface: `rgba(255,255,255,0.03)` cards
- Panel bg: `rgba(0,0,0,0.15)`
- Borders: `rgba(255,255,255,0.06)` subtle, `rgba(255,255,255,0.08)` normal

### Dimensions

| Token | CSS Variable | Value |
|-------|-------------|-------|
| CardRack collapsed | `--card-rack-width` | 64px |
| CardRack expanded | `--card-rack-hover-width` | 240px |
| TopBar height | `--top-bar-height` | 48px (h-12) |
| Quick View width | (new token needed) | 300px / 280px compact |
| Collapsed panel | (new token needed) | 44px |
| Mobile status bar | — | 36px |
| Mobile scorebar | — | 52px |
| Bottom sheet radius | — | 20px top corners |
| Card border-radius | — | 14px (large), 10px (medium), 8px (small) |

### Typography (from `design-tokens.css`)

| Role | Font | Weight | CSS Variable |
|------|------|--------|-------------|
| Headings | Quicksand | 700-800 | `--font-heading: var(--font-quicksand)` |
| Body/Nav | Nunito | 400-600 | `--font-body: var(--font-nunito)` |
| Labels | Nunito | 600-700 | 10-11px, uppercase, letter-spacing 0.5px |
| Scores | System (tabular-nums) | 800 | `font-variant-numeric: tabular-nums` |

## Error & Loading States

| Component | Loading | Error | Empty |
|-----------|---------|-------|-------|
| Game Night list | Skeleton grid (3 cards) | Error card with retry | "Nessuna serata pianificata" + CTA |
| Planning: Players | Skeleton list | Inline error toast | "Invita giocatori" prompt |
| Planning: Table | Skeleton cards | Error toast | Empty drop zone with prompt |
| Live: Scoreboard | Pulsing placeholders | "Impossibile caricare" + retry | N/A (always has players) |
| Live: Feed | Skeleton events | "Connessione persa" banner + auto-retry | "Sessione appena iniziata" |
| Live: AI panel | Typing indicator | "AI non disponibile" fallback to rules tab | Quick prompt suggestions |
| Quick View | Skeleton content | "Regole non disponibili" | "Seleziona un gioco" |
| Offline (live) | — | Persistent banner "Offline — riconnessione..." | Queue events locally, sync on reconnect |

## Implementation Status

### Completed (S1 Phase 1)

| Component | Commit | Files |
|-----------|--------|-------|
| `breadcrumb-utils.ts` | `3f50a58a0` | `lib/breadcrumb-utils.ts`, tests |
| `CardRack` | `f69bb7dae` | `CardRack.tsx`, `CardRackItem.tsx`, `useCardRackState.ts`, tests |
| `TopBar` | `49f9cb264` | `TopBar.tsx` (UserMenu, SearchTrigger, skip-link), tests |
| `LayoutShell` wiring | `9e948f72e` | Updated `LayoutShell.tsx`, replaced Sidebar/TopNavbar with CardRack/TopBar |

### Remaining (S1 Phase 2+)

| # | Item | Dependencies | Acceptance Criteria |
|---|------|-------------|-------------------|
| 1 | **Quick View panel** | None (standalone component) | 300px right panel, 3 tabs (Regole/FAQ/AI), collapse to 44px, `useQuickViewStore` |
| 2 | **Inline game picker** | Game Night planning page | Horizontal carousel from user collection, auto-filter by player count, click → add to table |
| 3 | **Game Night list page** | Backend: `GET /game-nights` | Grid layout, 3 status states, player avatars, game thumbnails |
| 4 | **Game Night planning page** | #2, #3, Quick View (#1) | Two-column grid, dealt cards with rotation, timeline, AI suggestion card |
| 5 | **Live session layout** | #1, #8 (activity feed), #9 (toolkit) | 3-column layout, collapsible panels, live status bar |
| 6 | **Collapsible panels** | #1, #5 | Independent L/R collapse to 44px strips, persist preference |
| 7 | **Mobile responsive** | #5 | Status bar, scorebar, bottom sheets (dice, AI), safe area padding |
| 8 | **Activity feed** | Backend: SSE endpoint | 9 event types, vertical timeline, media attachments, input bar |
| 9 | **Game toolkit** | #8 (auto-logs to feed) | Dice roller (2d6/1d20/custom), card draw, random generators |
| 10 | **AI integration** | Backend: AI suggest endpoint, existing agent chat | Quick View AI tab, contextual suggestions, quick prompts |

**Dependency graph**: 3 → 4 → 5 → 7 (main chain); 1 → 4,5,6; 8 → 5,9; 9 → 5

## Testing Strategy

- **Unit**: Each component isolated (CardRack, TopBar, QuickView, ActivityFeed, etc.)
- **Integration**: LayoutShell renders correct layout based on route and breakpoint
- **Responsive**: Tests at 4 breakpoints (≥1280px, 1024-1279px, 768-1023px, <768px)
- **Accessibility**: WCAG 2.1 AA — keyboard nav through CardRack, focus management in bottom sheets, skip-link
- **Visual**: Snapshot tests for collapsed/expanded states
- **E2E**: Game Night creation → planning → live session flow (Playwright)

## References

- Brainstorm prototypes: `.superpowers/brainstorm/785115-1773216855/`
- Layout concepts archive: `docs/frontend/layout-concepts/`
- Epic #5033 layout foundation: `memory/epic-5033-layout.md`
- Design tokens: `apps/web/src/styles/design-tokens.css`
- CardRack implementation: `apps/web/src/components/layout/CardRack/`
- TopBar implementation: `apps/web/src/components/layout/TopBar/`
- LayoutShell: `apps/web/src/components/layout/LayoutShell/LayoutShell.tsx`
