# ADR-0009: A directive run started from the entry is recorded on it

**Date:** 2026-09-28
**Status:** Accepted

## Context

A directive runs several billable workflows on an asset in sequence. Mux starts a run in two ways:
at ingest, from the `new_asset_settings.directives` this app attaches to an upload, and on request,
through `POST /robots/v0/directives/{id}/runs` with `{ asset_id }`, which the Robots tab sends when
someone clicks Run directive. Only the second has a moment in the browser.

The jobs a run dispatches are ordinary jobs on the asset, and ADR-0005 records every one of them in
`robotsJobs`. What a job record cannot say is which runs were started from this entry, and the API
does not say it either. `GET /robots/v0/directives/{id}/runs` accepts pagination and nothing else:
there is no `asset_id` or `subject_id` filter, so the tab lists the newest 25 runs of a directive
and keeps those whose `subject_id` is this asset. On a directive that runs on every upload, this
asset's run leaves that window within hours. A deleted directive takes its runs with it at once.

The tab also has to decide which directives to list. Every directive costs one app-action round
trip per poll, and an account can have many. Measured on a fixture account with fifty directives,
listing all of them took opening the tab from 4 calls to 56, to find the one or two runs that touch
the video on screen.

The directive ids this app knows come from installation parameters, and
`sdk.parameters.installation` is handed to the iframe once, when it loads. A token replaced in the
config screen, or a directive deleted in Mux, leaves configured ids that no longer resolve. This
repository's link-checker app reloads its page when those parameters change for the same reason
(commit `c7a41f4f5`).

Alternatives considered:

- **Paginate the run list.** `listRobotsDirectiveRuns` takes `limit` and `page`, but the walk has
  no stopping condition: nothing in a page says whether this asset's run is further back, so
  finding one run means reading every run of the directive, on a poll loop. It does nothing for a
  deleted directive.
- **Record the run only once it completes.** The run can leave the window before it finishes, and
  then there is nothing to record.
- **Record every run the poll sees for this asset.** The jobs such a run dispatches are already in
  `robotsJobs`, so the entry loses no work without it. What the record would add is a write, and a
  published entry marked Changed, for a run nobody started here, and a history that says "started
  here" about runs that were not.
- **Key the record by job instead of by run.** The run id is what exists at creation; its jobs do
  not exist yet.
- **List every directive in the account.** The fan-out above, on every open and every poll.
- **Read the app installation through the CMA at mount**, to get fresh directive ids. It costs a
  request on every open of every entry with a video, on every install, including those that never
  enable Robots (ADR-0006). This repository's content-insights app removed that read for CMA
  rate-limit pressure (commit `c114828d8`), and link-checker found the SDK's client offers only the
  org-wide `getForOrganization` there (commit `c7a41f4f5`).

## Decision

**A directive run started from the Robots tab is recorded on the entry**, in `robotsDirectiveRuns`:

```ts
interface RobotsDirectiveRunRecord {
  runId: string;
  directiveId: string;
  status?: RobotsDirectiveRunStatus;
  startedAt?: number;
  completedAt?: number;
  /** Ids of the jobs this run dispatched, as `node_states` reveals them. Append-only history. */
  jobIds?: string[];
}
```

The record has two uses: it is the history of the automation started from this entry, and it keeps
a run's directive in the set the tab polls (below) after the run leaves the API's window, its
directive leaves the configuration, or the directive is deleted in Mux.

**A run is added only when its create is confirmed or when a read resolves its placeholder.** The
create is guarded like a job create (ADR-0003): a `robotsPendingCreates` placeholder is saved
before anything is sent. A 202 naming the run replaces the placeholder with the record
(`resolvePendingDirectiveRunCreate`, through `recordRobotsDirectiveRun`); an unknown outcome leaves
the placeholder until `resolvePendingCreatesFromReads` matches it to a listed run and records that.
Both call `mergeDirectiveRunRecords(..., { append: true })`. Polling goes through
`applyRobotsDirectiveRunsToValue`, which updates runs the entry already records and never adds one.
A confirmed create's record is written with `save: true`, in its own catch: the run has started
and is billing, so a failed write is never reported as a failed run.

**Records are append-and-update only**, merged rather than replaced, so a thinner read cannot erase
what a richer one knew and the history outlives Mux's purge. `jobIds` is unioned, never replaced;
nothing in the app reads it.

**The tab polls four sets of directives, never the account.** `useRobotsDirectiveRuns` joins, into
one sorted `directiveIdKey`: the directives configured to run at ingest, the ones this entry
records a run from, the ones with a run create pending (`pendingDirectiveIds`, so an unconfirmed
run can be found), and the ones already on screen. Each is listed once per pass and narrowed by
`subject_id`.

**A run the jobs name is read by id, for display.** The single-job GET carries
`directive: { id, run_id }` for a job a directive dispatched, and those are the two ids
`GET /robots/v0/directives/{id}/runs/{run_id}` takes. `directiveRunRefsFromJobs` collects them from
the jobs whose detail the tab has read (ADR-0005), and each run no listing returned is read once;
a finished run is not read again, and a running one is re-read at the poll's cadence and keeps the
loop alive. A named run does not join the directive set and is never recorded, so what it costs is
bounded by the asset's own jobs. This is how an imported video, whose directive was never
configured here, shows the automation that ran on it.

`loadDirectiveRuns` runs one pass at a time. A request for a different set while a pass is running
is queued and served after it, because job detail changes the named set and routinely lands during
the first listing; a duplicate request is dropped.

**Configured ids are a hint, and a complete listing from Mux is the answer.** Wherever an id is
used:

- *The Robots tab's picker* offers what `GET /robots/v0/directives` returns, falls back to the
  configured ids only when that listing fails, says so when the account has none, and lists again
  on Refresh. A selection the newest listing no longer offers is dropped rather than run into a
  404.
- *The upload modal* does not attach a configured id that a complete listing (fewer than one full
  page) does not return, and says a reload picks up a changed configuration. A listing that fails,
  or fills a page, is not evidence of absence, and everything configured is attached.
- *The config screen* keeps a listing with the credentials it was read with and shows it only while
  those are the ones in the form. A selected id a complete listing does not return is marked as not
  in this Mux account, with a Remove button. A replaced token is flagged until the directives are
  listed again, not cleared, because a new token for the same environment keeps every id valid.

Names are resolved on demand (`useRobotsDirectiveNames`, `directiveNamesById`) and never stored;
the id renders when a name cannot be found.

**After an upload that attached a directive, the editor is told once that it is at work.**
`announceRobotsActivity` runs when the asset reports `ready`, which is when an ingest-attached
directive starts. It checks for a job or run on the asset up to `ROBOTS_UPLOAD_CHECK_ATTEMPTS`
(four) times, five seconds apart, and shows a toast pointing at the Robots tab if it finds one. The
directive ids are kept from `onConfirmModal`, the one moment the browser knows automation was
requested, and a session flag makes it fire once; nothing derives it from the stored value, so
reopening an entry is silent. Each wait is awaited and every step checks for unmount.

### The version

All four Robots keys (`robotsJobs`, `robotsOutputs`, `robotsDirectiveRuns`,
`robotsPendingCreates`) raise the value to one version, `FIELD_VERSION_WITH_ROBOTS` (4). A version
tells apart shapes written by different builds. The four keys ship in the same release, so no build
writes one without knowing about the others, and a number per key would describe builds that never
existed.

```ts
const holdsRobotsData =
  (Array.isArray(jobs) && jobs.length > 0) ||
  !!value?.robotsOutputs ||
  (Array.isArray(directiveRuns) && directiveRuns.length > 0) ||
  (Array.isArray(pendingCreates) && pendingCreates.length > 0);

return Math.max(carried, holdsRobotsData ? FIELD_VERSION_WITH_ROBOTS : 0);
```

The version is derived from what the value holds, never asserted. Hard-coding 4 would make the
rebuilt value differ from what is stored for every entry that predates Robots, so opening one
would trigger a `setValue` and mark a published entry Changed with no cause the editor can see. An
entry with no Robots data keeps the version it has, v1 and v2 included, and a version is never
lowered, including one newer than this build knows.

`Array.isArray` rather than a truthy `.length` matters: the field JSON is user-reachable, and a
string has a `length` too. `deriveFieldVersion` exists twice, in `frontend/src/util/muxFieldVersion.ts`
and in `functions/src/helpers/muxField.ts` for `onPublish`, because the two are separate packages.
If they disagreed about one value they would never converge: each writer would rewrite the other's
answer on every edit and publish. The mirrored tables in `muxFieldVersionParity.test.ts`, on both
sides, hold them together.

## Consequences

### Positive

- The entry answers "what automation was started on this video, from here, and when" without a
  network call, for the life of the entry rather than for as long as a run is among the newest 25.
- A run started here stays polled until it finishes, even if its directive is removed from the
  configuration or deleted in Mux.
- Opening the tab costs a number of round trips set by the configuration and the video's own jobs,
  not by the size of the account.
- A configured directive Mux does not have cannot ride on an upload or be picked for a run, and the
  config screen shows it at the moment an admin can remove it.
- Automation attached at upload announces itself while the editor is still looking at the upload.

### Negative

- **Runs dispatched at ingest are never recorded.** Mux creates them server-side, so there is no
  creation moment in the browser. They are shown while they are among a polled directive's newest
  25 runs, or while a job whose detail the tab has read names them. Their jobs are recorded in
  `robotsJobs` regardless (ADR-0005).
- A run is found by name only once one of its jobs has finished and been read: detail is read for
  terminal jobs, so a run whose first job is still running, or whose jobs are all older than the
  detail window, stays invisible unless a polled directive lists it.
- Starting a directive run writes to the entry twice, the placeholder and then the record, and
  marks a published entry Changed. Deliberate: the click spent money on this video.
- A record can go stale. A run cancelled in the Mux dashboard keeps the status the entry last saw
  once the tab stops reading it. The tab's live list is where current state lives.
- The installation-parameter snapshot is narrowed, not closed. A directive added to the
  configuration after an editor's page loaded is not attached to that editor's uploads, nor polled
  as configured, until the page reloads; the picker lists it, because the picker lists what Mux
  has. The picker is empty for the length of the listing round trip.
- One more key on a JSON field: an id, a directive id, two timestamps and a few job ids per run.

### Neutral

- Nothing migrates. Robots has not shipped; an entry gains `robotsDirectiveRuns` only when someone
  starts a run from it.
- `robotsJobs` and `robotsDirectiveRuns` overlap on purpose. A dispatched job appears as a job
  record and as an id inside its run; they answer different questions, what ran and what started
  it.
- The directive listing is fetched once when the tab or the upload modal opens, and again on
  Refresh, for the picker's choices and the names shown. It does not decide what is polled.
- Nothing is removed from the configuration automatically. Every removal is an admin's click on a
  listing made with the token in the form.
- The job's `directive` reference is documented and newer than the rest of the job shape this app
  relies on. If it were absent, a named run would not be found and nothing else would change.
