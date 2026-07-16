# Research: Async Import Runs

**Feature**: 001-async-import-runs
**Date**: 2026-07-16

---

## Decision 1: In-App Router Strategy

**Decision**: Lightweight view-state machine using a `AppView` discriminated union in a single `useAppView` hook, managed in `App.tsx` / `Page.tsx`. No third-party router library.

**Rationale**: The app is a Contentful single-page location — there is no URL bar the user can navigate, and React Router would add routing logic that can never be exercised. A discriminated union (`{ view: 'runs' } | { view: 'import' } | { view: 'review', runId: string }`) is exhaustively type-safe and trivially tested. It replaces the current binary `mappingReviewState !== null` toggle in `Page.tsx` with a three-way switch.

**Alternatives considered**:
- React Router (memory history): technically feasible but brings ~10kb of unnecessary dependency for a problem solvable in 30 lines.
- Contentful `sdk.navigator`: designed for navigating between entries/assets, not for in-app view management.

---

## Decision 2: localStorage Schema and Key Strategy

**Decision**: One localStorage key per app installation scoped by `spaceId + environmentId`: `gdrive-import-runs::{spaceId}::{environmentId}`. Value is a JSON array of `RunRecord` objects, ordered by `startedAt` descending. Max 50 records (oldest are pruned when limit is hit).

**Rationale**:
- Scoping by space+environment prevents run records from one space polluting another when the same browser is used across spaces.
- A simple array is easy to read/write atomically — no complex indexing needed at the expected scale (max 20 runs per SC-005).
- 50-record cap ensures localStorage quota is never a realistic concern (each record is ~400 bytes of JSON metadata, no payloads stored).

**Alternatives considered**:
- One key per run ID: Requires listing all keys to load the runs page — not possible with the standard `localStorage` API without iterating all keys.
- IndexedDB: Provides async reads and larger quota, but is heavy machinery for a small metadata store.
- Contentful app installation parameters: 32KB limit and shared state across users on the same space — inappropriate for per-user run history.

**`RunRecord` schema** (stored in localStorage):
```ts
interface RunRecord {
  runId: string;              // Contentful agentRun sys.id
  documentTitle: string;      // Google Doc title (may be 'Untitled' if unavailable)
  documentId: string;         // Google Doc ID
  contentTypeIds: string[];   // IDs selected in the wizard
  startedAt: string;          // ISO 8601 timestamp
  createdEntryIds?: string[]; // populated after successful entry creation
}
```
Note: `status` is intentionally NOT stored. It is always fetched live from the backend (FR-007). `createdEntryIds` is the only mutable field — written on completion.

---

## Decision 3: Suspend Payload Fetch Strategy

**Decision**: The `MappingReviewSuspendPayload` is NOT stored in localStorage. When the user clicks "Review" on a `PENDING_REVIEW` run, a fresh `getWorkflowRun()` call fetches the full run data (including `metadata.suspendPayload`) from the backend. A loading state is shown during this fetch.

**Rationale**:
- `MappingReviewSuspendPayload` contains the full normalized document, entry block graph, and reference graph. Real-world documents produce payloads in the range of 100KB–1MB+ of JSON. Storing this in localStorage risks hitting the 5MB quota, especially for users with multiple `PENDING_REVIEW` runs.
- The payload is already durably stored on Contentful's backend for the lifetime of the agent run. Re-fetching it on demand is reliable and fast (single API call, ~200ms).
- This simplifies the localStorage record structure and eliminates quota management complexity.

**Alternatives considered**:
- Store suspend payload in localStorage: Risk of quota failure for large documents; creates stale data if the backend payload is ever updated.
- Store payload in sessionStorage: Not durable across browser restarts — defeats the purpose.

---

## Decision 4: Polling Architecture on the Runs Page

