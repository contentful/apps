# Data Model: Async Import Runs

**Feature**: 001-async-import-runs
**Date**: 2026-07-16

---

## Entities

### RunRecord (localStorage)

Represents a single import attempt. Stored in localStorage; status is always fetched live.

```ts
interface RunRecord {
  runId: string;              // Contentful agentRun sys.id — the stable key
  documentTitle: string;      // Google Doc title; fallback to 'Untitled Document'
  documentId: string;         // Google Doc ID (for deep-links)
  contentTypeIds: string[];   // Content type IDs selected in the wizard
  startedAt: string;          // ISO 8601 — e.g. "2026-07-16T10:23:00.000Z"
  createdEntryIds?: string[]; // Written once, on successful entry creation
}
```

**Stored as**: JSON array at key `gdrive-import-runs::{spaceId}::{environmentId}`
**Ordering**: Array kept sorted by `startedAt` descending (newest first)
**Capacity**: Max 50 records; oldest are pruned when limit is exceeded
**Mutable fields**: Only `createdEntryIds` — written by `useRunStorage.markCompleted(runId, entryIds)`

---

### RunStatus (display-only, derived)

Not persisted. Derived on the Runs page by merging localStorage records with live backend data.

```ts
type DisplayStatus =
  | 'running'        // backend: IN_PROGRESS or DRAFT
  | 'needs-review'   // backend: PENDING_REVIEW
  | 'completed'      // backend: COMPLETED (or createdEntryIds present)
  | 'failed'         // backend: FAILED
  | 'expired'        // backend: 404 / run not found
  | 'loading';       // initial fetch in progress
```

---

### RunWithStatus (view model)

The merged view model consumed by the Runs page UI.

```ts
interface RunWithStatus extends RunRecord {
  displayStatus: DisplayStatus;
  errorMessage?: string;  // populated when displayStatus === 'failed'
}
```

---

## State Transitions

```
[wizard completes]
       │
       ▼
   'running'  ←─── backend: IN_PROGRESS / DRAFT
       │
       ├──────────────────────────────────────┐
       ▼                                      ▼
 'needs-review'                           'failed'
 (backend: PENDING_REVIEW)                (backend: FAILED)
       │                                      │
       │ user clicks Review                   │ user clicks Dismiss
       ▼                                      ▼
  [ReviewPage]                           [removed from list]
       │
       │ user creates entries
       ▼
  'completed'
  (createdEntryIds written to localStorage)

[any state] → 'expired'  if backend returns 404
[any state] → 'loading'  on initial page load or manual refresh
```

---

## Storage Layer: `useRunStorage` Hook

Central hook for all localStorage read/write operations. All other components interact with run records through this hook only.

**Interface**:
```ts
interface UseRunStorage {
  runs: RunRecord[];                          // sorted by startedAt desc
  addRun(record: RunRecord): void;            // prepends; prunes if >50
  removeRun(runId: string): void;             // used for dismiss on failed/expired
  markCompleted(runId: string, entryIds: string[]): void; // writes createdEntryIds
  storageError: string | null;               // non-null if localStorage unavailable
}
```

**Storage key**: `gdrive-import-runs::${spaceId}::${environmentId}` (passed to hook as init params)

---

## AppView State Machine

Replaces the `mappingReviewState !== null` binary toggle in `Page.tsx`.

```ts
type AppView =
  | { view: 'runs' }
  | { view: 'import' }
  | { view: 'review'; runId: string };
```

**Transitions**:
- App opens → `{ view: 'runs' }` (default home)
- User clicks "New Import" → `{ view: 'import' }`
- Wizard fires `onRunStarted(runId)` → `{ view: 'runs' }` (wizard closes, back to runs)
- User clicks "Review" on a PENDING_REVIEW run → `{ view: 'review', runId }`
- User exits review → `{ view: 'runs' }`

---

## New Files

| Path | Purpose |
|---|---|
| `src/hooks/useRunStorage.ts` | localStorage read/write for RunRecord array |
| `src/hooks/useRunsPolling.ts` | Polls backend status for all RunRecords; returns `Map<runId, DisplayStatus>` |
| `src/locations/Page/components/runs/RunsPage.tsx` | New home screen — list of all runs |
| `src/locations/Page/components/runs/RunRow.tsx` | Single run row with status badge + actions |
| `src/services/workflowService.ts` | `resumeAndPollWorkflow()` standalone function (extracted from useWorkflowAgent) |
| `src/types/runs.ts` | `RunRecord`, `DisplayStatus`, `RunWithStatus`, `AppView` types |

---

## Modified Files

| Path | What changes |
|---|---|
| `src/locations/Page/Page.tsx` | Replace `mappingReviewState` toggle with `AppView` state machine; add `useRunStorage`; wire `RunsPage` and `ReviewPage` to AppView transitions |
| `src/locations/Page/components/mainpage/ModalOrchestrator.tsx` | Replace blocking `startWorkflowWithScope` with fire-and-forget; add `onRunStarted` prop; remove `onMappingReviewReady`; store run record via `useRunStorage` |
| `src/hooks/useWorkflowAgent.ts` | `startWorkflow` returns `runId: string` only (no poll); remove `pollAgentRun` call from `startWorkflow`; `resumeWorkflow` removed (moved to `workflowService.ts`) |
| `src/locations/Page/components/review/ReviewPage.tsx` | Replace `useWorkflowAgent` stub instantiation with direct `resumeAndPollWorkflow` call; add `onRunCompleted(entryIds: string[])` prop; call it before `onExitReview` |
