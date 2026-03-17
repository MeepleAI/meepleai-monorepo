# Replace Mocked Data Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded/mocked data in the frontend with real API calls across 11 tasks (C4 deferred).

**Architecture:** Phase 1 wires 7 frontend components to existing backend APIs. Phase 2 creates/modifies 4 backend endpoints then wires frontend. Each task is independent and can be parallelized.

**Tech Stack:** Next.js (React 19), @tanstack/react-query, .NET 9 Minimal APIs + MediatR CQRS, FluentValidation

**Spec:** `docs/superpowers/specs/2026-03-17-replace-mocked-data-design.md`

---

## Chunk 1: Phase 1 — Frontend Quick Wins

### Task 1: A1 — Wire 2FA Status + Recovery Codes

**Files:**
- Modify: `apps/web/src/app/(authenticated)/settings/security/page.tsx`
- Reference: `apps/web/src/lib/api/clients/authClient.ts` (for API methods)

**Context:** Component at line 23 has `useState(false)` for 2FA status, lines 31-37 have hardcoded recovery codes. Lines 28-29 have commented-out useQuery. Backend endpoints `POST /api/v1/auth/2fa/setup`, `enable`, `disable` exist.

- [ ] **Step 1: Read the current security page and authClient**

Read `security/page.tsx` and `authClient.ts` to confirm the exact API method names for 2FA status and setup.

- [ ] **Step 2: Replace hardcoded 2FA status with API query**

Replace `useState(false)` with a query to fetch 2FA status:

```tsx
// Replace line 23:
// const [is2FAEnabled, setIs2FAEnabled] = useState(false);
// With:
const { data: twoFactorStatus, isLoading: is2FALoading } = useQuery({
  queryKey: ['2fa-status'],
  queryFn: () => api.auth.get2FAStatus(),
  retry: false,
});
const is2FAEnabled = twoFactorStatus?.isEnabled ?? false;
```

If `get2FAStatus()` doesn't exist in authClient, check for an equivalent method (e.g. profile endpoint that includes 2FA status).

- [ ] **Step 3: Replace hardcoded recovery codes with setup response**

Remove the hardcoded `recoveryCodes` array (lines 31-37). Recovery codes should come from the `setup2FA()` API response and be stored in component state only after user completes setup:

```tsx
const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

// In the setup handler:
const setupResult = await api.auth.setup2FA();
setRecoveryCodes(setupResult.recoveryCodes);
```

- [ ] **Step 4: Remove hardcoded TOTP secret**

Line 102 has `JBSWY3DPEHPK3PXP`. Replace with the secret from the setup API response.

- [ ] **Step 5: Add loading state for 2FA status**

Show skeleton/spinner while `is2FALoading` is true.

- [ ] **Step 6: Test manually**

Verify: page loads without errors, 2FA status reflects real state, setup flow returns real codes.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/\(authenticated\)/settings/security/page.tsx
git commit -m "feat(settings): wire 2FA status and recovery codes to real API"
```

---

### Task 2: A2 — Wire Avatar Upload

**Files:**
- Modify: `apps/web/src/app/(public)/settings/page.tsx` (~line 770)

**Context:** The `onUpload` callback in `<AvatarUpload>` has `api.auth.uploadAvatar(file)` commented out. The upload UI and optimistic update already work — just need to uncomment the API call.

- [ ] **Step 1: Read settings page around line 760-790**

Find the exact commented-out code and surrounding error handling.

- [ ] **Step 2: Uncomment the avatar upload API call**

```tsx
// Replace:
// TODO: Upload to backend when API is available
// await api.auth.uploadAvatar(file);

// With:
await api.auth.uploadAvatar(file);
```

- [ ] **Step 3: Verify error handling exists**

Ensure there's a try/catch that reverts the optimistic preview on failure. If not, add one:

```tsx
try {
  await api.auth.uploadAvatar(file);
} catch (err) {
  // Revert optimistic preview
  setAvatarPreview(null);
  toast.error('Failed to upload avatar');
}
```

- [ ] **Step 4: Test manually**

Upload an avatar image, verify it persists after page reload.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(public\)/settings/page.tsx
git commit -m "feat(settings): wire avatar upload to backend API"
```

---

### Task 3: B1-B3 — Wire Agent Analytics to Real Data

