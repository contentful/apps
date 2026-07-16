# Implementation Plan: Async Import Runs

**Feature**: 001-async-import-runs
**Date**: 2026-07-16
**Spec**: [spec.md](./spec.md) | **Research**: [research.md](./research.md) | **Data Model**: [data-model.md](./data-model.md) | **Contracts**: [contracts/ui-contracts.md](./contracts/ui-contracts.md)

---

## Overview

The rearchitecture has 5 independent slices, each deliverable and testable on its own. Slices 1–3 are foundation (no UI yet). Slices 4–5 are the visible surfaces. The order minimizes integration surprise: storage and polling exist before any UI tries to use them; the wizard exit change is last because it depends on all the infrastructure being in place.

**Unchanged zones**: `functions/`, `useGoogleDriveOAuth`, `entryService.ts`, `referenceResolution.ts`, `richtext.ts`, `MappingView.tsx` and all sub-components, all modal step components inside `ModalOrchestrator`, `agents-api.ts`.

---

## Slice 1 — Types + Storage Foundation

**Goal**: Define all new types and the `useRunStorage` hook. No UI. TDD.

### Tasks

**TASK-101** — Add `src/types/runs.ts`

Create the file with:
```ts
export interface RunRecord {
  runId: string;
  documentTitle: string;
  documentId: string;
  contentTypeIds: string[];
  startedAt: string;
  createdEntryIds?: string[];
}

export type DisplayStatus =
  | 'loading'
  | 'running'
  | 'needs-review'
  | 'completed'
  | 'failed'
  | 'expired';

export interface RunWithStatus extends RunRecord {
  displayStatus: DisplayStatus;
  errorMessage?: string;
}

export type AppView =
  | { view: 'runs' }
  | { view: 'import' }
  | { view: 'review'; runId: string };
```

No test needed (pure types).

---

**TASK-102** — Add `src/hooks/useRunStorage.ts`

Implement `useRunStorage(spaceId: string, environmentId: string)`.

Storage key: `` `gdrive-import-runs::${spaceId}::${environmentId}` ``

State: `RunRecord[]` in React state, initialized from localStorage on mount.

`addRun(record)`:
- Ignore if `runId` already exists (idempotency)
- Prepend to array
- Prune to 50 records (drop oldest = last element)
- Write updated array to localStorage
- If `localStorage.setItem` throws, set `storageError`

`removeRun(runId)`:
- Filter out the record; write to localStorage

`markCompleted(runId, entryIds)`:
- Find the record, spread `{ createdEntryIds: entryIds }`, write to localStorage

`storageError: string | null`:
- Set to human-readable message on any localStorage exception