**Decision**: A single `useRunsPolling` hook in `RunsPage` manages all polling. It accepts the list of `RunRecord`s, fetches status for all runs in parallel on mount (and every 10s if any run is `IN_PROGRESS`/`PENDING_REVIEW` — i.e., not yet settled). It maintains a `Map<runId, RunStatus>` as its return value. The Runs page merges this with the localStorage records to derive display state.

**Rationale**:
- Parallel fetch per run (via `Promise.all`) means the page loads quickly even with 10+ runs.
- Stopping polling when all runs are settled prevents unnecessary API calls.
- The status map is kept separate from the `RunRecord` array so that the localStorage layer stays read-mostly (only writes on completion).

**Polling stop conditions**: Stop polling a run when its fetched status is `COMPLETED`, `FAILED`, or `null` (404 = expired). Continue polling while status is `IN_PROGRESS`, `DRAFT`, or `PENDING_REVIEW`.

Wait — `PENDING_REVIEW` does not need continued polling once it is detected; it is a stable state the user must act on. Polling SHOULD stop for `PENDING_REVIEW` runs (they won't change without user input). Only `IN_PROGRESS` and `DRAFT` need continued polling.

---

## Decision 5: Wizard Exit Behavior

**Decision**: In `ModalOrchestrator`, `startWorkflowWithScope` is refactored to:
1. Call `startAgentRun()` (fire-and-forget — get only the `runId`)
2. Save a `RunRecord` to localStorage via `useRunStorage`
3. Call a new `onRunStarted(runId)` prop callback (replaces `onMappingReviewReady`)
4. Page.tsx responds by navigating to the Runs view

The `pollAgentRun` call is removed from `useWorkflowAgent.startWorkflow`. The hook's `startWorkflow` method only starts the run; it no longer blocks.

**What changes in `useWorkflowAgent`**:
- `startWorkflow` becomes a thin wrapper: generates the payload, calls `startAgentRun`, returns `runId`. No polling.
- `pollAgentRun` moves to `useRunsPolling` hook (used by RunsPage).
- `resumeWorkflow` is unchanged — it still calls `resumeWorkflowRun` then `pollAgentRun`. This blocking behavior is intentional for the post-review entry creation step.

---

## Decision 6: `resumeWorkflow` Cleanup

**Decision**: `resumeWorkflow` is extracted from `useWorkflowAgent` into a standalone service function `resumeAndPollWorkflow(sdk, runId, resumePayload): Promise<WorkflowRunResult>`. `ReviewPage` calls this directly from a local async handler. `useWorkflowAgent` is simplified to just `startWorkflow`.

**Rationale**: Both Page.tsx and ReviewPage.tsx currently instantiate `useWorkflowAgent` with stub `documentId`/`oauthToken` params just to get `resumeWorkflow`. The hook was never designed as a resume mechanism — it was incidental coupling. A plain async function is simpler, more testable, and eliminates the stub-param anti-pattern.

---

## Decision 7: Run Status Staleness for 404s

**Decision**: If `getWorkflowRun()` returns `null` (404), the run's display status is `'EXPIRED'`. This is a local-only status (not part of the `RunStatus` enum from the backend). The run row shows "Expired" in neutral/grey styling with a "Dismiss" action. No retry logic.

**Rationale**: A 404 on an agentRun is permanent — Contentful does not restore deleted runs. Retrying would confuse the user. Displaying "Expired" with a dismiss action is the cleanest UX per FR-015.

---

## Existing Code Reuse / No-Change Zones

The following files are **unchanged** by this rearchitecture:
- All `functions/oauth/` — OAuth app functions are untouched
- `useGoogleDriveOAuth` hook — OAuth flow is unaffected
- `entryService.ts` — entry creation logic is unchanged
- `referenceResolution.ts` — unchanged
- `richtext.ts` — unchanged
- `MappingView.tsx` and all child components — the mapping review UX is unchanged
- `ReviewPage.tsx` props interface changes minimally (adds `onRunCompleted` callback)
- All content type picker, tab picker, image picker modals — wizard step UX is unchanged
- `agents-api.ts` — no changes to API call functions; only callers change