**Files:**
- Modify: `apps/web/src/app/admin/(dashboard)/agents/analytics/page.tsx`
- Delete: `apps/web/src/components/admin/agents/agent-kpi-cards.tsx` (mock version)
- Delete: `apps/web/src/components/admin/agents/cost-breakdown-chart.tsx` (mock version)
- Delete: `apps/web/src/components/admin/agents/usage-trend-chart.tsx` (mock version)
- Possibly delete: `apps/web/src/components/admin/agents/top-queries-table.tsx` (check if mock)
- Reference: `apps/web/src/app/(authenticated)/admin/agents/metrics/client.tsx` (real implementation)
- Reference: `apps/web/src/components/admin/agents/CostBreakdownChart.tsx` (real component with props)
- Reference: `apps/web/src/components/admin/agents/MetricsKpiCards.tsx` (real component)
- Reference: `apps/web/src/components/admin/agents/UsageChart.tsx` (real component)
- Reference: `apps/web/src/components/admin/agents/TopAgentsTable.tsx` (real component)

**Context:** There are TWO sets of components:
1. **Mock (kebab-case):** `agent-kpi-cards.tsx`, `cost-breakdown-chart.tsx`, `usage-trend-chart.tsx` — hardcoded MOCK_* data, no props
2. **Real (PascalCase):** `MetricsKpiCards.tsx`, `CostBreakdownChart.tsx`, `UsageChart.tsx` — accept data props, used by `metrics/client.tsx`

The `metrics/client.tsx` already fetches from `GET /api/v1/admin/agents/metrics` and passes data as props. The `analytics/page.tsx` imports the mock versions.

**Strategy:** Convert analytics page to a client component that fetches data (like metrics/client.tsx), use the real PascalCase components, delete mock kebab-case files.

- [ ] **Step 1: Read all real components to understand their props**

Read `MetricsKpiCards.tsx`, `CostBreakdownChart.tsx`, `UsageChart.tsx`, `TopAgentsTable.tsx` to confirm their prop interfaces.

- [ ] **Step 2: Read metrics/client.tsx fully**

Understand the fetch logic, date range handling, and data flow pattern.

- [ ] **Step 3: Convert analytics/page.tsx to client component with data fetching**

Rewrite `analytics/page.tsx` to:
1. Add `'use client'` directive
2. Import real components (PascalCase versions)
3. Copy the fetch pattern from `metrics/client.tsx` (useQuery + fetchAgentMetrics)
4. Add date range state (7d/30d/90d buttons already in UI)
5. Pass fetched data as props to real components
6. Handle loading/error states with existing Suspense skeletons

Move metadata to a separate `layout.tsx` file since client components can't export metadata.

- [ ] **Step 4: Delete mock component files**

```bash
rm apps/web/src/components/admin/agents/agent-kpi-cards.tsx
rm apps/web/src/components/admin/agents/cost-breakdown-chart.tsx
rm apps/web/src/components/admin/agents/usage-trend-chart.tsx
```

Verify no other files import from these paths:
```bash
grep -r "agent-kpi-cards\|cost-breakdown-chart\|usage-trend-chart" apps/web/src/ --include="*.tsx" --include="*.ts"
```

Also check `top-queries-table.tsx` — if it's mock, delete and use `TopAgentsTable.tsx`.

- [ ] **Step 5: Verify no broken imports**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Test manually**

Navigate to `/admin/agents/analytics`, verify real data loads (or proper empty/error state if no metrics exist yet).

- [ ] **Step 7: Commit**

```bash
git add -A apps/web/src/app/admin/\(dashboard\)/agents/analytics/
git add -A apps/web/src/components/admin/agents/
git commit -m "feat(admin): wire agent analytics to real metrics API, remove mock components"
```

---

### Task 4: C1 — Wire Dashboard Upcoming Game Night

**Files:**
- Modify: `apps/web/src/app/(authenticated)/gaming-hub-client.tsx` (line 64)
- Reference: `apps/web/src/hooks/queries/useGameNights.ts` (`useUpcomingGameNights()` hook already exists!)

**Context:** `upcomingGameNight: null` with TODO. The hook `useUpcomingGameNights()` already exists and calls `gameNightsClient.getUpcoming()`.

- [ ] **Step 1: Read gaming-hub-client.tsx and useGameNights.ts**

Understand the `useDashboardContext()` call and confirm `useUpcomingGameNights()` return shape.

- [ ] **Step 2: Use the existing hook**

```tsx
import { useUpcomingGameNights } from '@/hooks/queries/useGameNights';

// Add in component:
const { data: upcomingNights } = useUpcomingGameNights();
const upcomingGameNight = upcomingNights?.[0] ?? null;
```

- [ ] **Step 3: Replace the hardcoded null**

```tsx
// Replace:
upcomingGameNight: null, // TODO: wire to real API

// With:
upcomingGameNight,
```

- [ ] **Step 4: Test manually**

