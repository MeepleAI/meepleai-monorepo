# Replace Mocked Data with Real API Calls

**Date:** 2026-03-17
**Status:** Approved
**Scope:** 12 tasks across frontend (7 wiring-only) + backend (5 new/modified endpoints)

## Problem

Frontend audit revealed 12 areas using hardcoded/mocked data instead of real API calls. This includes fake 2FA recovery codes, mock admin metrics, hardcoded zeros in collection stats, and unimplemented form submissions.

## Execution Strategy

**Phase 1 (Quick Wins):** 7 tasks requiring only frontend wiring — backend endpoints already exist.
**Phase 2 (Backend + Frontend):** 5 tasks requiring new or modified backend endpoints.

---

## Phase 1: Frontend Wiring Only

### A1: 2FA Status + Recovery Codes
- **File:** `apps/web/src/app/(authenticated)/settings/security/page.tsx`
- **Current:** Hardcoded `false` for 2FA status, fake recovery codes `ABCD-1234-EFGH`
- **Fix:** Uncomment/create `useQuery` for 2FA status via `authClient`. Recovery codes come from `setup2FA()` response — show only after setup, not statically.
- **Backend:** `POST /api/v1/auth/2fa/setup`, `POST /api/v1/auth/2fa/enable`, `POST /api/v1/auth/2fa/disable` already exist.

### A2: Avatar Upload
- **File:** `apps/web/src/app/(public)/settings/page.tsx`
- **Current:** `api.auth.uploadAvatar(file)` commented out (line ~770)
- **Fix:** Uncomment, wrap in `useMutation`, handle loading/error states, refresh user profile on success.
- **Backend:** `POST /api/v1/auth/avatar` already exists.

### B1: Agent KPI Cards
- **File:** `apps/web/src/components/admin/agents/agent-kpi-cards.tsx`
- **Current:** `MOCK_KPIS` array with hardcoded 14,832 queries, $247.50, etc.
- **Fix:** Accept metrics data as props from parent `client.tsx` which already calls `fetchAgentMetrics()`. Remove `MOCK_KPIS` constant.
- **Interface:** `AgentKPICardsProps { metrics: AgentMetricsData }` or loading/error states.

### B2: Cost Breakdown Chart
- **File:** `apps/web/src/components/admin/agents/cost-breakdown-chart.tsx`
- **Current:** `MOCK_COST_DATA` with hardcoded model costs.
- **Fix:** Accept cost breakdown data as props from parent. Remove `MOCK_COST_DATA`.
- **Interface:** `CostBreakdownChartProps { data: CostBreakdownEntry[] }` with loading state.

### B3: Usage Trend Chart
- **File:** `apps/web/src/components/admin/agents/usage-trend-chart.tsx`
- **Current:** `MOCK_USAGE_DATA` with hardcoded 7-day trend.
- **Fix:** Accept usage trend data as props from parent. Remove `MOCK_USAGE_DATA`.
- **Interface:** `UsageTrendChartProps { data: UsageTrendEntry[] }` with loading state.

### C1: Dashboard Upcoming Game Night
- **File:** `apps/web/src/app/(authenticated)/gaming-hub-client.tsx`
- **Current:** `upcomingGameNight: null` with TODO comment.
- **Fix:** Use `gameNightsClient.getGameNights()` with future date filter, take first result.
- **Pattern:** `useQuery(['upcoming-game-night'], ...)` with `startDate > new Date()`.

### C3: Session History
- **File:** `apps/web/src/app/(authenticated)/toolkit/history/page.tsx`
- **Current:** `useState<Session[]>([])` — empty MVP placeholder.
- **Fix:** Replace with `useQuery` calling `sessionsClient.getHistory()`.
- **Pattern:** Paginated query with loading/empty states.

---

## Phase 2: Backend + Frontend

### A3: Contact Form Endpoint
- **Frontend file:** `apps/web/src/app/(public)/contact/page.tsx`
- **Current:** `setTimeout(1500)` simulating API call.
- **Backend (new):** `POST /api/v1/contact` in a new or existing bounded context.
  - Command: `SendContactMessageCommand { Name, Email, Subject, Message }`
  - Handler: Send email notification to admin or store in DB.
  - Validation: FluentValidation for required fields, email format.
- **Frontend fix:** Replace setTimeout with `api.contact.send(formData)` mutation.

### A4: Privacy Settings Endpoint
- **Frontend file:** `apps/web/src/app/(public)/settings/page.tsx`
- **Current:** Privacy preferences saved to localStorage only.
- **Backend (new):** `PATCH /api/v1/auth/preferences/privacy` — extend existing UserPreferences.
  - Command: `UpdatePrivacyPreferencesCommand { ShowProfile, ShowActivity, ShowLibrary }`
  - Handler: Update user preferences in DB.
- **Frontend fix:** Replace localStorage with `useMutation` → backend persist.

### B4: Collection Stats Granular Breakdown
- **Frontend file:** `apps/web/src/components/collection/CollectionDashboard.tsx`
- **Current:** `nuovo: 0, inPrestito: 0, wishlist: 0` hardcoded.
- **Backend (modify):** Extend `GET /api/v1/users/{id}/library/stats` response to include game state counts.
  - Add to response DTO: `NewCount`, `LentCount`, `WishlistCount`.
  - Query handler: Group by game state in library entries.
- **Frontend fix:** Use new fields from stats API response.

### C2: Library Server-Side Search
- **Frontend file:** `apps/web/src/app/(authenticated)/library/CollectionPageClient.tsx`
- **Current:** Client-side filtering only.
- **Backend (verify):** Check if `GET /api/v1/users/{id}/library?search=term` already supports search param.
- **Frontend fix:** Add `searchTerm` to query params with debounce (300ms), pass to API call.

### C4: Command Center Dashboard — DEFERRED
- **File:** `apps/web/src/components/admin/command-center/CommandCenterDashboard.tsx`
- **Current:** Mock services, metrics, alerts.
- **Status:** Deferred — requires architectural decision on monitoring stack (HyperDX removed, replacement TBD).
- **Will address separately** once monitoring strategy is defined.

---

## Non-Goals

- Demo pages (`/toolkit-demo`, `/demo/entity-list-*`) keep mock data — intentional.
- No new UI design — use existing component patterns.
- No refactoring beyond what's needed for the wiring.

## Testing

- Each wired component: verify loading, success, and error states render correctly.
- Phase 2 backend: unit tests for new commands/handlers, integration tests for endpoints.
- Update existing tests that assert on mock data (e.g., `AdminGameImportWizard.test.tsx` pattern).

## Success Criteria

- Zero `MOCK_*` constants in production components (demo pages excluded).
- Zero `// TODO: Replace with API` comments in affected files.
- All 11 tasks (C4 deferred) showing real data from backend.
