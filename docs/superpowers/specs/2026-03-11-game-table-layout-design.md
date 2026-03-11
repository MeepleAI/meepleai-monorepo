# Game Table Layout — Design Specification

**Issue**: #148 — Game Table S1
**Branch**: `feature/issue-148-game-table-s1` (parent: `frontend-dev`)
**Date**: 2026-03-11
**Status**: Approved (brainstorm session completed)

## Overview

"The Game Table" is a layout redesign that reimagines MeepleAI's UX as a board game table. The metaphor: a slim sidebar is your card rack, the main content area is the table where you play, and a contextual side panel is the flipped card showing details.

This replaces the previous layout system (Epic #5033: TopNavbar + MiniNav + FloatingActionBar) with a consolidated architecture: **CardRack + TopBar + LayoutShell**.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout concept | C: "The Game Table" | Best balance: slim sidebar (64px) maximizes content, board game metaphor fits domain |
| Game selection | C: Inline picker (no persistent hand) | Zero overhead, contextual smart filters, clean layout. Like Notion inline DB |
| Collapsible panels | Independent left/right collapse | Desktop flexibility: full (both open) → focus (both collapsed to 44px strips) |
| Mobile pattern | Touch-first with bottom sheets | One-hand operation at the game table, native-feeling interactions |

## Architecture

### Layout Structure (Desktop ≥1024px)

```
┌──────────────────────────────────────────────────────────┐
│ CardRack │ TopBar (48px): breadcrumb + ⌘K + notifications │
│  (64px)  ├────────────────────────────────────────────────┤
│  slim    │ Content Area              │ Quick View (300px)  │
│  sidebar │ (flex, adaptive grid)     │ Regole/FAQ/AI tabs  │
│  hover→  │                           │ toggle open/close   │
│  240px   │                           │                     │
│          │                           │                     │
└──────────┴───────────────────────────┴─────────────────────┘
```

### Components

#### 1. CardRack (Left Sidebar)
- **Collapsed**: 64px with icon-only nav items (44x44px rounded cards)
- **Expanded**: 240px on hover with labels
- **Content**: Logo, nav items (Dashboard, Collezione, Scopri, Agenti, Chat, Game Nights, KB, Badges), spacer, Settings, User avatar
- **Badges**: Notification dots on Chat, etc.
- **Mobile (≤1024px)**: Hidden, replaced by MobileTabBar

#### 2. TopBar (Top Navigation)
- **Height**: 48px, sticky
- **Left**: Breadcrumb trail (🏠 › Section › Page)
- **Center**: Global search trigger (⌘K, 260px wide)
- **Right**: Notification bell with dot indicator
- **Live mode variant**: Green tint background, LIVE pulse dot, timer, turn indicator, Pause/Stop buttons

#### 3. Quick View (Right Side Panel)
- **Width**: 300px (desktop), 280px (compact)
- **Tabs**: Regole / FAQ / Chat (or AI in live sessions)
- **Content**: Contextual — shows rules for selected game, AI chat during sessions
- **Collapsible**: Toggle to 44px strip with icon buttons (AI/Regole/FAQ)
- **Opens on**: Click on a game card in the table area

#### 4. Inline Picker (Game Selection)
- **Trigger**: Click "+" on drop zone in Game Night planning
- **Content**: Horizontal carousel of collection games, filterable
- **Smart filter**: Auto-applies "adatti a N giocatori" based on Game Night attendees
- **No persistent hand**: Appears contextually, disappears after selection

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
- **Left (280px)**: Current game card, scoreboard (ranked, with PV breakdown), game toolkit (dice roller, card draw, random generators)
- **Center (flex)**: Activity feed timeline (vertical), tabs (Cronologia/Media/Note/Statistiche), input bar with media buttons
- **Right (280px)**: AI chat panel, quick prompts, tab switch (AI/Regole/FAQ/Stats)
- **Collapsible panels**: Left collapses to 44px (mini avatars + scores + dice button), Right collapses to 44px (AI/Regole/FAQ icons)

#### Live Session — Pause State
- Full overlay: pause icon, game state snapshot (all player scores), resume/photo/note actions, pause timer

### Mobile Layout (≤768px)

#### Navigation
- No sidebar — uses bottom tab bar or contextual navigation
- Status bar (36px) replaces TopBar: LIVE indicator, game name, turn, timer, pause button

#### Live Session Mobile
- **Status bar**: 36px — Live pulse, game, turn, timer, pause
- **Scorebar**: 52px — Horizontal scroll of player mini-cards with scores, tap to expand
- **Feed**: Full-width vertical timeline (identical event types as desktop)
- **Action bar** (bottom): Text input + Send button + quick actions row (🎲📸🎥🎙️🤖)
- **Safe area**: iOS bottom padding (20px)

#### Bottom Sheets (Mobile Interactions)
- **Dice roller**: Sheet with large dice, type selector (2d6/1d6/1d20/card), roll history
- **AI chat**: Tall sheet (420px) with chat messages, quick prompts, tab switch
- **Camera/recorder**: Native device APIs
- **Player detail**: Score breakdown sheet on tap
- **Pause**: Full-screen overlay

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

The toolkit panel (left column in live session) provides game-agnostic utilities:

- **Dice roller**: Configurable (2d6, 1d20, custom), animated result, automatic feed entry
- **Card draw**: Deck types configurable per game (from KB)
- **Random generators**: Timer, random player, random color
- All results logged to activity feed automatically

## Design Tokens

### Colors
- **Primary**: `hsl(25, 95%, 38%)` — #FF6B35 warm orange
- **Background**: `#0d1117` → `#161b22` gradient
- **Surface**: `rgba(255,255,255,0.03)` cards, `rgba(0,0,0,0.15)` panels
- **Borders**: `rgba(255,255,255,0.06)` subtle, `rgba(255,255,255,0.08)` normal
- **Player colors**: Purple (#a855f7), Blue (#3b82f6), Yellow (#eab308), Pink (#ec4899)
- **Status**: Green (#22c55e) confirmed/live, Yellow (#eab308) pending/pause, Red (#ef4444) stop/remove

### Dimensions
| Token | Value |
|-------|-------|
| CardRack collapsed | 64px |
| CardRack expanded | 240px |
| CardRack item | 44x44px, border-radius: 10px |
| TopBar height | 48px |
| Quick View width | 300px (280px compact) |
| Collapsed panel | 44px |
| Mobile status bar | 36px |
| Mobile scorebar | 52px |
| Mobile action bar | ~100px (input + actions) |
| Bottom sheet radius | 20px top corners |
| Card border-radius | 14px (large), 10px (medium), 8px (small) |

### Typography
- **Headings**: System UI, 800 weight
- **Body**: System UI, 400/600 weight
- **Labels**: 10-11px, uppercase, letter-spacing 0.5px
- **Scores**: Tabular nums, 800 weight

## Implementation Status

### Completed (S1 Phase 1)

| Component | Commit | Files |
|-----------|--------|-------|
| `breadcrumb-utils.ts` | `3f50a58a0` | `lib/breadcrumb-utils.ts`, tests |
| `CardRack` | `f69bb7dae` | `CardRack.tsx`, `CardRackItem.tsx`, `useCardRackState.ts`, tests |
| `TopBar` | `49f9cb264` | `TopBar.tsx`, tests |
| `LayoutShell` wiring | `9e948f72e` | Updated `LayoutShell.tsx`, removed old Sidebar/TopNavbar imports |

### Remaining (S1 Phase 2+)

1. **Quick View panel** — Right side contextual panel with tabs
2. **Inline game picker** — Collection carousel with smart filters
3. **Game Night list page** — Event cards grid with status states
4. **Game Night planning page** — Two-column layout with table + picker + timeline
5. **Live session layout** — 3-column with scoreboard, feed, AI panel
6. **Collapsible panels** — Independent left/right collapse to 44px strips
7. **Mobile responsive** — Tab bar, bottom sheets, touch-first interactions
8. **Activity feed** — Timeline with event types, media attachments
9. **Game toolkit** — Dice roller, card draw, random generators
10. **AI integration** — Quick View AI tab, contextual suggestions

## Testing Strategy

- **Unit**: Each component isolated (CardRack, TopBar, QuickView, etc.)
- **Integration**: LayoutShell renders correct layout based on route
- **Responsive**: Breakpoint tests (≥1920px, 1024-1919px, 768-1023px, <768px)
- **Accessibility**: WCAG 2.1 AA — keyboard nav through CardRack, focus management in bottom sheets
- **Visual**: Snapshot tests for collapsed/expanded states

## References

- Brainstorm prototypes: `.superpowers/brainstorm/785115-1773216855/`
- Layout concepts archive: `docs/frontend/layout-concepts/`
- Epic #5033 layout foundation: `memory/epic-5033-layout.md`
- Design tokens: `apps/web/src/styles/design-tokens.css`