Dashboard should show upcoming game night if one exists, or behave as before (null) if none.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(authenticated\)/gaming-hub-client.tsx
git commit -m "feat(dashboard): wire upcoming game night to real API"
```

---

### Task 5: C3 — Wire Session History

**Files:**
- Modify: `apps/web/src/app/(authenticated)/toolkit/history/page.tsx` (line 36)
- Reference: `apps/web/src/lib/api/clients/sessionsClient.ts` (`getHistory(filters)` exists)

**Context:** `useState<Session[]>([])` with MVP comment. `sessionsClient.getHistory()` returns `PaginatedSessionsResponse` with filters for `gameId`, `startDate`, `endDate`, `limit`, `offset`.

- [ ] **Step 1: Read history page and sessionsClient**

Understand the Session type expected and the filter UI already built (gameFilter, startDate, endDate at lines 41-43).

- [ ] **Step 2: Replace useState with useQuery**

```tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const { data: sessionsData, isLoading } = useQuery({
  queryKey: ['session-history', gameFilter, startDate, endDate],
  queryFn: () => api.sessions.getHistory({
    gameId: gameFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit: 20,
  }),
  retry: false,
});

const sessions = sessionsData?.items ?? [];
```

- [ ] **Step 3: Remove the old useState**

Delete: `const [sessions] = useState<Session[]>([]);`

- [ ] **Step 4: Add loading state**

Show a spinner/skeleton while `isLoading` is true.

- [ ] **Step 5: Test manually**

Page should show real session history or proper empty state.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/\(authenticated\)/toolkit/history/page.tsx
git commit -m "feat(toolkit): wire session history to real API"
```

---

## Chunk 2: Phase 2 — Backend + Frontend

### Task 6: A3 — Contact Form Endpoint

**Files:**
- Create: `apps/api/src/Api/BoundedContexts/Administration/Application/Commands/Contact/SendContactMessageCommand.cs`
- Create: `apps/api/src/Api/BoundedContexts/Administration/Application/Commands/Contact/SendContactMessageCommandHandler.cs`
- Create: `apps/api/src/Api/BoundedContexts/Administration/Application/Commands/Contact/SendContactMessageCommandValidator.cs`
- Modify: `apps/api/src/Api/Routing/` — add contact endpoint (find appropriate routing file or create new)
- Create: `apps/web/src/lib/api/clients/contactClient.ts` (if not exists)
- Modify: `apps/web/src/app/(public)/contact/page.tsx` (line 61-62)

**Context:** No contact endpoint exists in backend. Frontend has `setTimeout(1500)` placeholder. Place in Administration bounded context since it's admin-facing (contact messages go to admin).

- [ ] **Step 1: Check existing patterns for simple command endpoints**

Read an existing simple command (e.g., a notification or alert creation) to follow the same CQRS pattern.

- [ ] **Step 2: Create the command**

```csharp
// SendContactMessageCommand.cs
internal record SendContactMessageCommand(
    string Name,
    string Email,
    string Subject,
    string Message
) : ICommand<Guid>;
```

- [ ] **Step 3: Create the validator**

```csharp
// SendContactMessageCommandValidator.cs
internal class SendContactMessageCommandValidator : AbstractValidator<SendContactMessageCommand>
{
    public SendContactMessageCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);
        RuleFor(x => x.Subject).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Message).NotEmpty().MaximumLength(5000);
    }
}
```

- [ ] **Step 4: Create the handler**

Handler should store the message (or send email). Follow existing patterns — check if there's an email service or just persist to DB.

- [ ] **Step 5: Add the endpoint**

```csharp
app.MapPost("/api/v1/contact", async (SendContactMessageCommand cmd, IMediator mediator) =>
    Results.Ok(await mediator.Send(cmd)))
    .AllowAnonymous()
    .WithTags("Contact");
```

- [ ] **Step 6: Create frontend client (if needed)**

```typescript
// contactClient.ts
export function createContactClient(http: HttpClient) {
  return {
    send: (data: { name: string; email: string; subject: string; message: string }) =>
      http.post('/api/v1/contact', data),
  };
}
```

Register in `apps/web/src/lib/api/index.ts`.

- [ ] **Step 7: Wire contact page**

Replace setTimeout with real API call:

```tsx
// Replace:
await new Promise((resolve) => setTimeout(resolve, 1500));

// With:
await api.contact.send({ name, email, subject, message });
```

- [ ] **Step 8: Test**

