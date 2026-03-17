# Dashboard Search → Add Game → Chat Flow

**Date**: 2026-03-17
**Status**: Approved
**Approach**: Hybrid — extend existing components + new isolated components

## Scenario

A new user logs in. Friends visit and ask about a board game. The game exists in the shared game library and has KB cards. The user needs to find the game, add it to their library, and chat with the AI about it — all with minimal friction, without leaving the dashboard.

## User Flow

1. New user logs in → sees dashboard with enhanced empty state
2. HeroZone shows: "Hai una domanda su un gioco? Cerca nella community e chiedi all'AI!" + CTA button
3. User clicks "Cerca un gioco" (or 🔍 in SmartFAB) → SearchExpander opens
4. Types game name → debounced search against shared game library → results with dual actions
5. Clicks "Chiedi" on a game not in library → AddToLibraryModal opens
6. Clicks "Aggiungi e Chiedi" → game added to library + chat thread created
7. Modal closes → chat card appears in dashboard "Active Chats" → ExtraMeepleCardDrawer opens
8. EmbeddedChatView in drawer with agent greeting + KB context → user asks question

## Architecture

### Approach: Hybrid

- **Extend**: SmartFAB (add SearchExpander child), ExtraMeepleCardDrawer (modify existing `chatSession` branch to use EmbeddedChatView)
- **Create new**: SearchExpander, EmbeddedChatView, AddToLibraryModal
- **Modify**: HeroZone (enhanced empty state for new users)

> **Note on HeroZone**: Two versions exist — `components/dashboard/zones/HeroZone.tsx` and `components/dashboard-v2/hero-zone.tsx`. Verify which is active in GamingHubClient before modifying. If v2 is active, modify v2.

## Component Design

### 1. SearchExpander

**Location**: `apps/web/src/components/dashboard/SearchExpander.tsx`
**Parent**: SmartFAB (`apps/web/src/components/layout/SmartFAB/SmartFAB.tsx`) — child component

**Behavior**:
- Triggered by clicking 🔍 icon in SmartFAB or CTA button in HeroZone
- Expands from pill into a search bar with glassmorphism styling
- Debounced search (300ms) against `GET /api/v1/shared-games?search={query}` (returns `PagedResult<SharedGameDto>`, use first page with `pageSize=5`)
- Results dropdown: max 5 results from first page, ordered by relevance

**Each result shows**:
- Game thumbnail + name
- "Shared Library" label + KB card count (requires supplementary query: `GET /api/v1/knowledge-base/games/{gameId}/documents/count` or include count in `SharedGameDto` — verify at implementation time; if not available, omit KB count from search results and show only in AddToLibraryModal after fetching)
- "✓ In libreria" badge if game is already in user's library
- Dual action buttons:
  - **"Vedi"** (blue): navigates to `/shared-games/{id}`
  - **"Chiedi"** (purple if not in library, green if in library): triggers add flow or direct chat

**Interaction**:
- Close: ESC key or click outside
- Keyboard navigation: ↑↓ arrows + Enter
- Focus management: auto-focus input on open

**Props**:
```typescript
interface SearchExpanderProps {
  isOpen: boolean;
  onClose: () => void;
  onViewGame: (gameId: string) => void;
  onAskAboutGame: (game: SharedGameSearchResult) => void;
}
```

### 2. AddToLibraryModal

**Location**: `apps/web/src/components/dashboard/AddToLibraryModal.tsx`

**Trigger**: User clicks "Chiedi" on a game not in their library.

**Content**:
- Game preview: thumbnail, name, publisher, player count
- KB card count: "📄 3 KB cards disponibili"
- Message: "Per chattare con l'AI su questo gioco, aggiungilo alla tua libreria."
- Actions: "Annulla" (secondary) + "Aggiungi e Chiedi 🤖" (primary, gradient purple)

