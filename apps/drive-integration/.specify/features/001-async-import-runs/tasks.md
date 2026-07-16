# Tasks: Async Import Runs

**Input**: Design documents from `.specify/features/001-async-import-runs/`
**Prerequisites**: plan.md ✅ spec.md ✅ data-model.md ✅ contracts/ui-contracts.md ✅ research.md ✅

**Approach**: Red/Green TDD per project CLAUDE.md — write failing tests first, then implement.

**Organization**: Tasks grouped by user story. Foundation phase (Slices 1–2) blocks all user stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)

---

## Phase 1: Setup (Scaffolding)

**Purpose**: Create all new files and directories so parallel work can begin.

- [ ] T001 Create `src/types/runs.ts` (empty exports as scaffold)
- [ ] T002 Create `src/hooks/useRunStorage.ts` (empty export as scaffold)
- [ ] T003 [P] Create `src/hooks/useRunsPolling.ts` (empty export as scaffold)
- [ ] T004 [P] Create `src/services/workflowService.ts` (empty export as scaffold)
- [ ] T005 [P] Create `src/locations/Page/components/runs/` directory with empty `RunsPage.tsx` and `RunRow.tsx`
- [ ] T006 [P] Create `test/hooks/` directory
- [ ] T007 [P] Create `test/locations/Page/components/runs/` directory

**Checkpoint**: Directory structure exists — parallel foundation work can begin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data layer, storage, polling, and service extraction that ALL user stories depend on. No user story can be worked until this phase is complete.

**⚠️ CRITICAL**: Phases 3–7 are blocked until this phase is complete.

### Types

- [ ] T008 [P] Define `RunRecord`, `DisplayStatus`, `RunWithStatus`, `AppView` types in `src/types/runs.ts` per data-model.md

### `useRunStorage` — TDD

- [ ] T009 [P] Write failing tests for `useRunStorage` in `test/hooks/useRunStorage.test.ts`: addRun persists + updates state, addRun idempotent on duplicate runId, addRun prunes to 50 records, removeRun removes correct record, markCompleted writes createdEntryIds, initializes from existing localStorage on mount, sets storageError on localStorage exception, key scoped by spaceId+environmentId
- [ ] T010 Implement `useRunStorage(spaceId, environmentId)` in `src/hooks/useRunStorage.ts` — localStorage key `gdrive-import-runs::${spaceId}::${environmentId}`, RunRecord[] state, addRun/removeRun/markCompleted/storageError per contracts/ui-contracts.md (depends on T008, T009)

### `workflowService.ts` — TDD

- [ ] T011 [P] Write failing tests for `resumeAndPollWorkflow` in `test/services/workflowService.test.ts`: calls resumeWorkflowRun with correct args, calls pollAgentRun after resume, returns WorkflowRunResult on success, throws WorkflowRunError on failure
- [ ] T012 Extract `resumeAndPollWorkflow(sdk, runId, resumePayload)` into `src/services/workflowService.ts` — move pollAgentRun, getWorkflowRunResult, getRunStatus logic from `src/hooks/useWorkflowAgent.ts` into this file; re-export from useWorkflowAgent for backward compat during transition (depends on T011)

### `useRunsPolling` — TDD

- [ ] T013 [P] Write failing tests for `useRunsPolling` in `test/hooks/useRunsPolling.test.ts`: maps IN_PROGRESS→'running', PENDING_REVIEW→'needs-review', COMPLETED→'completed', FAILED→'failed', null(404)→'expired'; initializes all runIds as 'loading'; sets up 10s polling interval when any run is 'running'; clears interval when all runs settled; fetches all runs in parallel
- [ ] T014 Implement `useRunsPolling(runs, sdk)` in `src/hooks/useRunsPolling.ts` — parallel Promise.all fetch via getWorkflowRun(), Map<runId, DisplayStatus> state, 10s interval while any 'running', stops when all settled; also returns errorMap: Map<string, string> for failed run error messages (depends on T008, T013)

### `useWorkflowAgent` refactor — TDD

- [ ] T015 [P] Write failing tests for refactored `useWorkflowAgent` in `test/hooks/useWorkflowAgent.test.ts` (or update existing): startWorkflow calls startAgentRun and returns runId string only; startWorkflow does NOT call pollAgentRun; isAnalyzing is true during startWorkflow and false after
- [ ] T016 Refactor `src/hooks/useWorkflowAgent.ts`: change startWorkflow to return `Promise<string>` (runId only, no poll); remove resumeWorkflow from hook (it now lives in workflowService.ts); keep isAnalyzing (depends on T012, T015)

**Checkpoint**: Foundation complete — storage, polling, service extraction, and workflow hook refactor all tested and passing. User story phases can now begin.

---

## Phase 3: User Story 1 — Start Import and See It Tracked (Priority: P1) 🎯 MVP