Run backend tests: `dotnet test --filter "Contact"`
Manual: submit form, verify 200 response.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/Api/BoundedContexts/Administration/Application/Commands/Contact/
git add apps/api/src/Api/Routing/
git add apps/web/src/lib/api/clients/contactClient.ts
git add apps/web/src/lib/api/index.ts
git add apps/web/src/app/\(public\)/contact/page.tsx
git commit -m "feat(contact): add contact form endpoint and wire frontend"
```

---

### Task 7: A4 — Privacy Settings Endpoint

**Files:**
- Modify: `apps/api/src/Api/BoundedContexts/Authentication/Domain/Entities/User.cs` (add privacy fields)
- Create: EF migration for new columns
- Modify: `apps/api/src/Api/BoundedContexts/Authentication/Application/Commands/UserProfile/UpdatePreferencesCommand.cs`
- Modify: `apps/api/src/Api/BoundedContexts/Authentication/Application/Commands/UserProfile/UpdatePreferencesCommandHandler.cs`
- Modify: `apps/api/src/Api/Routing/UserProfileEndpoints.cs` (~line 246)
- Modify: `apps/web/src/app/(public)/settings/page.tsx` (~line 393-396)

**Context:** `PUT /api/v1/users/preferences` exists with fields: `Language, Theme, EmailNotifications, DataRetentionDays`. Missing: privacy fields. The User entity does NOT have privacy columns — this requires a DB migration. Use PUT (not PATCH) for consistency with existing endpoint pattern.

- [ ] **Step 1: Read User.cs entity and UpdatePreferencesCommand.cs**

Understand current domain model fields and DB mapping.

- [ ] **Step 2: Add privacy fields to User entity**

```csharp
// Add to User entity:
public bool ShowProfile { get; private set; } = true;
public bool ShowActivity { get; private set; } = true;
public bool ShowLibrary { get; private set; } = true;

public void UpdatePrivacySettings(bool showProfile, bool showActivity, bool showLibrary)
{
    ShowProfile = showProfile;
    ShowActivity = showActivity;
    ShowLibrary = showLibrary;
}
```

- [ ] **Step 3: Create EF migration**

```bash
cd apps/api/src/Api
dotnet ef migrations add AddUserPrivacySettings
```

Review the generated SQL — should add 3 boolean columns with defaults.

- [ ] **Step 4: Add privacy fields to UpdatePreferencesCommand**

```csharp
// Add to existing UpdatePreferencesCommand:
public bool ShowProfile { get; init; } = true;
public bool ShowActivity { get; init; } = true;
public bool ShowLibrary { get; init; } = true;
```

- [ ] **Step 5: Update handler to persist privacy fields**

Call `user.UpdatePrivacySettings(...)` in the existing handler.

- [ ] **Step 6: Update GET endpoint to return privacy fields**

Ensure `GET /api/v1/users/preferences` includes the new privacy booleans in its response object.

- [ ] **Step 7: Wire frontend**

Replace localStorage-only handler with API mutation using `PUT /api/v1/users/preferences`:

```tsx
const handleUpdatePrivacy = async (privacyData: PrivacyPreferences) => {
  await api.auth.updatePreferences({
    ...currentPreferences,
    showProfile: privacyData.showProfile,
    showActivity: privacyData.showActivity,
    showLibrary: privacyData.showLibrary,
  });
};
```

- [ ] **Step 8: Test**

Backend: `dotnet test --filter "Preferences"`
Manual: toggle privacy settings, reload, verify persistence.
DB: verify migration applied, columns exist.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/Api/BoundedContexts/Authentication/
git add apps/api/src/Api/Routing/UserProfileEndpoints.cs
git add apps/api/src/Api/Migrations/
git add apps/web/src/app/\(public\)/settings/page.tsx
git commit -m "feat(settings): add privacy preferences with DB migration and wire frontend"
```

---

### Task 8: B4 — Collection Stats Granular Breakdown

**Files:**
- Modify: `apps/api/src/Api/BoundedContexts/UserLibrary/Application/DTOs/UserLibraryStatsDto.cs`
- Modify: `apps/api/src/Api/BoundedContexts/UserLibrary/Application/Queries/GetLibraryStatsQueryHandler.cs`
- Modify: `apps/web/src/components/collection/CollectionDashboard.tsx` (lines 629-631)

**Context:** Current `UserLibraryStatsDto` has: `TotalGames, FavoriteGames, PrivatePdfs, OldestAddedAt, NewestAddedAt`. Missing: breakdown by game state (nuovo, inPrestito, wishlist).

- [ ] **Step 1: Read the current DTO, handler, and library entry entity**

Understand what game states exist in the domain model. Check for a `GameState` enum or similar.

- [ ] **Step 2: Add state counts to DTO**

