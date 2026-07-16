# UI Contracts: Async Import Runs

**Feature**: 001-async-import-runs
**Date**: 2026-07-16

These contracts define the props interfaces and callback signatures for all new and modified components. They are the stable boundary between implementation units — changes here require updating all callers.

---

## New Components

### `RunsPage`

```ts
interface RunsPageProps {
  sdk: PageAppSDK;
  onNewImport: () => void;                      // navigates to import wizard
  onReviewRun: (runId: string) => void;         // navigates to review screen
}
```

**Renders**:
- Empty state when no runs exist (with "New Import" CTA)
- List of `RunRow` components sorted by `startedAt` descending
- "New Import" button always visible in header
- Auto-polls every 10s while any run has `displayStatus === 'running'`

---

### `RunRow`

```ts
interface RunRowProps {
  run: RunWithStatus;
  onReview: (runId: string) => void;    // emitted for 'needs-review' status
  onDismiss: (runId: string) => void;   // emitted for 'failed' or 'expired' status
}
```

**Renders per status**:

| Status | Badge | Actions |
|---|---|---|
| `loading` | Spinner | — |
| `running` | Blue "Running" + spinner | — |
| `needs-review` | Yellow "Needs Review" | "Review" button |
| `completed` | Green "Completed" | Links to created entries (one per `createdEntryId`) |
| `failed` | Red "Failed" | Error summary text + "Dismiss" button |
| `expired` | Grey "Expired" | "Dismiss" button |

---

## Modified Components

### `ModalOrchestrator` — changed props

**Removed**:
```ts
onMappingReviewReady: (payload: MappingReviewSuspendPayload, runId: string) => void;
```

**Added**:
```ts
onRunStarted: (runId: string) => void;     // fires after run is saved to localStorage
documentTitle?: string;                    // passed down from Google Picker selection
```

**`onRunStarted` contract**: By the time `onRunStarted` fires, the run record MUST already be written to localStorage (via `useRunStorage.addRun`). The caller (Page.tsx) can safely navigate to the Runs page immediately.

---

### `ReviewPage` — changed props

**Removed**:
```ts
// nothing removed from the public interface
```

**Added**:
```ts
onRunCompleted: (entryIds: string[]) => void; // fires before onExitReview; caller writes createdEntryIds to localStorage
```

**`onRunCompleted` contract**: Called synchronously after `createEntriesFromPreviewPayload` resolves successfully, before the SummaryModal is shown. The caller writes `createdEntryIds` to localStorage so the Runs page shows the completed state even if the user never clicks "Exit".

**Unchanged props**: `sdk`, `payload`, `runId`, `onCancelReview`, `onExitReview`

---

## New Hooks

### `useRunStorage`

```ts
function useRunStorage(spaceId: string, environmentId: string): UseRunStorage

interface UseRunStorage {
  runs: RunRecord[];
  addRun(record: RunRecord): void;
  removeRun(runId: string): void;
  markCompleted(runId: string, entryIds: string[]): void;
  storageError: string | null;
}
```

**Guarantees**:
- `runs` is always sorted by `startedAt` descending
- `addRun` is idempotent on `runId` (duplicate IDs are ignored)
- `addRun` prunes oldest record if length would exceed 50
- All writes are atomic (single `localStorage.setItem` call per operation)
- `storageError` is set to a user-readable message on any `localStorage` exception

---

### `useRunsPolling`

```ts
function useRunsPolling(
  runs: RunRecord[],
  sdk: PageAppSDK
): Map<string, DisplayStatus>
```

**Behavior**:
- On mount and when `runs` changes: fetches status for all runs in parallel via `getWorkflowRun()`
- Sets interval (10s) while any run has status `'running'`
- Clears interval when all runs are settled (completed / failed / expired / needs-review)
- Returns current `Map<runId, DisplayStatus>`; returns `'loading'` for any runId not yet fetched

---

## New Service Function

### `workflowService.ts`

```ts
export async function resumeAndPollWorkflow(
  sdk: PageAppSDK,
  runId: string,
  resumePayload: ResumePayload
): Promise<WorkflowRunResult>
```

Direct extraction from `useWorkflowAgent.resumeWorkflow`. Same semantics: calls `resumeWorkflowRun`, then polls until settled. Throws `WorkflowRunError` on failure.

---

## Modified Hook

### `useWorkflowAgent`

**Signature change**:
```ts
// Before
startWorkflow(contentTypeIds, documentSelection): Promise<WorkflowRunResult>

// After
startWorkflow(contentTypeIds, documentSelection): Promise<string>  // returns runId only
```

**Removed from return value**: `resumeWorkflow` (moved to `workflowService.ts`)
**Unchanged**: `isAnalyzing` (kept for loading state in ModalOrchestrator)

---

## AppView State (Page.tsx)

```ts
type AppView =
  | { view: 'runs' }
  | { view: 'import' }
  | { view: 'review'; runId: string };

// Default on mount:
const [appView, setAppView] = useState<AppView>({ view: 'runs' });
```

**Page.tsx render switch**:
```ts
switch (appView.view) {
  case 'runs':   return <RunsPage ... />;
  case 'import': return <MainPageView ... />;  // contains ModalOrchestrator
  case 'review': return <ReviewPage ... />;
}
```