**Goal**: Wizard fires off the agent run, saves to localStorage, redirects to Runs page immediately. No more 20-minute blocking spinner.

**Independent Test**: Complete the wizard (mock agentRun start), verify a RunRecord appears in localStorage with correct fields, and verify the `onRunStarted` callback fires with the correct runId — no polling or UI rendering required.

### ModalOrchestrator refactor — TDD

- [ ] T017 [P] [US1] Write failing tests for refactored ModalOrchestrator in `test/locations/Page/components/mainpage/ModalOrchestrator.spec.tsx`: on wizard completion calls addRun with correct RunRecord fields (runId, documentTitle, documentId, contentTypeIds, startedAt); calls onRunStarted(runId); does NOT call onMappingReviewReady (removed); shows loading spinner during startWorkflow; shows error modal on startWorkflow failure; shows error note when storageError is set before proceeding
- [ ] T018 [US1] Refactor `src/locations/Page/components/mainpage/ModalOrchestrator.tsx`: add `onRunStarted: (runId: string) => void` prop; remove `onMappingReviewReady` prop; add `documentTitle?: string` prop (thread from Google Picker result); integrate `useRunStorage` (inject spaceId/environmentId from sdk.ids); refactor `startWorkflowWithScope` to fire-and-forget (call startWorkflow → addRun → onRunStarted); remove handleWorkflowResult and PENDING_REVIEW branching; remove dead activeRunId state (depends on T010, T016, T017)

**Checkpoint**: Wizard completes async. RunRecord written to localStorage. onRunStarted fires. User Story 1 independently verifiable.

---

## Phase 4: User Story 2 — Runs Page Home View (Priority: P1)

**Goal**: Runs page is the new home screen showing all imports with live status, a "New Import" button, and 10s auto-refresh while any run is in-flight.

**Independent Test**: Seed localStorage with 3 RunRecords (statuses: running, needs-review, completed), render RunsPage, verify all 3 rows appear with correct badges and actions, verify "New Import" button calls onNewImport, verify polling interval is active.

### RunRow component — TDD

- [ ] T019 [P] [US2] Write failing tests for `RunRow` in `test/locations/Page/components/runs/RunRow.spec.tsx`: renders document title; renders correct F36 Badge per DisplayStatus (loading=spinner, running=primary+spinner, needs-review=warning, completed=positive, failed=negative, expired=secondary); "Review" button present for needs-review, calls onReview(runId); "Dismiss" button present for failed/expired, calls onDismiss(runId); entry links rendered for completed with correct Contentful web app URLs; error message rendered for failed
- [ ] T020 [P] [US2] Implement `src/locations/Page/components/runs/RunRow.tsx`: RunWithStatus + onReview + onDismiss props per contracts/ui-contracts.md; F36 Badge, Button, TextLink, Note components; entry links as `https://app.contentful.com/spaces/${spaceId}/entries/${entryId}`; format startedAt as relative time (<24h) or absolute date (depends on T008, T019)

### RunsPage component — TDD

- [ ] T021 [P] [US2] Write failing tests for `RunsPage` in `test/locations/Page/components/runs/RunsPage.spec.tsx`: renders empty state when no runs with "Start your first import" CTA; renders RunRow per run record; "New Import" button always visible calls onNewImport; clicking Review on needs-review run calls onReviewRun(runId); clicking Dismiss on failed run calls removeRun and row disappears; storageError Note shown when storageError set; polling hook active when running run exists
- [ ] T022 [US2] Implement `src/locations/Page/components/runs/RunsPage.tsx`: call useRunStorage + useRunsPolling; merge into RunWithStatus[] for rendering; handle removeRun on dismiss; empty state with F36 EmptyState; "Import Runs" heading + "New Import" Button always visible; storageError Note (depends on T010, T014, T020, T021)

**Checkpoint**: Runs page fully functional — shows all runs, live status, New Import button, dismiss. User Stories 1 + 2 independently verifiable.

---

## Phase 5: User Story 3 — Review a Completed AI Analysis (Priority: P2)

**Goal**: "Review" button on a needs-review run opens the mapping review screen. Entry creation updates the run to Completed with entry links.

**Independent Test**: Seed a RunRecord with needs-review status; click Review; verify ReviewPage loads with correct payload (fetched via getWorkflowRun mock); approve mappings; verify onRunCompleted fires with entry IDs and run transitions to completed in localStorage.

### ReviewPage update — TDD