```csharp
internal record UserLibraryStatsDto(
    int TotalGames,
    int FavoriteGames,
    int PrivatePdfs,
    DateTime? OldestAddedAt,
    DateTime? NewestAddedAt,
    // New fields:
    int NewCount,
    int LentCount,
    int WishlistCount,
    int OwnedCount
);
```

- [ ] **Step 3: Update query handler to compute state counts**

Add GroupBy on game state in the query handler.

- [ ] **Step 4: Wire frontend**

Replace hardcoded zeros in `CollectionDashboard.tsx`:

```tsx
// Replace lines 629-631:
// nuovo: 0, // TODO
// inPrestito: 0, // TODO
// wishlist: 0, // TODO

// With:
nuovo: statsData.newCount ?? 0,
inPrestito: statsData.lentCount ?? 0,
wishlist: statsData.wishlistCount ?? 0,
```

- [ ] **Step 5: Update frontend Zod schema**

Modify `apps/web/src/lib/api/schemas/library.schemas.ts` — add `newCount`, `lentCount`, `wishlistCount`, `ownedCount` to `UserLibraryStatsSchema`.

- [ ] **Step 6: Test**

Backend: `dotnet test --filter "LibraryStats"`
Manual: verify collection dashboard shows real counts.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/Api/BoundedContexts/UserLibrary/
git add apps/web/src/lib/api/schemas/library.schemas.ts
git add apps/web/src/components/collection/CollectionDashboard.tsx
git commit -m "feat(library): add game state breakdown to collection stats"
```

---

### Task 9: C2 — Library Server-Side Search

**Files:**
- Modify: `apps/api/src/Api/Routing/UserLibraryEndpoints.cs` (~line 105-145)
- Modify: `apps/web/src/app/(authenticated)/library/CollectionPageClient.tsx` (~line 142)

**Context:** The backend `GetUserLibraryQuery` already has a `Search` parameter but the endpoint doesn't pass it. Just need to wire the query parameter through.

- [ ] **Step 1: Read UserLibraryEndpoints.cs GET library endpoint**

Find the exact parameter binding.

- [ ] **Step 2: Add search parameter to endpoint**

```csharp
// Add [FromQuery] string? search to the GET /api/v1/library handler parameters
// Pass it to the query: new GetUserLibraryQuery(userId, Search: search, ...)
```

- [ ] **Step 3: Wire frontend search**

In `CollectionPageClient.tsx`, pass search term to the API query with debounce:

```tsx
const [debouncedSearch] = useDebounce(searchTerm, 300);

const { data } = useQuery({
  queryKey: ['library', debouncedSearch, ...otherFilters],
  queryFn: () => api.library.getLibrary({ search: debouncedSearch, ...otherFilters }),
});
```

Check if `useDebounce` exists in the codebase or use `useDeferredValue`.

- [ ] **Step 4: Remove client-side filtering comment**

Delete the TODO comment about backend search integration.

- [ ] **Step 5: Test**

Manual: type in search box, verify results come from server (network tab shows query param).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/Api/Routing/UserLibraryEndpoints.cs
git add apps/web/src/app/\(authenticated\)/library/CollectionPageClient.tsx
git commit -m "feat(library): wire server-side search to existing backend query param"
```

---

### Task 10: C4 — Command Center Dashboard (DEFERRED)

**Status:** Deferred pending monitoring stack decision. The `CommandCenterDashboard.tsx` has extensive mock data for service status, system metrics, and alerts. Implementation requires:
1. Decision on monitoring data source (Prometheus, custom endpoints, etc.)
2. Backend endpoints to expose system health
3. Frontend wiring

**Action:** Create a tracking issue for this task. Do not implement until monitoring architecture is decided.

---

## Execution Order

**Parallel Group 1 (Tasks 1-5):** All Phase 1 tasks are independent — execute in parallel.

**Sequential Group 2 (Tasks 6-9):** Phase 2 tasks can also run in parallel since they touch different bounded contexts:
- Task 6 (Contact) — Administration BC
- Task 7 (Privacy) — Authentication BC
- Task 8 (Collection Stats) — UserLibrary BC
- Task 9 (Library Search) — UserLibrary BC (same BC as Task 8, so run after it)

**Deferred:** Task 10 (C4)

## Definition of Done

- [ ] Zero `MOCK_*` constants in production components (demo pages excluded)
- [ ] Zero `// TODO: Replace with API` or `// TODO: wire to real API` comments in modified files
- [ ] All modified components handle loading, error, and empty states
- [ ] Backend tests pass: `dotnet test`
- [ ] Frontend type-checks: `cd apps/web && pnpm tsc --noEmit`
- [ ] No mock kebab-case component files remaining in `components/admin/agents/`
