# Dashboard Search → Add Game → Chat Flow — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable new users to search for shared library games from the dashboard, add them to their library, and chat with AI about them via a drawer — all without leaving the dashboard.

**Architecture:** Zustand store (`useDashboardSearchStore`) coordinates search state between SmartFAB and HeroZone (both are prop-less, hook-driven components). Three new components (SearchExpander, AddToLibraryModal, EmbeddedChatView) plus modifications to SmartFAB, HeroZone, ExtraMeepleCardDrawer, and DashboardRenderer.

**Tech Stack:** Next.js 16, React 19, Zustand, React Query, Tailwind 4, shadcn/ui, Vitest, @testing-library/react

**Spec:** `docs/superpowers/specs/2026-03-17-dashboard-search-chat-flow-design.md`

---

## File Map

### New Files

| File | Responsibility |
|------|----------------|
| `apps/web/src/stores/useDashboardSearchStore.ts` | Zustand store: `isSearchOpen`, `openSearch()`, `closeSearch()`, `selectedGame`, `drawerState` |
| `apps/web/src/components/dashboard/SearchExpander.tsx` | Search bar + results dropdown, mounted inside SmartFAB |
| `apps/web/src/components/dashboard/AddToLibraryModal.tsx` | Confirmation modal: add game + create chat thread |
| `apps/web/src/components/chat-unified/EmbeddedChatView.tsx` | Compact ChatThreadView: messages + input only |
| `apps/web/src/__tests__/stores/useDashboardSearchStore.test.ts` | Store unit tests |
| `apps/web/src/__tests__/components/dashboard/SearchExpander.test.tsx` | SearchExpander unit tests |
| `apps/web/src/__tests__/components/dashboard/AddToLibraryModal.test.tsx` | AddToLibraryModal unit tests |
| `apps/web/src/__tests__/components/chat-unified/EmbeddedChatView.test.tsx` | EmbeddedChatView unit tests |

### Modified Files

| File | Change |
|------|--------|
| `apps/web/src/components/layout/SmartFAB/SmartFAB.tsx` | Add 🔍 icon + mount SearchExpander when `isSearchOpen` |
| `apps/web/src/components/dashboard/zones/HeroZone.tsx` | Enhanced empty state with CTA triggering `openSearch()` |
| `apps/web/src/components/ui/data-display/extra-meeple-card/ExtraMeepleCardDrawer.tsx` | Add `liveChat` mode to `chatSession` branch |
| `apps/web/src/components/dashboard/DashboardRenderer.tsx` | Mount ExtraMeepleCardDrawer for live chat drawer |

---

## Chunk 0: Setup + Pre-Implementation Verification

### Task 0: Create Feature Branch + Verify Assumptions

- [ ] **Step 1: Create feature branch**

```bash
git checkout main-dev && git pull
git checkout -b feature/dashboard-search-chat-flow
git config branch.feature/dashboard-search-chat-flow.parent main-dev
```

- [ ] **Step 2: Verify which HeroZone is active**

Run: `cd apps/web && grep -r "HeroZone\|hero-zone" src/components/dashboard/DashboardRenderer.tsx`

Determine whether `DashboardRenderer` imports from `./zones/HeroZone` or `../dashboard-v2/hero-zone`. If v2 is active, all HeroZone modifications in this plan apply to `components/dashboard-v2/hero-zone.tsx` instead of `components/dashboard/zones/HeroZone.tsx`.

- [ ] **Step 3: Verify ChatThreadDto includes agentId**

Run: `cd apps/web && grep -r "agentId" src/lib/api/clients/chatClient.ts`

Confirm `ChatThreadDto` response contains `agentId`. If not, the `createThread` response will need `agentId` fetched separately (e.g., from agent defaults for the game). Document what you find.

- [ ] **Step 4: Check existing library hooks**

Run: `cd apps/web && grep -rl "useLibrary\|useUserLibrary" src/hooks/`

Identify if a hook exists that returns user library game IDs. The actual file is likely `src/hooks/queries/useLibrary.ts` (NOT `useUserLibrary`). Note the exact export names for Task 2.

- [ ] **Step 5: Commit branch marker**

```bash
git commit --allow-empty -m "chore: start dashboard-search-chat-flow feature branch"
```

---

## Chunk 1: Foundation — Zustand Store + SearchExpander

### Task 1: Dashboard Search Store

**Files:**
- Create: `apps/web/src/stores/useDashboardSearchStore.ts`
- Test: `apps/web/src/__tests__/stores/useDashboardSearchStore.test.ts`

- [ ] **Step 1: Write the store test**