- [ ] T023 [P] [US3] Write failing tests for updated `ReviewPage` in `test/locations/Page/components/review/ReviewPage.spec.tsx`: onRunCompleted called with correct entry IDs after successful creation; resumeAndPollWorkflow called (not useWorkflowAgent hook) on "Create selected entries"; onRunCompleted fires before SummaryModal opens
- [ ] T024 [US3] Update `src/locations/Page/components/review/ReviewPage.tsx`: add `onRunCompleted: (entryIds: string[]) => void` prop; replace `useWorkflowAgent` stub instantiation with direct `resumeAndPollWorkflow` import from workflowService.ts; call `onRunCompleted(entries.map(e => e.sys.id))` inside handleCreateEntries after createEntriesFromPreviewPayload resolves (depends on T012, T023)

### Page.tsx wiring — TDD

- [ ] T025 [P] [US3] Write failing tests for updated `Page.tsx` in `test/locations/Page/Page.spec.tsx`: renders RunsPage by default on mount; onNewImport transitions to import view; onRunStarted transitions back to runs view; onReviewRun transitions to review view; onExitReview transitions back to runs view; onRunCompleted calls markCompleted with correct args; aiAccessDeniedMessage blocks all views; payload loading spinner shown while fetching suspendPayload for review view
- [ ] T026 [US3] Refactor `src/locations/Page/Page.tsx`: replace `mappingReviewState` toggle with `AppView` state machine (`{ view: 'runs' } | { view: 'import' } | { view: 'review', runId: string }`); remove `useWorkflowAgent` stub instantiation; add `useRunStorage`; add `pendingReviewPayload` state with fetch-on-review-nav via getWorkflowRun; implement handleRunStarted, handleReviewRun, handleExitReview, handleRunCompleted, handleCancelReview callbacks; render switch over AppView (depends on T010, T018, T022, T024, T025)

**Checkpoint**: Full end-to-end async import flow works — start → runs page → review → create entries → completed. User Stories 1, 2, 3 all independently verifiable.

---

## Phase 6: User Story 4 — Handle Failed Runs (Priority: P3)

**Goal**: Failed runs show a human-readable error summary and can be dismissed from the list.

**Independent Test**: Seed a RunRecord with FAILED backend status and a workflowFailure message; render RunsPage; verify "Failed" badge and error summary visible; click Dismiss; verify run removed from list and localStorage.

> **Note**: RunRow already handles `failed` display status (built in Phase 4, T019–T020). This phase adds the error message extraction from `useRunsPolling`'s `errorMap` and wires it into `RunWithStatus`.

- [ ] T027 [P] [US4] Write failing tests for error propagation: useRunsPolling returns error message from runData.metadata.workflowFailure for FAILED runs; RunRow renders workflowFailure message in collapsed Note for failed status; Dismiss removes the run and updates localStorage
- [ ] T028 [US4] Wire error messages in `src/hooks/useRunsPolling.ts`: extract `runData.metadata.workflowFailure` into `errorMap: Map<string, string>`; pass human-readable failure reason string (map WorkflowFailureReason enum to user-facing strings) (depends on T014, T027)
- [ ] T029 [US4] Wire `errorMap` into RunsPage → RunWithStatus in `src/locations/Page/components/runs/RunsPage.tsx`: merge errorMap into RunWithStatus.errorMessage; confirm RunRow renders it (depends on T022, T028)

**Checkpoint**: Failed runs show meaningful error messages. User Stories 1–4 independently verifiable.

---

## Phase 7: User Story 5 — Multiple Concurrent Imports (Priority: P3)

**Goal**: Multiple runs can be in-flight simultaneously with independent statuses. This emerges from the data model — no special orchestration needed.

**Independent Test**: Call addRun twice with different runIds; render RunsPage; verify both rows appear with independent statuses; mock one transitioning to needs-review and verify the other is unaffected.

> **Note**: Concurrency support is inherent in the array-based localStorage model (Slice 1) and the parallel polling in useRunsPolling (Slice 2). This phase is primarily integration verification and edge case hardening.

- [ ] T030 [P] [US5] Write failing tests for concurrent run scenarios: two runs with different statuses render independently; one run transitioning status does not affect the other; addRun idempotency under rapid successive calls; polling fetches all runs in parallel (Promise.all fires all before any await)
- [ ] T031 [US5] Verify concurrent behavior in `src/hooks/useRunsPolling.ts` and `src/hooks/useRunStorage.ts` — fix any identified concurrency issues from T030; ensure statusMap updates are atomic (replace full map, not patch individual keys) (depends on T010, T014, T030)

**Checkpoint**: All 5 user stories independently verifiable and working together.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Dead code removal, smoke test, and final validation.

