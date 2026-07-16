# Feature Specification: Async Import Runs

**Feature Branch**: `001-async-import-runs`
**Created**: 2026-07-16
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Start Import and See It Tracked (Priority: P1)

A user selects a Google Doc, picks content types, and kicks off an import. Instead of waiting on a spinner for up to 20 minutes, the wizard immediately confirms the import has started and redirects the user to the Runs page. The new run appears at the top of the list with a "Running" status. The user can close the app or navigate elsewhere and return later.

**Why this priority**: This is the core value unlock of the feature. Every other story depends on a run being created and tracked. Without this, nothing else ships.

**Independent Test**: Can be fully tested by starting a new import through the wizard and verifying a run record appears on the Runs page with "Running" status — no review or entry creation needed.

**Acceptance Scenarios**:

1. **Given** the user has connected Google Drive and completes the wizard (doc selected, content types chosen), **When** they click the final "Start Import" action, **Then** the wizard closes, the user is redirected to the Runs page, and a new run entry appears at the top with status "Running", the document title, selected content types, and the start time.
2. **Given** a run is in "Running" status on the Runs page, **When** the user refreshes the page or returns after navigating away, **Then** the run is still visible and still shows the current live status fetched from the backend.
3. **Given** a run is in "Running" status, **When** the AI analysis completes, **Then** the run status updates to "Needs Review" on the Runs page (within one polling cycle).

---

### User Story 2 — Runs Page Home View (Priority: P1)

A user opens the Drive Integration app and sees the Runs page as the default home screen. They can see all their past and current imports at a glance — status, document, content types, and when each started. A "New Import" button lets them kick off another import at any time.

**Why this priority**: The Runs page is the new home of the app. Without it the rearchitecture has no anchor.

**Independent Test**: Can be fully tested with a seeded set of runs in localStorage (various statuses) — verify each run renders correctly with all required fields, and that the "New Import" button opens the wizard.

**Acceptance Scenarios**:

1. **Given** the user has no prior runs, **When** they open the app, **Then** the Runs page shows an empty state with a clear prompt to start their first import.
2. **Given** the user has multiple runs in various statuses, **When** they open the app, **Then** all runs are listed, sorted with most recent first, each showing: document title, content types, started timestamp, and status badge.
3. **Given** the user is on the Runs page, **When** they click "New Import", **Then** the wizard opens (same flow as before, but exits async).
4. **Given** there are one or more "Running" status runs, **When** the Runs page is open, **Then** statuses auto-refresh every 10 seconds without requiring a manual page reload.

---

### User Story 3 — Review a Completed AI Analysis (Priority: P2)

A user returns to the Runs page and sees a run with "Needs Review" status. They click the "Review" button, which opens the full mapping review screen pre-loaded with the AI's proposed field mappings. They approve or edit the mappings and create the entries — exactly as today.

**Why this priority**: This is the path to actually creating entries. P2 because P1 stories must exist first, but this closes the loop on the import workflow.

**Independent Test**: Can be fully tested by seeding a run with `PENDING_REVIEW` status and a `suspendPayload` in localStorage, clicking "Review", and completing the entry creation flow.

**Acceptance Scenarios**:

1. **Given** a run has status "Needs Review", **When** the user clicks the "Review" button, **Then** the Review screen opens with the mapping payload for that run.
2. **Given** the user is on the Review screen for a run, **When** they approve mappings and click "Create selected entries", **Then** entries are created in Contentful synchronously (same as today) and the run status updates to "Completed".
3. **Given** a run transitions to "Completed" after entry creation, **When** the user returns to the Runs page, **Then** the run shows a "Completed" badge and a link to the created entries in Contentful.

---

### User Story 4 — Handle Failed Runs (Priority: P3)

A user sees a run with "Failed" status on the Runs page. The run entry shows an error summary, and the user can dismiss/remove the run from their list.

**Why this priority**: Error visibility is important but doesn't block the happy path.

**Independent Test**: Can be fully tested by seeding a run with `FAILED` status and an error message in localStorage.

**Acceptance Scenarios**:

1. **Given** a run transitions to "Failed" status, **When** the user views the Runs page, **Then** the run shows a "Failed" badge and a human-readable error summary.
2. **Given** a run is in "Failed" status, **When** the user clicks "Dismiss" (or equivalent), **Then** the run is removed from the list.

---

### User Story 5 — Multiple Concurrent Imports (Priority: P3)

A user starts a second import while a first one is still running. Both runs appear on the Runs page simultaneously with independent statuses.

**Why this priority**: Concurrency is a requirement but doesn't require special flows — it emerges naturally if the data model supports multiple runs.

**Independent Test**: Can be fully tested by starting two wizard flows back-to-back and verifying both runs appear independently on the Runs page.

**Acceptance Scenarios**:

1. **Given** one run is already in "Running" status, **When** the user clicks "New Import" and completes the wizard, **Then** a second run appears on the Runs page with its own independent "Running" status, and the first run is unaffected.
2. **Given** two runs are running simultaneously, **When** one reaches "Needs Review", **Then** only that run's status changes; the other remains "Running".

---

### Edge Cases

- What happens if the user clears their browser data (localStorage wiped)? Runs list becomes empty with no way to recover in-progress runs.
- What happens if the backend run ID no longer exists when the Runs page tries to fetch its status? Show the run as "Unknown / Expired" rather than crashing.
- What happens if the user opens the app in two browser tabs simultaneously? Both tabs read from the same localStorage, but polling in both tabs is acceptable — no write conflict since runs are only added (not mutated) in localStorage.
- What happens if an import is started on one device and the user opens the app on another? The run will not appear (localStorage is device-specific). This is a known limitation.
- What happens if the Review screen is opened for a run whose suspend payload is very large? The payload is stored in localStorage alongside the run metadata; if localStorage quota is exceeded, the app must gracefully handle the write failure.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST display the Runs page as the default home screen when opened.
- **FR-002**: The Runs page MUST list all tracked import runs, sorted by start time descending (most recent first).
- **FR-003**: Each run entry MUST display: document title, content type names, start timestamp, and status badge.
- **FR-004**: The Runs page MUST provide a "New Import" action that opens the import wizard.
- **FR-005**: When the wizard's final step is completed, the app MUST immediately create a run record in persistent local storage and redirect to the Runs page, without waiting for the AI analysis to complete.
- **FR-006**: Run records in local storage MUST contain at minimum: run ID, document title, document ID, selected content type IDs, and start timestamp.
- **FR-007**: The Runs page MUST fetch live status from the backend for each stored run ID on load.
- **FR-008**: When any run is in "Running" status, the Runs page MUST automatically refresh run statuses every 10 seconds.
- **FR-009**: A run in "Needs Review" status MUST show a "Review" action that opens the mapping review screen for that run.
- **FR-010**: The mapping review screen MUST be loadable from the Runs page (not only from the wizard flow).
- **FR-011**: After the user approves mappings and entries are created, the run status MUST update to "Completed" and the run entry MUST display links to the created Contentful entries.
- **FR-012**: A run in "Failed" status MUST display a human-readable error summary.
- **FR-013**: The user MUST be able to dismiss/remove a "Failed" run from the list.
- **FR-014**: Multiple runs MUST be trackable simultaneously with independent statuses.
- **FR-015**: If a run ID stored locally is no longer resolvable from the backend, the run MUST display an "Expired" or "Unknown" status rather than causing an error.
- **FR-016**: If local storage write fails (e.g., quota exceeded), the app MUST inform the user that run tracking is unavailable and the import cannot proceed, rather than silently losing the run record.

### Key Entities

- **Run Record**: Represents a single import attempt. Key attributes: unique run ID (from backend), document title, document ID, selected content type IDs (array), start timestamp, status (Running / Needs Review / Completed / Failed / Expired). Stored in local browser storage. Status is always fetched live from the backend — not persisted locally.
- **Suspend Payload**: The AI-generated field mapping proposal for a run in "Needs Review" state. Fetched from the backend run data when the Review screen is opened. Not stored in local storage (to avoid quota issues).
- **Created Entries Summary**: The list of Contentful entry IDs created after a successful review. Stored alongside the run record in local storage upon completion so the Runs page can show links without a backend call.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After completing the import wizard, the user is on the Runs page within 2 seconds — no waiting on AI analysis.
- **SC-002**: A user who navigates away from the app and returns finds all their previous runs still visible with up-to-date statuses.
- **SC-003**: Run status on the Runs page reflects actual backend state within 10 seconds of a status change.
- **SC-004**: A user can start, track, review, and complete an import without ever being blocked by a loading screen lasting more than 5 seconds (excluding the review screen's entry-creation step, which is bounded by Contentful API response times).
- **SC-005**: A user can have at least 20 run records tracked simultaneously without degraded performance on the Runs page.
- **SC-006**: 100% of runs started through the wizard appear on the Runs page immediately after wizard completion, with no data loss on navigation or refresh.

---

## Assumptions

- The Contentful `sdk.cma.agentRun.get()` API is sufficient to retrieve run status and suspend payload for any run ID. No new backend functions are required.
- The Contentful `sdk.cma.agentRun.resumeRun()` API continues to work as today for the review → entry creation step.
- `localStorage` is available and has sufficient quota for the expected volume of run records (metadata only; suspend payloads are not stored locally).
- Run records are user- and device-specific; cross-device sync is explicitly out of scope.
- The app continues to use the Contentful App Framework single-page location model; a lightweight in-app router (view state machine) will replace the current binary main/review toggle — no third-party routing library is required.
- The OAuth connect/disconnect flow is unaffected by this rearchitecture.
- The import wizard steps (file picker, content type picker, tabs, images) are unchanged; only the exit behavior changes.