```typescript
// apps/web/src/__tests__/stores/useDashboardSearchStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardSearchStore } from '@/stores/useDashboardSearchStore';

describe('useDashboardSearchStore', () => {
  beforeEach(() => {
    useDashboardSearchStore.getState().reset();
  });

  it('starts with search closed', () => {
    const state = useDashboardSearchStore.getState();
    expect(state.isSearchOpen).toBe(false);
    expect(state.selectedGame).toBeNull();
    expect(state.drawerState).toBeNull();
  });

  it('opens and closes search', () => {
    const { openSearch, closeSearch } = useDashboardSearchStore.getState();
    openSearch();
    expect(useDashboardSearchStore.getState().isSearchOpen).toBe(true);
    closeSearch();
    expect(useDashboardSearchStore.getState().isSearchOpen).toBe(false);
  });

  it('sets selected game for modal', () => {
    const game = { id: 'g1', name: 'Catan', imageUrl: null, playerCount: '3-4' };
    useDashboardSearchStore.getState().setSelectedGame(game);
    expect(useDashboardSearchStore.getState().selectedGame).toEqual(game);
  });

  it('sets drawer state for live chat', () => {
    const drawer = { threadId: 't1', agentId: 'a1', gameId: 'g1', gameName: 'Catan' };
    useDashboardSearchStore.getState().openChatDrawer(drawer);
    expect(useDashboardSearchStore.getState().drawerState).toEqual(drawer);
  });

  it('clears drawer state on close', () => {
    const drawer = { threadId: 't1', agentId: 'a1', gameId: 'g1', gameName: 'Catan' };
    useDashboardSearchStore.getState().openChatDrawer(drawer);
    useDashboardSearchStore.getState().closeChatDrawer();
    expect(useDashboardSearchStore.getState().drawerState).toBeNull();
  });

  it('reset clears everything', () => {
    useDashboardSearchStore.getState().openSearch();
    useDashboardSearchStore.getState().setSelectedGame({ id: 'g1', name: 'X', imageUrl: null, playerCount: '2' });
    useDashboardSearchStore.getState().reset();
    const state = useDashboardSearchStore.getState();
    expect(state.isSearchOpen).toBe(false);
    expect(state.selectedGame).toBeNull();
    expect(state.drawerState).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run src/__tests__/stores/useDashboardSearchStore.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the store**

```typescript
// apps/web/src/stores/useDashboardSearchStore.ts
import { create } from 'zustand';

export interface SearchGameResult {
  id: string;
  name: string;
  imageUrl: string | null;
  playerCount: string;
}

export interface ChatDrawerState {
  threadId: string;
  agentId: string;
  gameId: string;
  gameName: string;
  kbCardCount?: number;
}

interface DashboardSearchState {
  isSearchOpen: boolean;
  selectedGame: SearchGameResult | null;
  drawerState: ChatDrawerState | null;
  openSearch: () => void;
  closeSearch: () => void;
  setSelectedGame: (game: SearchGameResult | null) => void;
  openChatDrawer: (state: ChatDrawerState) => void;
  closeChatDrawer: () => void;
  reset: () => void;
}