**Orchestration on "Aggiungi e Chiedi"**:
1. `POST /api/v1/user-library/games` — add shared game to user library
2. `POST /api/v1/chat-threads` — create thread with `gameId` + default agent
3. Close modal → invalidate dashboard queries (both `hooks/useDashboardData.ts` and `hooks/queries/useDashboardData.ts` — verify which is active in GamingHubClient)
4. Callback `onSuccess({ gameId, threadId, agentId })` → parent opens drawer

**Error handling**:
- If step 1 fails: show error in modal, no side effects
- If step 2 fails: game stays in library (no rollback), show error with "Riprova" option
- Loading state: skeleton + disabled button during operations

**Props**:
```typescript
interface AddToLibraryModalProps {
  game: SharedGameSearchResult;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: { gameId: string; threadId: string; agentId: string }) => void;
}
```

### 3. EmbeddedChatView

**Location**: `apps/web/src/components/chat-unified/EmbeddedChatView.tsx`

**Purpose**: Compact version of ChatThreadView for use inside drawers. Messages + input only, no side info panel.

**Reuses**:
- `useAgentChatStream` hook for SSE streaming
- Existing message rendering components (user/assistant messages, citations)
- Existing input component (text input + send button)

**Excludes** (compared to full ChatThreadView):
- Right info panel (ChatInfoPanel)
- Debug panel
- Voice input/output (TTS)
- Thread header with agent selector

**Props**:
```typescript
interface EmbeddedChatViewProps {
  threadId: string;
  agentId: string;
  gameId: string;
}
```

**Behavior**:
- On mount: loads thread history (if any) + connects SSE
- Agent sends welcome message with KB context on first interaction
- Citations rendered inline in assistant messages
- Scroll-to-bottom on new messages

### 4. ExtraMeepleCardDrawer Modification

**Location**: Existing `apps/web/src/components/ui/data-display/extra-meeple-card/`

**Change**: The `chatSession` entity type already exists in the drawer (line ~238), currently rendering `ChatDrawerContent` → `ChatExtraMeepleCard` (a detail/info card using `useChatDetail(entityId)`). Modify this existing branch to render `EmbeddedChatView` instead when opened from the dashboard search flow. Use a variant prop or a `mode` discriminator to distinguish between "detail view" (existing) and "live chat" (new).

**When type is `chatSession` and mode is `liveChat`**:
- Header: chat icon + "Chat — {Game Name}" + KB source count + close button
- Body: renders `EmbeddedChatView` with `threadId`, `agentId`, `gameId`
- Width: same as existing drawer (matches current Sheet component)

**Data passed via drawer**:
```typescript
interface ChatSessionDrawerData {
  threadId: string;
  agentId: string;
  gameId: string;
  gameName: string;
  kbCardCount: number;
}
```

### 5. HeroZone Enhanced Empty State

**Location**: Existing `apps/web/src/components/dashboard/zones/HeroZone.tsx`

**Change**: Modify the `isNewUser` branch (when `libraryCount === 0`).

**Current**: "Aggiungi il tuo primo gioco alla libreria" + feature icons
**New**:
- Greeting: "Buonasera, {name}!"
- Message: "Hai una domanda su un gioco da tavolo? Cerca nella community e chiedi all'AI!"
- CTA button: "🔍 Cerca un gioco" — triggers SearchExpander open
- Subtle pointer: "oppure usa la barra in basso" + ↓ arrow

**Transition**: When `libraryCount > 0` after adding first game, HeroZone switches to standard version with stats. Happens automatically via `useDashboardData` query invalidation.

**Props addition**:
```typescript
// Add to HeroZone props
onOpenSearch: () => void;  // Triggers SearchExpander in SmartFAB
```

### 6. SmartFAB Extension

**Location**: Existing `apps/web/src/components/layout/SmartFAB/SmartFAB.tsx`

**Change**: Add 🔍 search icon to the pill with highlighted styling (gradient blue-purple, subtle glow).

**State management**:
- New state: `isSearchOpen` — controls SearchExpander visibility
- Exposed via callback: `onOpenSearch` passed up to dashboard for HeroZone to trigger
- When search is open: pill icons dim, SearchExpander renders above the pill

