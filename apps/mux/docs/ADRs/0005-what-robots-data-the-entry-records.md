# ADR-0005: The entry records every Robots job on its asset, and never forgets one

**Date:** 2026-09-28
**Status:** Accepted

## Context

The Robots tab reads `GET /robots/v0/jobs?asset_id=…`, which returns every job for that Mux asset
whoever started it: this entry, another entry or install on the same asset, a directive at ingest,
or someone in the Mux dashboard. The list is a summary. `outputs`, `units_consumed`, `errors` and
`parameters` exist only on `GET /robots/v0/jobs/{workflow}/{id}`, one request per job.

An editor looking at a video wants to know what has been run on it, and a list with holes in it is
worse than no list. The entry is also where that answer has to survive: Robots purges jobs after
30 days, and the field JSON is the only path by which Robots data reaches the Delivery API
(ADR-0002). And nothing in a list read says reliably who started a job, so any rule that stores
some jobs and not others has to prove provenance it cannot see.

Reading detail costs a request per job, and an asset can have hundreds of jobs from the dashboard.

Alternatives considered:

- **Store only the jobs started from this entry.** Needs a test of who started each job, which the
  API cannot back: the list carries no `passthrough`, and a job a directive dispatched carries
  nothing from Contentful at all. Any such test either misses jobs this entry did start or needs
  its own reconciliation machinery, and it leaves the entry unable to say what ran on its video.
- **Mirror the API exactly, removing records it no longer returns.** The purge window would
  quietly erase an entry's history, and `robotsOutputs` with it.
- **Read detail for every job on open.** Unbounded: the cost of opening a tab would track the
  asset's history, not the editor's interest.

## Decision

**`robotsJobs` records every job the tab reads for the entry's asset.** The only gate is the asset:
`applyRobotsJobsToValue(value, jobs, assetId)` writes nothing unless `value.assetId === assetId`,
so a mutator queued for one asset and applied after the value was replaced with another does
nothing. A job is recorded in flight as well as finished, and each status change it goes through
(at most `pending → processing → completed`) is a write.

**Records are append-and-update only.** `mergeJobRecords` merges an incoming job into the stored
record rather than replacing it, because a list summary is thinner than a record written from
detail and must not erase its `units_consumed` or `error`. A record whose job the API no longer
returns is left alone: it stops updating, and stays.

**`robotsOutputs` keeps the newest completed summarize and moderate output**, keyed by workflow
(ADR-0008). `mergeRobotsOutputs` takes an output only from a job whose own `parameters.asset_id`
equals the value's `assetId`. That field is present on the single-job GET only, so a list summary
never supplies an output, and a job that names no asset writes nothing. The check is on the job
itself, not on the list's `asset_id` filter or on how the panel is keyed, because those describe
how a job was found, and a regression in either would put one video's summary on another video's
entry.

**Detail is read in a bounded window.** `jobsAwaitingDetail` takes the newest 20 jobs on the asset
by `created_at` and keeps the terminal ones not yet read; `jobsNeedingDetail` reads five of them
per pass. Terminal detail never changes, so each job is read once per mount. A read that fails is
tombstoned (`failedDetailIds`) and not retried on every tick. Past the window, a row is read only
on demand: its `Not loaded` Units cell reads that one job, and the output modal hands the detail
it fetched back to the panel. Every summarize and moderate output comes from these reads.

**The Units column says why it is empty.** `unitsCell` in `RobotsJobTable.tsx` answers:

- `Not charged` — errored or cancelled; Mux bills neither, so no read is needed to know it.
- the number of units consumed.
- `Not counted yet` — still running.
- `Unavailable` — the detail read was attempted and failed.
- `Not reported` — the whole job was read and carried no count.
- `Not loaded` — past the window; the cell offers the read.

No state renders a bare em dash, because an empty cell cannot tell *nothing consumed* from *nobody
asked*. A cancelled job offers no *View output*: it stopped before producing anything, which is the
same fact `Not charged` states.

**How big the field gets.** Growth is monotonic, since nothing prunes. The field is roughly 50 KB
at 200 jobs and under 250 KB at 1,000, against the Content Management API's request-size limit, so
a single asset would need on the order of four thousand Robots jobs before a write is refused.
`sdk.field.setValue` takes the whole value, so every write sends the whole field; the only lever is
not writing when nothing changed, which `updateField` already does. What scales first is write
frequency, not size: each status change of a running job is one full-field write.

## Consequences

### Positive
- The entry answers "what has run on this video", with every row's Units filled in or explained,
  and the answer outlives Robots' 30-day retention.
- A summary or moderation result produced anywhere on the asset reaches the Delivery API and the
  *Apply summary* dialog.
- One rule, checkable in one place: the asset. No test of who started a job, no provenance
  to reconstruct.
- The automatic cost of opening the tab is at most 20 detail reads, five per pass, however long
  the asset's history is.

### Negative
- **The first read of the tab marks an entry *Changed* for any job on its asset**, whatever the
  workflow and whoever started it: it writes `robotsJobs`, raises the value to v4, and a published
  entry shows *Changed* although nobody ran anything from Contentful. Each later status change of a
  running job, from anywhere, is another write while the tab polls. This is bounded as ADR-0006
  describes: only where the tab reads (its first read waits for the tab to be selected, bar
  ADR-0013's resumed poll), once per change, since `updateField` drops a tick that learns nothing,
  and never on an install without Robots, which lists no jobs.
- **Records can go stale.** A record stops updating once Mux purges its job, or once nobody opens
  the tab: a job cancelled from the dashboard while nobody has the tab open still reads
  `processing` on the entry until the next read lists it, and for good if Mux purges it first. The
  tab's live list is where current state lives.
- An output past the detail window waits for a click. When twenty jobs of any workflow have been
  created after the newest summarize or moderate, the entry keeps whatever output it had until
  someone reads that row. A job Mux has purged cannot be read at all.
- An editor who wants units for many old rows clicks many times. Deliberate: the alternative is
  paying for rows nobody looks at.
- Dashboard and directive activity now grows the field as well as runs from here.

### Neutral
- Nothing migrates. Robots has not shipped; an entry with no Robots data keeps its version until
  a read records something.
- A cancelled job still takes a slot in the detail window even though `Not charged` makes its read
  redundant for the Units column.