export const useDashboardSearchStore = create<DashboardSearchState>((set) => ({
  isSearchOpen: false,
  selectedGame: null,
  drawerState: null,
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false, selectedGame: null }),
  setSelectedGame: (game) => set({ selectedGame: game }),
  openChatDrawer: (state) => set({ drawerState: state, isSearchOpen: false, selectedGame: null }),
  closeChatDrawer: () => set({ drawerState: null }),
  reset: () => set({ isSearchOpen: false, selectedGame: null, drawerState: null }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run src/__tests__/stores/useDashboardSearchStore.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/stores/useDashboardSearchStore.ts apps/web/src/__tests__/stores/useDashboardSearchStore.test.ts
git commit -m "feat(dashboard): add search store for cross-component coordination"
```

---

### Task 2: SearchExpander Component

**Files:**
- Create: `apps/web/src/components/dashboard/SearchExpander.tsx`
- Test: `apps/web/src/__tests__/components/dashboard/SearchExpander.test.tsx`
- Reference: `apps/web/src/lib/api/clients/sharedGamesClient.ts` (search method uses `searchTerm` param)

- [ ] **Step 1: Write the test**

```tsx
// apps/web/src/__tests__/components/dashboard/SearchExpander.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SearchExpander } from '@/components/dashboard/SearchExpander';

// Mock the shared games client
const mockSearch = vi.fn();
vi.mock('@/lib/api/clients/sharedGamesClient', () => ({
  createSharedGamesClient: () => ({ search: mockSearch }),
}));

// Mock the user library hook (to check "in library" status)
// NOTE: The mock path below is a placeholder. In Task 0 Step 4 you identified the actual
// hook file and export name. Update this mock to match. If no hook exists, you must create
// a `useUserLibraryGameIds` hook in `src/hooks/queries/useLibrary.ts` that returns a
// Set<string> of game IDs from the user's library (wrap existing library client).
const mockLibraryGames = new Set<string>();
vi.mock('@/hooks/queries/useLibrary', () => ({
  useUserLibraryGameIds: () => ({ data: mockLibraryGames }),
}));

// Mock router
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('SearchExpander', () => {
  const mockOnViewGame = vi.fn();
  const mockOnAskAboutGame = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch.mockResolvedValue({
      items: [
        { id: 'g1', name: 'Catan', thumbnailUrl: '/catan.jpg', minPlayers: 3, maxPlayers: 4 },
        { id: 'g2', name: 'Catan: Seafarers', thumbnailUrl: '/seafarers.jpg', minPlayers: 3, maxPlayers: 4 },
      ],
      total: 2,
      page: 1,
      pageSize: 5,
    });
  });

  it('renders search input when open', () => {
    render(
      <SearchExpander
        isOpen={true}
        onClose={mockOnClose}
        onViewGame={mockOnViewGame}
        onAskAboutGame={mockOnAskAboutGame}
      />
    );
    expect(screen.getByPlaceholderText(/cerca un gioco/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <SearchExpander
        isOpen={false}
        onClose={mockOnClose}
        onViewGame={mockOnViewGame}
        onAskAboutGame={mockOnAskAboutGame}
      />
    );
    expect(screen.queryByPlaceholderText(/cerca un gioco/i)).not.toBeInTheDocument();
  });

  it('searches after debounce and shows results', async () => {
    render(
      <SearchExpander
        isOpen={true}
        onClose={mockOnClose}
        onViewGame={mockOnViewGame}
        onAskAboutGame={mockOnAskAboutGame}
      />
    );

    const input = screen.getByPlaceholderText(/cerca un gioco/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Catan' } });
    });

    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({ searchTerm: 'Catan', pageSize: 5 })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Catan')).toBeInTheDocument();
      expect(screen.getByText('Catan: Seafarers')).toBeInTheDocument();
    });
  });

  it('calls onViewGame when "Vedi" is clicked', async () => {
    render(
      <SearchExpander
        isOpen={true}
        onClose={mockOnClose}
        onViewGame={mockOnViewGame}
        onAskAboutGame={mockOnAskAboutGame}
      />
    );

    const input = screen.getByPlaceholderText(/cerca un gioco/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Catan' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Catan')).toBeInTheDocument();
    });

    const vediButtons = screen.getAllByText(/vedi/i);
    fireEvent.click(vediButtons[0]);
    expect(mockOnViewGame).toHaveBeenCalledWith('g1');
  });

  it('calls onAskAboutGame when "Chiedi" is clicked', async () => {
    render(
      <SearchExpander
        isOpen={true}
        onClose={mockOnClose}
        onViewGame={mockOnViewGame}
        onAskAboutGame={mockOnAskAboutGame}
      />
    );

    const input = screen.getByPlaceholderText(/cerca un gioco/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Catan' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Catan')).toBeInTheDocument();
    });

    const chiediButtons = screen.getAllByText(/chiedi/i);
    fireEvent.click(chiediButtons[0]);
    expect(mockOnAskAboutGame).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'g1', name: 'Catan' })
    );
  });

  it('closes on ESC key', () => {
    render(
      <SearchExpander
        isOpen={true}
        onClose={mockOnClose}
        onViewGame={mockOnViewGame}
        onAskAboutGame={mockOnAskAboutGame}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run src/__tests__/components/dashboard/SearchExpander.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement SearchExpander**

Create `apps/web/src/components/dashboard/SearchExpander.tsx`:

Key implementation details:
- Import `createSharedGamesClient` from `@/lib/api/clients/sharedGamesClient`
- Use `useCallback` with 300ms debounce via `setTimeout`/`clearTimeout`
- Render: input with glassmorphism (`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl`)
- Results: list of items with game thumbnail, name, player count, dual action buttons
- Check `useUserLibraryGameIds()` to determine if game is in library (show ✓ badge, green "Chiedi" button)
- "Vedi" button calls `onViewGame(game.id)`
- "Chiedi" button calls `onAskAboutGame(game)` with full game object
- ESC listener via `useEffect` with `keydown` event
- Auto-focus input on mount via `useRef` + `useEffect`
- `data-testid="search-expander"` on wrapper

**Note:** If `useUserLibraryGameIds` hook doesn't exist, create a simple wrapper around the library client that returns a `Set<string>` of game IDs in the user's library. Check `apps/web/src/hooks/queries/` for existing library hooks first.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run src/__tests__/components/dashboard/SearchExpander.test.tsx`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/dashboard/SearchExpander.tsx apps/web/src/__tests__/components/dashboard/SearchExpander.test.tsx
git commit -m "feat(dashboard): add SearchExpander component with debounced search and dual actions"
```

---

### Task 3: SmartFAB Extension — Add Search Icon

**Files:**
- Modify: `apps/web/src/components/layout/SmartFAB/SmartFAB.tsx`
- Reference: `apps/web/src/stores/useDashboardSearchStore.ts`
- Reference: `apps/web/src/components/dashboard/SearchExpander.tsx`

- [ ] **Step 1: Read SmartFAB current implementation**

Run: `cd apps/web && cat src/components/layout/SmartFAB/SmartFAB.tsx`

Understand:
- How `resolveSmartFab(pathname)` works (from `@/config/smart-fab`)
- Where the primary button and QuickMenu render
- The fixed positioning wrapper (lines 285-331)

- [ ] **Step 2: Add search icon and SearchExpander mount**

In `SmartFAB.tsx`, add:

```typescript
import { useDashboardSearchStore } from '@/stores/useDashboardSearchStore';
import { SearchExpander } from '@/components/dashboard/SearchExpander';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
```

Inside the component body, add:
```typescript
const { isSearchOpen, openSearch, closeSearch, setSelectedGame } = useDashboardSearchStore();
const router = useRouter();

const handleViewGame = useCallback((gameId: string) => {
  closeSearch();
  router.push(`/shared-games/${gameId}`);
}, [closeSearch, router]);

// "Already in library" flow: skip modal, go directly to creating thread + opening drawer.
// "Not in library" flow: open AddToLibraryModal via setSelectedGame.
const handleAskAboutGame = useCallback(async (game: SearchGameResult & { isInLibrary?: boolean }) => {
  closeSearch();
  if (game.isInLibrary) {
    // Skip modal — create thread directly and open drawer
    try {
      const chatClient = createChatClient({ httpClient });
      const thread = await chatClient.createThread({ gameId: game.id, title: game.name });
      openChatDrawer({ threadId: thread.id, agentId: thread.agentId, gameId: game.id, gameName: game.name });
    } catch {
      // Fallback: open modal anyway so user can retry
      setSelectedGame(game);
    }
  } else {
    setSelectedGame(game);
  }
}, [closeSearch, setSelectedGame, openChatDrawer]);
```

In the JSX, add a search button BEFORE the primary action button (inside the fixed wrapper). When on the dashboard pathname (`/dashboard`), render:
```tsx
{pathname === '/dashboard' && (
  <>
    <button
      onClick={openSearch}
      className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20"
      data-testid="smart-fab-search"
      aria-label="Cerca un gioco"
    >
      <Search className="w-5 h-5 text-white" />
    </button>
    <SearchExpander
      isOpen={isSearchOpen}
      onClose={closeSearch}
      onViewGame={handleViewGame}
      onAskAboutGame={handleAskAboutGame}
    />
  </>
)}
```

Position the SearchExpander above the FAB using absolute positioning (the SearchExpander itself handles its own overlay positioning).

- [ ] **Step 3: Run existing SmartFAB tests**

Run: `cd apps/web && pnpm vitest run --reporter=verbose 2>&1 | grep -i "smartfab\|SmartFAB"`

Fix any test failures caused by the new search button rendering.

- [ ] **Step 4: Verify manually**

Run: `cd apps/web && pnpm dev`
Navigate to dashboard. Verify:
- 🔍 button visible in SmartFAB area
- Click opens SearchExpander
- ESC closes it
- Search returns results from shared library

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/layout/SmartFAB/SmartFAB.tsx
git commit -m "feat(dashboard): add search icon to SmartFAB with SearchExpander integration"
```

---

## Chunk 2: AddToLibraryModal + HeroZone

### Task 4: AddToLibraryModal Component

**Files:**
- Create: `apps/web/src/components/dashboard/AddToLibraryModal.tsx`
- Test: `apps/web/src/__tests__/components/dashboard/AddToLibraryModal.test.tsx`
- Reference: `apps/web/src/lib/api/clients/libraryClient.ts` — `addGame(gameId)` method
- Reference: `apps/web/src/lib/api/clients/chatClient.ts` — `createThread({ gameId, agentId })` method

- [ ] **Step 1: Write the test**

```tsx
// apps/web/src/__tests__/components/dashboard/AddToLibraryModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddToLibraryModal } from '@/components/dashboard/AddToLibraryModal';

const mockAddGame = vi.fn();
const mockCreateThread = vi.fn();

vi.mock('@/lib/api/clients/libraryClient', () => ({
  createLibraryClient: () => ({ addGame: mockAddGame }),
}));

vi.mock('@/lib/api/clients/chatClient', () => ({
  createChatClient: () => ({ createThread: mockCreateThread }),
}));

describe('AddToLibraryModal', () => {
  const game = { id: 'g1', name: 'Catan', imageUrl: '/catan.jpg', playerCount: '3-4' };
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddGame.mockResolvedValue({ id: 'lib1', gameId: 'g1' });
    mockCreateThread.mockResolvedValue({ id: 't1', agentId: 'a1', gameId: 'g1' });
  });

  it('renders game info and CTA', () => {
    render(
      <AddToLibraryModal game={game} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );
    expect(screen.getByText('Catan')).toBeInTheDocument();
    expect(screen.getByText(/aggiungi e chiedi/i)).toBeInTheDocument();
    expect(screen.getByText(/per chattare con l'ai/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <AddToLibraryModal game={game} isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );
    expect(screen.queryByText('Catan')).not.toBeInTheDocument();
  });

  it('orchestrates add + create thread on confirm', async () => {
    render(
      <AddToLibraryModal game={game} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    fireEvent.click(screen.getByText(/aggiungi e chiedi/i));

    await waitFor(() => {
      expect(mockAddGame).toHaveBeenCalledWith('g1', expect.any(Object));
    });

    await waitFor(() => {
      expect(mockCreateThread).toHaveBeenCalledWith(
        expect.objectContaining({ gameId: 'g1' })
      );
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ gameId: 'g1', threadId: 't1', agentId: 'a1' })
      );
    });
  });

  it('shows error when addGame fails', async () => {
    mockAddGame.mockRejectedValue(new Error('Network error'));

    render(
      <AddToLibraryModal game={game} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    fireEvent.click(screen.getByText(/aggiungi e chiedi/i));

    await waitFor(() => {
      expect(screen.getByText(/errore/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('shows retry when createThread fails (game stays in library)', async () => {
    mockCreateThread.mockRejectedValue(new Error('Thread creation failed'));

    render(
      <AddToLibraryModal game={game} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    fireEvent.click(screen.getByText(/aggiungi e chiedi/i));

    await waitFor(() => {
      expect(mockAddGame).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/riprova/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('calls onClose when cancel is clicked', () => {
    render(
      <AddToLibraryModal game={game} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    fireEvent.click(screen.getByText(/annulla/i));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run src/__tests__/components/dashboard/AddToLibraryModal.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement AddToLibraryModal**

Create `apps/web/src/components/dashboard/AddToLibraryModal.tsx`:

Key implementation details:
- Use shadcn `Dialog` component (`@/components/ui/navigation/dialog` — verify exact import path)
- State: `isLoading`, `error`, `retryMode` (when thread creation fails after successful add)
- On confirm:
  1. `setIsLoading(true)`
  2. `await libraryClient.addGame(game.id, {})`
  3. `const thread = await chatClient.createThread({ gameId: game.id, title: game.name })`
  4. `onSuccess({ gameId: game.id, threadId: thread.id, agentId: thread.agentId })`
- On addGame error: show error message, stay in modal
- On createThread error: show "Riprova" button that only retries step 3 (game already added)
- Invalidate dashboard queries via `queryClient.invalidateQueries({ queryKey: ['dashboard'] })`

**Note:** Check exact `queryKey` patterns by searching for `useQuery` with `dashboard` key in `apps/web/src/hooks/`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run src/__tests__/components/dashboard/AddToLibraryModal.test.tsx`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/dashboard/AddToLibraryModal.tsx apps/web/src/__tests__/components/dashboard/AddToLibraryModal.test.tsx
git commit -m "feat(dashboard): add AddToLibraryModal with orchestrated add + chat creation"
```

---

### Task 5: HeroZone Enhanced Empty State

**Files:**
- Modify: `apps/web/src/components/dashboard/zones/HeroZone.tsx`
- Reference: `apps/web/src/stores/useDashboardSearchStore.ts`

- [ ] **Step 1: Read current HeroZone**

Run: `cd apps/web && cat src/components/dashboard/zones/HeroZone.tsx`

Identify:
- The `isNewUser` conditional (around line 91)
- The `<WelcomePrompt />` component rendering
- The `useDashboardData()` hook usage

- [ ] **Step 2: Modify the isNewUser branch**

Replace the `{isNewUser && <WelcomePrompt />}` block with:

```tsx
{isNewUser && (
  <div className="mt-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 p-6 text-center">
    <p className="text-sm text-purple-300 mb-4">
      {greeting}{user?.username ? `, ${user.username}` : ''}!<br />
      Hai una domanda su un gioco da tavolo? Cerca nella community e chiedi all&apos;AI!
    </p>
    <button
      onClick={() => useDashboardSearchStore.getState().openSearch()}
      className="inline-flex items-center gap-2 rounded-lg bg-purple-500/15 border border-purple-500/25 px-4 py-2 text-sm font-medium text-purple-300 hover:bg-purple-500/25 transition-colors"
      data-testid="hero-search-cta"
    >
      <Search className="w-4 h-4" />
      Cerca un gioco
    </button>
    <p className="mt-2 text-xs text-muted-foreground">
      oppure usa la barra in basso ↓
    </p>
  </div>
)}
```

Add imports at top:
```typescript
import { Search } from 'lucide-react';
import { useDashboardSearchStore } from '@/stores/useDashboardSearchStore';
```

- [ ] **Step 3: Verify manually**

Run: `cd apps/web && pnpm dev`
- Clear localStorage/session to simulate new user (or use a test account with empty library)
- Navigate to dashboard
- Verify: enhanced empty state shows with "Cerca un gioco" CTA
- Click CTA → SearchExpander opens in SmartFAB area

- [ ] **Step 4: Run existing HeroZone tests to verify no regression**

Run: `cd apps/web && pnpm vitest run --reporter=verbose 2>&1 | grep -i herozone`

If existing tests reference `WelcomePrompt`, update them to expect the new CTA button text instead.

- [ ] **Step 5: Remove dead WelcomePrompt code**

If the `WelcomePrompt` component/function was only used in this `isNewUser` branch, remove its definition to avoid lint warnings about dead code. Check if it's imported elsewhere first: `grep -r "WelcomePrompt" src/`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/dashboard/zones/HeroZone.tsx
git commit -m "feat(dashboard): enhance HeroZone empty state with search CTA for new users"
```

---

### Task 6: Wire AddToLibraryModal into Dashboard Flow

**Files:**
- Modify: `apps/web/src/components/dashboard/DashboardRenderer.tsx`
- Reference: `apps/web/src/stores/useDashboardSearchStore.ts`
- Reference: `apps/web/src/components/dashboard/AddToLibraryModal.tsx`

- [ ] **Step 1: Read DashboardRenderer**

Run: `cd apps/web && cat src/components/dashboard/DashboardRenderer.tsx`

Understand its JSX structure and where to mount the modal.

- [ ] **Step 2: Add AddToLibraryModal mount**

In `DashboardRenderer.tsx`, add:

```typescript
import { useDashboardSearchStore } from '@/stores/useDashboardSearchStore';
import { AddToLibraryModal } from './AddToLibraryModal';
```

Inside the component body:
```typescript
const { selectedGame, setSelectedGame, openChatDrawer } = useDashboardSearchStore();

const handleModalSuccess = useCallback(({ gameId, threadId, agentId }: { gameId: string; threadId: string; agentId: string }) => {
  setSelectedGame(null);
  openChatDrawer({ threadId, agentId, gameId, gameName: selectedGame?.name ?? '' });
}, [selectedGame, setSelectedGame, openChatDrawer]);
```

At the end of the JSX (before closing div):
```tsx
<AddToLibraryModal
  game={selectedGame}
  isOpen={selectedGame !== null}
  onClose={() => setSelectedGame(null)}
  onSuccess={handleModalSuccess}
/>
```

- [ ] **Step 3: Verify the modal flow**

Run: `cd apps/web && pnpm dev`
- Dashboard → SmartFAB search → type game name → click "Chiedi" on a game not in library
- Modal appears with game info
- Click "Aggiungi e Chiedi" → game added (check network tab) + thread created

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/dashboard/DashboardRenderer.tsx
git commit -m "feat(dashboard): wire AddToLibraryModal into dashboard renderer"
```

---

## Chunk 3: EmbeddedChatView + Drawer Integration

### Task 7: EmbeddedChatView Component

**Files:**
- Create: `apps/web/src/components/chat-unified/EmbeddedChatView.tsx`
- Test: `apps/web/src/__tests__/components/chat-unified/EmbeddedChatView.test.tsx`
- Reference: `apps/web/src/hooks/useAgentChatStream.ts` — `{ state, sendMessage, stopStreaming, reset }`
- Reference: `apps/web/src/components/chat-unified/ChatThreadView.tsx` — message rendering patterns

- [ ] **Step 1: Write the test**

```tsx
// apps/web/src/__tests__/components/chat-unified/EmbeddedChatView.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmbeddedChatView } from '@/components/chat-unified/EmbeddedChatView';

const mockSendMessage = vi.fn();
const mockReset = vi.fn();

vi.mock('@/hooks/useAgentChatStream', () => ({
  useAgentChatStream: () => ({
    state: {
      statusMessage: null,
      currentAnswer: '',
      followUpQuestions: [],
      isStreaming: false,
      error: null,
      chatThreadId: 't1',
      totalTokens: 0,
      debugSteps: [],
      modelDowngrade: null,
      strategyTier: null,
      executionId: null,
    },
    sendMessage: mockSendMessage,
    stopStreaming: vi.fn(),
    reset: mockReset,
  }),
}));

// Mock chat thread history
vi.mock('@/lib/api/clients/chatClient', () => ({
  createChatClient: () => ({
    getMessages: vi.fn().mockResolvedValue({ items: [] }),
  }),
}));

describe('EmbeddedChatView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input area', () => {
    render(<EmbeddedChatView threadId="t1" agentId="a1" gameId="g1" />);
    expect(screen.getByPlaceholderText(/scrivi/i)).toBeInTheDocument();
  });

  it('sends message via SSE on submit', async () => {
    render(<EmbeddedChatView threadId="t1" agentId="a1" gameId="g1" />);

    const input = screen.getByPlaceholderText(/scrivi/i);
    fireEvent.change(input, { target: { value: 'Come si gioca?' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith(
        'a1',
        'Come si gioca?',
        't1',
        expect.anything(),
        undefined
      );
    });
  });

  it('renders welcome state when no messages', () => {
    render(<EmbeddedChatView threadId="t1" agentId="a1" gameId="g1" />);
    expect(screen.getByText(/chiedi qualsiasi cosa/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run src/__tests__/components/chat-unified/EmbeddedChatView.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement EmbeddedChatView**

Create `apps/web/src/components/chat-unified/EmbeddedChatView.tsx`:

Key implementation details:
- Extract the message rendering + input logic from `ChatThreadView.tsx` — study lines 50-91 (state), 181-187 (auto-scroll), 267-324 (handleSendMessage)
- **DO NOT** import ChatThreadView — build a focused component that reuses the same hooks
- Structure:
  ```tsx
  <div className="flex flex-col h-full" data-testid="embedded-chat-view">
    {/* Messages area */}
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.length === 0 && !streamState.currentAnswer && (
        <p className="text-center text-sm text-muted-foreground">Chiedi qualsiasi cosa sul gioco!</p>
      )}
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {streamState.currentAnswer && (
        <StreamingBubble content={streamState.currentAnswer} />
      )}
      <div ref={messagesEndRef} />
    </div>
    {/* Input area */}
    <form onSubmit={handleSend} className="p-3 border-t border-border">
      <div className="flex items-center gap-2">
        <input ... />
        <button type="submit" disabled={isSending}>📤</button>
      </div>
    </form>
  </div>
  ```
- Use `useAgentChatStream` with callbacks that append to local `messages` state
- `sendMessage(agentId, content, threadId, proxyGameContext)` — where `proxyGameContext = { gameId }`
- Auto-scroll via `useRef` + `useEffect` on messages/currentAnswer change

**Note:** Check if `MessageBubble` or similar rendering component exists in `apps/web/src/components/chat-unified/`. If so, reuse it. Otherwise, create a minimal inline bubble renderer.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run src/__tests__/components/chat-unified/EmbeddedChatView.test.tsx`
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/chat-unified/EmbeddedChatView.tsx apps/web/src/__tests__/components/chat-unified/EmbeddedChatView.test.tsx
git commit -m "feat(chat): add EmbeddedChatView for compact drawer chat"
```

---

### Task 8: ExtraMeepleCardDrawer — Add liveChat Mode

**Files:**
- Modify: `apps/web/src/components/ui/data-display/extra-meeple-card/ExtraMeepleCardDrawer.tsx`
- Reference: `apps/web/src/components/chat-unified/EmbeddedChatView.tsx`

- [ ] **Step 1: Read current drawer implementation**

Run: `cd apps/web && cat src/components/ui/data-display/extra-meeple-card/ExtraMeepleCardDrawer.tsx`

Identify:
- `DrawerEntityRouter` function (lines 223-262)
- `ChatDrawerContent` function (lines 318-329)
- The `ExtraMeepleCardDrawerProps` interface (lines 72-88)

- [ ] **Step 2: Extend props with mode discriminator**

Add to `ExtraMeepleCardDrawerProps`:
```typescript
export interface ExtraMeepleCardDrawerProps {
  entityType: DrawerEntityType;
  entityId: string;
  open: boolean;
  onClose: () => void;
  linkEntityType?: LinkEntityType;
  className?: string;
  'data-testid'?: string;
  // NEW: live chat mode data
  liveChatData?: {
    threadId: string;
    agentId: string;
    gameId: string;
    gameName: string;
  };
}
```

- [ ] **Step 3: Extend DrawerEntityRouter signature and modify chatSession branch**

The `DrawerEntityRouter` function (lines ~223-232) currently accepts only `{ entityType, entityId, linkEntityType }`. You MUST:

1. Add `liveChatData` to `DrawerEntityRouter`'s parameter type:
```typescript
function DrawerEntityRouter({
  entityType,
  entityId,
  linkEntityType,
  liveChatData,  // NEW
}: {
  entityType: DrawerEntityType;
  entityId: string;
  linkEntityType?: LinkEntityType;
  liveChatData?: ExtraMeepleCardDrawerProps['liveChatData'];  // NEW
}) {
```

2. Update the call site in the parent component (around line ~209) to pass `liveChatData`:
```typescript
<DrawerEntityRouter
  entityType={entityType}
  entityId={entityId}
  linkEntityType={linkEntityType}
  liveChatData={liveChatData}  // NEW — pass through from parent props
/>
```

3. Modify the `chatSession`/`chat` case:
```typescript
case 'chatSession':
case 'chat':
  if (liveChatData) {
    return (
      <EmbeddedChatView
        threadId={liveChatData.threadId}
        agentId={liveChatData.agentId}
        gameId={liveChatData.gameId}
      />
    );
  }
  return <ChatDrawerContent entityId={entityId} />;
```

Add import:
```typescript
import { EmbeddedChatView } from '@/components/chat-unified/EmbeddedChatView';
```

- [ ] **Step 4: Verify no existing tests break**

Run: `cd apps/web && pnpm vitest run --reporter=verbose 2>&1 | grep -i "extrameeple\|drawer"`

Fix any failures.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/data-display/extra-meeple-card/ExtraMeepleCardDrawer.tsx
git commit -m "feat(drawer): add liveChat mode to chatSession branch in ExtraMeepleCardDrawer"
```

---

### Task 9: Wire Chat Drawer into DashboardRenderer

**Files:**
- Modify: `apps/web/src/components/dashboard/DashboardRenderer.tsx`
- Reference: `apps/web/src/stores/useDashboardSearchStore.ts`
- Reference: `apps/web/src/components/ui/data-display/extra-meeple-card/ExtraMeepleCardDrawer.tsx`

- [ ] **Step 1: Read current DashboardRenderer (after Task 6 changes)**

Run: `cd apps/web && cat src/components/dashboard/DashboardRenderer.tsx`

- [ ] **Step 2: Add ExtraMeepleCardDrawer mount for live chat**

Add import:
```typescript
import { ExtraMeepleCardDrawer } from '@/components/ui/data-display/extra-meeple-card';
```

Use the `drawerState` from the store (already imported in Task 6):
```typescript
const { selectedGame, setSelectedGame, openChatDrawer, drawerState, closeChatDrawer } = useDashboardSearchStore();
```

Add at the end of JSX (after the AddToLibraryModal from Task 6):
```tsx
{drawerState && (
  <ExtraMeepleCardDrawer
    entityType="chatSession"
    entityId={drawerState.threadId}
    open={true}
    onClose={closeChatDrawer}
    liveChatData={drawerState}
    data-testid="dashboard-chat-drawer"
  />
)}
```

- [ ] **Step 3: Test the complete flow end-to-end**

Run: `cd apps/web && pnpm dev`

Complete flow:
1. Dashboard (new user) → see enhanced HeroZone
2. Click "Cerca un gioco" CTA or 🔍 in SmartFAB
3. Type a game name → see results
4. Click "Chiedi" on a shared library game → AddToLibraryModal appears
5. Click "Aggiungi e Chiedi" → game added + thread created
6. Modal closes → ExtraMeepleCardDrawer opens with EmbeddedChatView
7. Type a question → get AI response via SSE
8. Close drawer → chat card should appear in dashboard "Active Chats" (via query invalidation)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/dashboard/DashboardRenderer.tsx
git commit -m "feat(dashboard): wire chat drawer with live chat mode into dashboard"
```

---

## Chunk 4: Polish + Final Verification

### Task 10: Type Check + Lint

- [ ] **Step 1: Run TypeScript check**

Run: `cd apps/web && pnpm typecheck`
Expected: 0 errors. Fix any type issues.

- [ ] **Step 2: Run lint**

Run: `cd apps/web && pnpm lint`
Expected: 0 errors. Fix any lint issues.

- [ ] **Step 3: Commit fixes if any**

```bash
git add apps/web/src/  # Stage only specific changed files, not -A
git commit -m "fix(dashboard): resolve type and lint issues in search-chat flow"
```

---

### Task 11: Run All Tests

- [ ] **Step 1: Run full test suite**

Run: `cd apps/web && pnpm test`
Expected: All tests pass.

- [ ] **Step 2: Run only new tests to verify coverage**

Run: `cd apps/web && pnpm vitest run src/__tests__/stores/useDashboardSearchStore.test.ts src/__tests__/components/dashboard/SearchExpander.test.tsx src/__tests__/components/dashboard/AddToLibraryModal.test.tsx src/__tests__/components/chat-unified/EmbeddedChatView.test.tsx`
Expected: All 18+ tests PASS.

- [ ] **Step 3: Fix any failures and commit**

```bash
git add apps/web/src/  # Stage only specific changed files, not -A
git commit -m "fix(dashboard): resolve test failures in search-chat flow"
```

---

### Task 12: Push + PR

- [ ] **Step 1: Verify branch**

Run: `git branch --show-current`
Expected: `feature/dashboard-search-chat-flow` (created in Task 0)

- [ ] **Step 2: Push and create PR**

```bash
git push -u origin feature/dashboard-search-chat-flow
```

Create PR to `main-dev` (parent branch):
```bash
gh pr create --base main-dev --title "feat: dashboard search → add game → chat flow" --body-file <(cat <<'EOF'
## Summary

- **SearchExpander** in SmartFAB: debounced search across shared game library with dual actions (Vedi/Chiedi)
- **AddToLibraryModal**: one-click add game + create chat thread orchestration
- **EmbeddedChatView**: compact ChatThreadView for drawer usage (messages + input only)
- **ExtraMeepleCardDrawer**: liveChat mode for chatSession entity type
- **HeroZone**: enhanced empty state guiding new users to search

## User Flow

New user → dashboard → search game → "Chiedi" → add to library modal → chat in drawer

## Test plan

- [ ] New user sees enhanced HeroZone with "Cerca un gioco" CTA
- [ ] CTA opens SearchExpander in SmartFAB area
- [ ] Search returns shared library games with dual actions
- [ ] "Vedi" navigates to shared game page
- [ ] "Chiedi" on non-library game opens AddToLibraryModal
- [ ] "Aggiungi e Chiedi" adds game + creates thread + opens drawer
- [ ] EmbeddedChatView in drawer works with SSE streaming
- [ ] Close drawer → chat card visible in Active Chats
- [ ] TypeScript + lint pass
- [ ] All unit tests pass

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)
```

- [ ] **Step 3: Update issue status**

Update the related GitHub issue (if any) with PR link and mark as in-progress.

- [ ] **Step 4: Clean up**

```bash
git branch -D feature/dashboard-search-chat-flow  # After merge
git remote prune origin
```