**Tests** — `test/hooks/useRunStorage.test.ts`:
- `addRun` persists to localStorage and updates `runs` state
- `addRun` is idempotent on duplicate `runId`
- `addRun` prunes to 50 when at capacity
- `removeRun` removes the correct record
- `markCompleted` writes `createdEntryIds` without overwriting other fields
- Initializes from existing localStorage data on mount
- Sets `storageError` when `localStorage.setItem` throws (mock localStorage)
- Key is scoped by spaceId + environmentId (two instances with different params don't share data)

---

**TASK-103** — Add `src/services/workflowService.ts`

Extract `resumeAndPollWorkflow` from `useWorkflowAgent`:

```ts
export async function resumeAndPollWorkflow(
  sdk: PageAppSDK,
  runId: string,
  resumePayload: ResumePayload
): Promise<WorkflowRunResult>
```

Internal: calls `resumeWorkflowRun(sdk, spaceId, environmentId, runId, resumePayload)` then `pollAgentRun(sdk, spaceId, environmentId, runId)`. The `pollAgentRun` function is moved/copied here from `useWorkflowAgent`.

Move `pollAgentRun`, `getWorkflowRunResult`, `getRunStatus`, `WorkflowRunError` (if not already in types) into `workflowService.ts` or a shared `src/utils/workflowUtils.ts`. `useWorkflowAgent` imports them from there.

**Tests** — `test/services/workflowService.test.ts`:
- Calls `resumeWorkflowRun` with correct args
- Calls `pollAgentRun` after resume
- Returns `WorkflowRunResult` on success
- Throws `WorkflowRunError` on failure

---

## Slice 2 — Polling Hook

**Goal**: `useRunsPolling` hook. Depends on Slice 1 types and `agents-api.ts`.

### Tasks

**TASK-201** — Add `src/hooks/useRunsPolling.ts`

```ts
function useRunsPolling(runs: RunRecord[], sdk: PageAppSDK): Map<string, DisplayStatus>
```

Implementation:
1. `statusMap` state: `Map<string, DisplayStatus>` initialized with all runIds as `'loading'`
2. `fetchAllStatuses()`: calls `getWorkflowRun()` for each run in parallel (`Promise.all`). Maps backend `RunStatus` → `DisplayStatus`:
   - `IN_PROGRESS` | `DRAFT` → `'running'`
   - `PENDING_REVIEW` → `'needs-review'`
   - `COMPLETED` → `'completed'`
   - `FAILED` → `'failed'`
   - `null` (404) → `'expired'`
3. On mount: call `fetchAllStatuses()`
4. `useEffect` with interval: if any current status is `'running'`, set 10s interval calling `fetchAllStatuses()`. Clear interval when no runs are `'running'`.
5. Re-run effect when `runs` array length changes (new run added).

Also return `errorMap: Map<string, string>` for failed runs' error messages (from `runData.metadata.workflowFailure`).

**Tests** — `test/hooks/useRunsPolling.test.ts`:
- Maps `IN_PROGRESS` → `'running'`, `PENDING_REVIEW` → `'needs-review'`, etc.
- Sets all unresolved runIds to `'loading'` initially
- Maps null response (404) → `'expired'`
- Sets up polling interval when any run is `'running'`
- Clears interval when all runs settle
- Fetches in parallel (all `getWorkflowRun` calls made before any await resolves)

---

## Slice 3 — Refactor `useWorkflowAgent` + `ModalOrchestrator` exit

**Goal**: Make the wizard exit async. Depends on Slices 1 + 2.

### Tasks

**TASK-301** — Refactor `src/hooks/useWorkflowAgent.ts`

Changes:
- `startWorkflow` returns `Promise<string>` (just the `runId`) — remove `pollAgentRun` call from it
- Remove `resumeWorkflow` from the hook (it moves to `workflowService.ts`)
- `pollAgentRun` is still called internally by... actually it no longer needs to be in this hook. Simplify: `startWorkflow` calls `startAgentRun` and returns the `runId`. That's it. The hook now only exposes `{ isAnalyzing, startWorkflow }`.
- Keep `isAnalyzing` for the loading spinner in `ModalOrchestrator`.

**Tests** — update `test/hooks/useWorkflowAgent.test.ts` (if it exists) or add one:
- `startWorkflow` calls `startAgentRun` and returns its result as `runId`
- `startWorkflow` does NOT call `pollAgentRun`
- `isAnalyzing` is `true` during `startWorkflow` and `false` after

---

**TASK-302** — Refactor `src/locations/Page/components/mainpage/ModalOrchestrator.tsx`

Changes:
1. Add `onRunStarted: (runId: string) => void` prop
2. Remove `onMappingReviewReady` prop
3. Add `documentTitle?: string` prop (passed from Google Picker result — `SelectDocumentModal` already has the doc title from the picker response; thread it up)
4. Add `useRunStorage` usage: inject `spaceId`/`environmentId` from `sdk.ids` and call `addRun` after `startWorkflow` resolves
5. `startWorkflowWithScope` refactored:
   ```ts
   const startWorkflowWithScope = async (contentTypeIds, documentSelection) => {
     setFlowStep(FlowStep.LOADING);
     try {
       const runId = await startWorkflow(contentTypeIds, documentSelection);
       addRun({
         runId,
         documentTitle: documentTitle ?? 'Untitled Document',
         documentId,
         contentTypeIds,
         startedAt: new Date().toISOString(),
       });
       setFlowStep(null);
       onRunStarted(runId);
     } catch (err) {
       handleWorkflowError(err);
     }
   };
   ```
6. Remove `handleWorkflowResult` (the PENDING_REVIEW branching is gone — polling determines that now)
7. Remove dead state: `activeRunId` (was never read)
8. Keep `FlowStep.LOADING` spinner during the `startAgentRun` call (still ~1-2 seconds to register the run)

**Tests** — update `test/locations/Page/components/mainpage/ModalOrchestrator.spec.tsx`:
- On wizard completion, calls `addRun` with correct RunRecord fields
- On wizard completion, calls `onRunStarted(runId)`
- Does NOT call `onMappingReviewReady` (removed)
- Shows loading spinner during `startWorkflow`
- On `startWorkflow` error, shows error modal (existing error path)
- If `storageError` is set (localStorage unavailable), shows error to user before proceeding

---

## Slice 4 — `RunsPage` + `RunRow` UI

**Goal**: The Runs page home screen. Depends on Slices 1 + 2.

### Tasks

**TASK-401** — Add `src/locations/Page/components/runs/RunRow.tsx`

Single run row using F36 components. Displays:
- Document title (bold)
- Content type IDs (comma-separated, or truncated if >3)
- `startedAt` formatted as relative time ("2 hours ago") or absolute date if >24h
- Status badge using F36 `Badge` component with appropriate `variant`:
  - `loading` → spinner (no badge)
  - `running` → `Badge variant="primary"` + `Spinner` (small)
  - `needs-review` → `Badge variant="warning"` "Needs Review"
  - `completed` → `Badge variant="positive"` "Completed"
  - `failed` → `Badge variant="negative"` "Failed"
  - `expired` → `Badge variant="secondary"` "Expired"
- Actions per status (see contracts/ui-contracts.md)
- For `completed`: render one `TextLink` per `createdEntryId` pointing to the entry in Contentful web app (`https://app.contentful.com/spaces/{spaceId}/entries/{entryId}`)
- For `failed`: render `errorMessage` in a small `Note variant="negative"` collapsed by default with a "Show details" toggle

**Tests** — `test/locations/Page/components/runs/RunRow.spec.tsx`:
- Renders document title
- Renders correct badge per status
- "Review" button present for `needs-review`, calls `onReview`
- "Dismiss" button present for `failed`/`expired`, calls `onDismiss`
- Entry links rendered for `completed` with correct URLs
- Error message rendered for `failed`

---

**TASK-402** — Add `src/locations/Page/components/runs/RunsPage.tsx`

```ts
interface RunsPageProps {
  sdk: PageAppSDK;
  onNewImport: () => void;
  onReviewRun: (runId: string) => void;
}
```

Implementation:
1. Call `useRunStorage(sdk.ids.space, sdk.ids.environment)` to get `runs`
2. Call `useRunsPolling(runs, sdk)` to get `statusMap`
3. Merge into `RunWithStatus[]` for rendering
4. Call `removeRun` on dismiss
5. Show `storageError` as a `Note variant="negative"` if set

**Empty state**: F36 `EmptyState` or equivalent — "No imports yet" with a "Start your first import" button calling `onNewImport`.

**Header**: "Import Runs" heading + "New Import" `Button variant="primary"` (always visible).

**Tests** — `test/locations/Page/components/runs/RunsPage.spec.tsx`:
- Renders empty state when `runs` is empty
- Renders a `RunRow` per run
- Clicking "New Import" calls `onNewImport`
- Clicking "Review" on a needs-review run calls `onReviewRun(runId)`
- Clicking "Dismiss" on a failed run calls `removeRun` and the row disappears
- Storage error note shown when `storageError` is set
- Polling is active when a `running` run exists (mock `useRunsPolling`)

---

## Slice 5 — Wire Everything in `Page.tsx` + `ReviewPage` callback

**Goal**: Plug all the pieces together. This is the integration slice. Depends on all prior slices.

### Tasks

**TASK-501** — Refactor `src/locations/Page/Page.tsx`

Replace entire state model:

```ts
// Remove:
const [mappingReviewState, setMappingReviewState] = useState<...>(null);
const { resumeWorkflow } = useWorkflowAgent({ sdk, documentId: '', oauthToken: '' }); // stub

// Add:
const [appView, setAppView] = useState<AppView>({ view: 'runs' });
const { runs, addRun, removeRun, markCompleted, storageError } =
  useRunStorage(sdk.ids.space, sdk.ids.environment);
```

Callbacks:
```ts
const handleRunStarted = (runId: string) => setAppView({ view: 'runs' });
const handleReviewRun = (runId: string) => setAppView({ view: 'review', runId });
const handleExitReview = () => setAppView({ view: 'runs' });
const handleRunCompleted = (runId: string, entryIds: string[]) => markCompleted(runId, entryIds);
const handleCancelReview = async (runId?: string) => {
  if (runId) await resumeAndPollWorkflow(sdk, runId, { cancelled: true });
  setAppView({ view: 'runs' });
};
```

Render switch:
```tsx
if (aiAccessDeniedMessage) return <Note ...>{aiAccessDeniedMessage}</Note>;

switch (appView.view) {
  case 'runs':
    return (
      <RunsPage
        sdk={sdk}
        onNewImport={() => setAppView({ view: 'import' })}
        onReviewRun={handleReviewRun}
      />
    );
  case 'import':
    return (
      <MainPageView
        sdk={sdk}
        oauthProps={...}
        modalRef={modalOrchestratorRef}
      />
      // ModalOrchestrator inside MainPageView receives:
      //   onRunStarted={handleRunStarted}
    );
  case 'review':
    return (
      <ReviewPage
        sdk={sdk}
        payload={/* fetched from backend on render — see TASK-502 */}
        runId={appView.runId}
        onCancelReview={() => handleCancelReview(appView.runId)}
        onExitReview={handleExitReview}
        onRunCompleted={(entryIds) => handleRunCompleted(appView.runId, entryIds)}
      />
    );
}
```

Note on `ReviewPage` payload fetch: When navigating to `review` view, `Page.tsx` needs the `MappingReviewSuspendPayload`. Add a loading state in `ReviewPage` itself: on mount with `runId` but no `payload` prop, fetch via `getWorkflowRun()` and render a spinner until it resolves. This keeps `Page.tsx` clean — it passes `runId` only, not the payload.

Alternatively (simpler): `Page.tsx` manages a `pendingReviewPayload` state, fetches it when `appView.view === 'review'`, and renders a loading screen until it has it. Either approach is valid — prefer whatever makes `ReviewPage` easier to test (probably keeping the fetch in `Page.tsx` since `ReviewPage` already has complex state).

**Tests** — update `test/locations/Page/Page.spec.tsx`:
- Renders `RunsPage` by default on mount
- `onNewImport` callback transitions to import view
- `onRunStarted` callback transitions back to runs view
- `onReviewRun` callback transitions to review view
- `onExitReview` callback transitions back to runs view
- `onRunCompleted` calls `markCompleted` with correct args
- `aiAccessDeniedMessage` blocks all views (existing test)

---

**TASK-502** — Update `src/locations/Page/components/review/ReviewPage.tsx`

Changes:
1. Add `onRunCompleted: (entryIds: string[]) => void` prop
2. Replace `useWorkflowAgent` stub with direct `resumeAndPollWorkflow` import
3. Call `onRunCompleted(createdEntries.map(e => e.sys.id))` inside `handleCreateEntries` after `createEntriesFromPreviewPayload` resolves and before `setIsSummaryModalOpen(true)`
4. Add optional payload fetch: if a `runId` is present but `payload` is loaded lazily, handle that state (see TASK-501 discussion)
5. Remove the stub `useWorkflowAgent({ sdk, documentId: '', oauthToken: '' })` instantiation

**Tests** — update `test/locations/Page/components/review/ReviewPage.spec.tsx`:
- `onRunCompleted` called with correct entry IDs after successful creation
- `resumeAndPollWorkflow` called (not the old hook) on "Create selected entries"

---

## Slice 6 — Cleanup

**TASK-601** — Remove dead code from `useWorkflowAgent.ts`
- Remove `resumeWorkflow` (moved to `workflowService.ts`)
- Remove `isAnalyzing` if no longer consumed
- Remove `pollAgentRun` from this file (it lives in `workflowService.ts` now, or `workflowUtils.ts`)

**TASK-602** — Verify all existing tests still pass (`npm test`)

**TASK-603** — Manual smoke test per the CLAUDE.md sprite workflow:
- Start an import → verify redirect to Runs page
- Runs page shows "Running" status
- Status updates to "Needs Review" when agent settles
- Click Review → Review screen loads
- Create entries → status updates to "Completed" with entry links
- Start two concurrent imports → both appear independently

---

## File Inventory

### New Files
```
src/types/runs.ts
src/hooks/useRunStorage.ts
src/hooks/useRunsPolling.ts
src/services/workflowService.ts
src/locations/Page/components/runs/RunsPage.tsx
src/locations/Page/components/runs/RunRow.tsx
test/hooks/useRunStorage.test.ts
test/hooks/useRunsPolling.test.ts
test/services/workflowService.test.ts
test/locations/Page/components/runs/RunsPage.spec.tsx
test/locations/Page/components/runs/RunRow.spec.tsx
```

### Modified Files
```
src/types/workflow.ts                          (no change — all types stay)
src/hooks/useWorkflowAgent.ts                 (startWorkflow return type; remove resumeWorkflow)
src/services/agents-api.ts                    (no change)
src/locations/Page/Page.tsx                   (AppView state machine; new callbacks)
src/locations/Page/components/mainpage/ModalOrchestrator.tsx  (async exit; new props)
src/locations/Page/components/review/ReviewPage.tsx           (onRunCompleted; remove hook stub)
test/locations/Page/Page.spec.tsx             (update for new state model)
test/locations/Page/components/mainpage/ModalOrchestrator.spec.tsx  (update for new props)
test/locations/Page/components/review/ReviewPage.spec.tsx     (update for onRunCompleted)
```

### Untouched Files
```
functions/                      (all OAuth handlers)
src/hooks/useGoogleDriveOAuth.ts
src/services/entryService.ts
src/services/referenceResolution.ts
src/services/richtext.ts
src/locations/Page/components/review/mapping/  (all)
src/locations/Page/components/mainpage/SelectDocumentModal.tsx
src/locations/Page/components/mainpage/ContentTypePickerModal.tsx
src/locations/Page/components/mainpage/SelectTabsModal.tsx
src/locations/Page/components/mainpage/IncludeImagesModal.tsx
src/locations/Page/components/mainpage/LoadingModal.tsx
src/locations/Page/components/mainpage/ErrorModal.tsx
src/locations/Page/components/mainpage/ConfirmCancelModal.tsx
src/locations/Page/components/mainpage/OAuthConnector.tsx
src/locations/Page/components/mainpage/MainPageView.tsx
src/locations/ConfigScreen/
src/App.tsx
src/index.tsx
```

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `sdk.cma.agentRun.get()` doesn't return `suspendPayload` on re-fetch | Medium | High | Test in dev with a real PENDING_REVIEW run before building ReviewPage load path |
| localStorage quota exceeded on large suspend payloads | Low | Medium | Spec says payloads are NOT stored in localStorage — only RunRecord metadata (~400B each) |
| `PENDING_REVIEW` runs never poll (polling stops on settle) | None | High | Research Decision 4 explicitly addresses this: `PENDING_REVIEW` is stable, no polling needed |
| Two tabs writing `addRun` simultaneously | Low | Low | Last write wins — one run may be lost if both tabs add at exactly the same millisecond; acceptable per spec |
| Google Picker doesn't return `documentTitle` | Medium | Low | Fall back to `'Untitled Document'`; the title is cosmetic |