- [ ] T032 [P] Remove dead code from `src/hooks/useWorkflowAgent.ts`: remove isAnalyzing if no longer consumed by any component; remove any remaining pollAgentRun references now fully in workflowService.ts
- [ ] T033 [P] Remove dead code from `src/locations/Page/components/mainpage/ModalOrchestrator.tsx`: confirm activeRunId state and onResetToMain prop are still needed or remove; clean up unused imports
- [ ] T034 Run full test suite (`npm test`) — all tests must pass with no regressions
- [ ] T035 Smoke test per CLAUDE.md sprite workflow: start import → verify redirect to Runs page with 'Running' status; wait for 'Needs Review'; click Review → verify payload loads; create entries → verify 'Completed' with entry links; start two concurrent imports → verify both appear independently; clear localStorage → verify empty state
- [ ] T036 [P] Verify TypeScript compiles with no errors (`npm run build` or `tsc --noEmit`)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)         → no dependencies
Phase 2 (Foundation)    → depends on Phase 1 — BLOCKS all user story phases
Phase 3 (US1)           → depends on Phase 2 (useRunStorage, useWorkflowAgent refactor)
Phase 4 (US2)           → depends on Phase 2 (useRunStorage, useRunsPolling)
Phase 5 (US3)           → depends on Phase 3 (ModalOrchestrator), Phase 4 (RunsPage)
Phase 6 (US4)           → depends on Phase 4 (RunRow already built), Phase 2 (useRunsPolling errorMap)
Phase 7 (US5)           → depends on Phase 2 (storage + polling foundation)
Phase 8 (Polish)        → depends on all user story phases
```

### User Story Dependencies

| Story | Depends On | Can Start After |
|---|---|---|
| US1 (P1) | Phase 2 complete | T016 merged |
| US2 (P1) | Phase 2 complete | T014 merged |
| US3 (P2) | US1 + US2 both complete | T022 + T018 merged |
| US4 (P3) | Phase 2 + US2 RunRow built | T022 merged |
| US5 (P3) | Phase 2 complete | T014 merged |

### Within Each Phase

- Tests (T-odd scaffold): write FIRST, ensure they FAIL before implementing
- T008 (types) must land before any hook/component that imports from `src/types/runs.ts`
- T012 (workflowService) must land before T016 (useWorkflowAgent refactor) and T024 (ReviewPage)
- T010 (useRunStorage) must land before T018 (ModalOrchestrator) and T022 (RunsPage)
- T014 (useRunsPolling) must land before T022 (RunsPage)

### Parallel Opportunities

**Phase 2 can parallelize**:
- T009 + T011 + T013 + T015 (all test-writing tasks) run fully in parallel
- T010 + T012 run in parallel (different files, T008 must land first)
- T014 runs in parallel with T016 (different files)

**Phase 3 + Phase 4 can run in parallel** (different files, both only need Phase 2):
- Developer A: T017 → T018 (ModalOrchestrator)
- Developer B: T019 → T020 → T021 → T022 (RunRow + RunsPage)

---

## Parallel Example: Foundation (Phase 2)

```
After T008 (types) lands:

Parallel track A (storage):
  T009 → T010 (useRunStorage test → impl)

Parallel track B (service):
  T011 → T012 (workflowService test → impl)

Parallel track C (polling):
  T013 → T014 (useRunsPolling test → impl)

Parallel track D (workflow hook):
  T015 → T016 (useWorkflowAgent test → refactor)
```

## Parallel Example: User Stories 1 + 2 (Phases 3 + 4)

```
After Phase 2 complete:

Parallel track A (US1):
  T017 → T018 (ModalOrchestrator tests → refactor)

Parallel track B (US2):
  T019 → T020 (RunRow tests → impl)
  T021 → T022 (RunsPage tests → impl, depends on T020)
```

---

## Implementation Strategy

### MVP (User Stories 1 + 2 only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundation — T008 → [T009, T011, T013, T015] → [T010, T012, T014, T016]
3. Complete Phase 3: US1 — T017 → T018
4. Complete Phase 4: US2 — T019 → T020 → T021 → T022
5. **STOP and VALIDATE**: Wizard exits async, Runs page shows live status
6. US3 wires it all together (Phase 5)

### Incremental Delivery

1. Phase 1+2 (Foundation) → core data layer ready
2. Phase 3 (US1) → async wizard exit
3. Phase 4 (US2) → Runs page home
4. Phase 5 (US3) → review flow reconnected
5. Phase 6 (US4) → failed run UX
6. Phase 7 (US5) → concurrency validated
7. Phase 8 (Polish) → cleanup + smoke test

---

## Notes

- [P] = different files, no dependency conflicts — safe to parallelize
- Story labels map to spec.md: US1=Story1, US2=Story2, US3=Story3, US4=Story4, US5=Story5
- TDD: every implementation task has a paired test task that must be written and FAILING first
- `src/types/runs.ts` (T008) is a shared dependency — land it before any parallel foundation work
- Do not store `MappingReviewSuspendPayload` in localStorage — re-fetch from backend on Review nav (research.md Decision 3)
- Files explicitly NOT touched: `functions/`, `entryService.ts`, `referenceResolution.ts`, `richtext.ts`, `MappingView.tsx`, all modal step components, `agents-api.ts`
- Total tasks: **36** across 8 phases
