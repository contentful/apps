# ADR-0003: Robots creates are guarded by a placeholder on the entry, and the job passthrough is not ours

**Date:** 2026-09-28
**Status:** Accepted

## Context

Every Mux call from the entry editor goes through `appActionCall.createWithResponse`, which is two
operations: a POST that creates the App Action call, then a poll of Contentful's call log for its
result, 15 polls 2 s apart, after which it rejects. That rejection, about 30 s in, means the
browser stopped waiting, nothing more. The request may already have reached Mux and started a job.
A cold start, a slow Mux call, a call log that is not queryable yet or a throttled background tab
all produce it, and so does an App Function killed after its request went out.

A Robots create spends money on every click, a directive run several times over, and the Robots API
has no idempotency key. Retrying after an unknown outcome can start and bill the same work twice;
showing a plain error invites the editor to do the same by hand. Raising `createWithResponse`'s
retry budget widens the window without closing it. What Mux does offer is a refusal: every
job-create endpoint documents a 409 when a job with the same workflow and parameters is already
pending or processing, and the directive-run create documents a 409 when a run for that directive is
already in progress ([API spec](https://www.mux.com/api-spec.json)).

There is nothing of ours to match an unknown outcome against exactly. A job's top-level
`passthrough` belongs to the customer, and the job list (`GET /robots/v0/jobs`) does not return it;
only the single-job GET does. The directive-run create takes only `asset_id`.

Mux attributes traffic from CMS integrations by the `x-source-platform` header, which `muxFetch`
sends as `contentful` on every `muxProxy` call.

## Decision

**The placeholder is saved before the create is sent.** Each create first adds an entry to
`robotsPendingCreates` on the field: `{ requestId, kind: 'job', workflow, requestedAt }` or
`{ requestId, kind: 'directive-run', directiveId, requestedAt }`, with `requestedAt` in Unix seconds
from the browser clock. It is written with `updateField(..., { save: true, flushOnUnmount: false,
onParked })`. If the save fails, nothing is sent: no durable guard, no spend. A save parked behind
the publish gate (ADR-0010) shows its row as Waiting for publish, and a runner can withdraw it with
Don't start, which hides the row and frees Run at once; the withdrawn save writes nothing when the
gate releases it. A save still parked when the editor closes is dropped rather than flushed,
because a closing editor sends no create for it to guard.

**The create is sent once.** `startRobotsJob` and `startRobotsDirectiveRun` never retry. A 202
naming the job or run replaces the placeholder with the record in one write
(`resolvePendingJobCreate`, `resolvePendingDirectiveRunCreate`). An error Mux answered with
(`MuxApiError.muxAnswered`, because `muxProxy` returns Mux's status over HTTP 200) means nothing
started: the placeholder is removed and the reason shown, and a 409 says an identical job or a run
of that directive is already going. Anything else, including the ~30 s give-up, a killed function
and a 2xx that names no job, leaves the outcome unknown, and the placeholder stays.

**Reads resolve placeholders.** The mutator every Robots read persists through runs
`resolvePendingCreatesFromReads` before it records runs and jobs. `matchPendingCreates` resolves a
placeholder to the id this tab's own create response named, if there is one. Otherwise it takes the
closest job of the same workflow, or run of the same directive on the same asset with a
`started_at`, that the entry has not already recorded and that Mux created between
`ROBOTS_CREATE_MATCH_BEFORE_S` (15 s) before and `ROBOTS_CREATE_MATCH_AFTER_S` (120 s) after
`requestedAt`. The match is bounded, not exact. A browser clock skewed past the window fails
closed: nothing matches and the placeholder stays. A same-workflow job started elsewhere inside the
window — another entry on the asset, a directive, the Mux dashboard — may resolve it instead; that
is bounded by the 409, since an identical run started while either is going is refused. When two
tabs create at once, each candidate resolves at most one placeholder, so one without a job of its
own stays.

**The guard.** Run a workflow is blocked while the job table shows a pending row, and Run directive
while either table does. Nothing time-based re-enables Run: the job may be running and billing, and
a timer that re-enables Run is the double charge this exists to prevent. There are two ways out: a
read resolves the placeholder, or a runner clicks "Nothing is running — let me try again", which
removes exactly the placeholders the note names, with `save: true`.

While a placeholder exists the poll loop stays armed with nothing in flight, for
`ROBOTS_UNCONFIRMED_RECHECK_TICKS` (10) ticks at 6 s, counted per kind and reset when a request id
the tab has not seen appears. The tick budget ends the looking, not the guard. An entry reopened
with a placeholder newer than `ROBOTS_STALE_JOB_MS` resumes that read without the tab being opened
(ADR-0013); staleness bounds only that read.

**What the editor sees.** A pending create is a row in its table, derived by `pendingCreateRows`,
and turns into its job or run in place (both tables sort newest first). Its phase is Waiting for
publish, only in the tab that clicked and only while the save is parked; Starting…; or Not
confirmed, which the tab that clicked shows as soon as the outcome is unknown and any other tab or a
reload shows `ROBOTS_CREATE_CONFIRM_GRACE_S` (45 s) after `requestedAt`. A row never stays
Starting…, but it can stay Not confirmed until a read resolves it or a runner clears it. A job
created and then errored inside Mux is a real job, and the row becomes that job, `errored`.

Everyone who can open the entry sees pending rows. Only runners (`canRunRobots`, ADR-0016) see
Don't start, the note and its escape hatch; for everyone else an unconfirmed row reads Waiting for
Mux. The note above each table (`RobotsUnconfirmedNote`) is the one place that explains an
unconfirmed create: it names the run and when it was requested, says it may already be running and
billing so nothing was retried, and that Mux refuses an identical run while it is going. A request
that was refused, withdrawn or cleared is hidden in this tab at once (`settledRequestIds`), even
while its removal waits behind a publish; other tabs catch up when the removal lands. The run modal
closes on confirm.

**The job passthrough is not ours.** Nothing in the app reads a job's `passthrough`, and job records
carry none. `createRobotsJob` sends `{ parameters, passthrough: 'mux:cms:contentful:' }`: one
interim marker line, kept until Mux confirms it counts CMS-created Robots jobs by
`x-source-platform`, and deleted then. No other call sends a passthrough, which
`frontend/src/util/muxApi.test.ts` pins. The directive-run body is `{ asset_id }`.

**Browser only.** No App Function sends the create or writes the placeholder. A function writing
the entry would be a second writer of the field outside publish, whose merge with the value the
open editor holds is undocumented, and it would write with the app's permissions rather than the
editor's. Worth revisiting if Mux adds an idempotency key.

## Consequences

### Positive
- An unknown outcome cannot double-charge through this app, and the guard survives a reload and
  reaches every open tab, because it is on the entry.
- Resolution adds no request: it runs on the lists the poll already reads.
- The customer's `passthrough` is left to them, apart from the interim line.
- A pending row and the job or run it becomes are never both on screen and never both missing.

### Negative
- Every click saves the entry before anything is sent, and removing or replacing the placeholder is
  a second save, so a published entry is marked Changed even when Mux refuses the run.
- The list match is approximate. An unrelated same-workflow job inside the window can lift the
  guard early; the 409 limits what that can cost.
- A create that never started, where reads keep failing or the clock is skewed, keeps Run blocked
  until a runner clears it. Someone who is not a runner cannot.
- Once the tick budget is spent the tab stops looking until the next read that resolves
  placeholders: a reload, another tab, or ADR-0013's resumed read.
- Until the interim line is deleted, jobs created from Contentful carry `mux:cms:contentful:` in a
  field that is the customer's.

### Neutral
- `addByURL` → `createAsset` has the same unknown-outcome shape and is untreated: a retry after the
  give-up can create a second Mux asset. It is not Robots, and belongs in its own change.
- A non-empty `robotsPendingCreates` counts toward the field version like the other Robots keys, and
  `onPublish`'s merge keeps it (ADR-0002).
- Nothing migrates. Robots has not shipped, and a `passthrough` stored on an old record is left
  alone and never read.