**Cross-component communication**: HeroZone and SmartFAB are separate component trees. Use a shared context (`DashboardSearchContext`) or a Zustand slice to coordinate `openSearch()` trigger from HeroZone to SmartFAB without prop drilling through the layout hierarchy.

## Data Flow

```
HeroZone CTA click ──┐
                      ├──→ SmartFAB.openSearch() (via DashboardSearchContext)
🔍 icon click ────────┘          │
                                 ▼
                         SearchExpander opens
                                 │
                    debounced GET /shared-games?search={q}
                                 │
                      ┌──────────┴──────────┐
                      ▼                      ▼
               "Vedi" click            "Chiedi" click
                      │                      │
               navigate to            ┌──────┴──────┐
             /shared-games/{id}       ▼              ▼
                                 In library?    Not in library?
                                      │              │
                                      │     AddToLibraryModal
                                      │              │
                                      │    POST /user-library/games
                                      │    POST /chat-threads
                                      │              │
                                      └──────┬───────┘
                                             ▼
                                  invalidate dashboard queries
                                  chat card in "Active Chats"
                                  open ExtraMeepleCardDrawer
                                             │
                                             ▼
                                    EmbeddedChatView
                                    SSE streaming + KB RAG
```

## API Dependencies

All endpoints already exist:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/shared-games?search={query}` | GET | Search shared game catalog (returns `PagedResult<SharedGameDto>`) |
| `/api/v1/user-library/games` | POST | Add game to user library |
| `/api/v1/chat-threads` | POST | Create new chat thread |
| `/api/v1/agents/{id}/chat` | POST | SSE streaming chat |
| `/api/v1/dashboard` | GET | Dashboard data (invalidate after add) |

**Note**: KB card count may not be included in `SharedGameDto`. At implementation time, verify the DTO shape. If not available, either add a count field to the DTO or fetch KB document count separately. The `POST /api/v1/user-library/games` endpoint accepts an `AddGameToLibraryRequest` body — verify required fields at implementation time.

**No new backend endpoints required** (KB count may need a supplementary query or DTO extension — evaluate during implementation).

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `components/dashboard/SearchExpander.tsx` | New | Search widget for SmartFAB |
| `components/dashboard/AddToLibraryModal.tsx` | New | Confirmation modal for add + chat |
| `components/chat-unified/EmbeddedChatView.tsx` | New | Compact chat view for drawer |

## Files to Modify

| File | Change |
|------|--------|
| `SmartFAB.tsx` | Add 🔍 icon + `isSearchOpen` state + SearchExpander mount |
| `ExtraMeepleCardDrawer` | Modify existing `chatSession` branch: add `liveChat` mode rendering EmbeddedChatView |
| `HeroZone.tsx` | Enhanced empty state with CTA + `onOpenSearch` prop |
| `DashboardRenderer.tsx` / `GamingHubClient` | Add `DashboardSearchContext` provider for HeroZone ↔ SmartFAB communication |

## Testing Strategy

### Unit Tests
- SearchExpander: search debounce, result rendering, dual action callbacks, keyboard nav
- AddToLibraryModal: success flow, error states, loading state, rollback behavior
- EmbeddedChatView: message rendering, SSE connection, scroll behavior
- HeroZone: empty state rendering, CTA click callback

### Integration Tests
- Full flow: search → click "Chiedi" → modal → add → drawer opens → chat works
- Edge cases: game already in library (skip modal), search with no results, network errors

### E2E Tests (Playwright)
- New user login → dashboard → search game → add → chat → receive AI response
- Verify drawer opens/closes correctly
- Verify dashboard updates (chat card appears, stats update)

## Scope Boundaries

**In scope**:
- SearchExpander in SmartFAB
- AddToLibraryModal with add + create thread orchestration
- EmbeddedChatView in ExtraMeepleCardDrawer
- HeroZone enhanced empty state
- Dashboard query invalidation after add

**Out of scope**:
- Changes to shared game page (`/shared-games/{id}`)
- Changes to full chat page (`/chat/[threadId]`)
- New backend endpoints
- Onboarding tooltips or guided tours
- "Recent Games" / "Active Chats" section redesign
