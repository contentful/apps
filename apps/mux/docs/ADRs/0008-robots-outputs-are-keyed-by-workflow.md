# ADR-0008: Robots outputs are keyed by workflow, so a re-run supersedes the last one

**Date:** 2026-09-28
**Status:** Accepted

## Context

`robotsOutputs` on the field JSON is a map keyed by **workflow name**, not by job id:

```ts
export interface RobotsOutputs {
  summarize?: RobotsSummarizeOutput;
  moderate?: RobotsModerateOutput;
}
```

Only those two workflows persist output at all (`PERSISTED_OUTPUT_WORKFLOWS`). The rest either
attach a track to the Mux asset or arrive through the existing asset mirror, so they never need a
slot here.

The field is a **current-state mirror for the Delivery API**. A CDA consumer asking "what is this
video's summary?" wants one answer, not an array to pick from, and
`entry.fields.muxVideo.robotsOutputs.summarize.description` is only a stable read path if the key
is the workflow.

Every completed summarize and moderate job on the asset is a candidate for the map, whoever started
it (ADR-0005): an output describes the video, not who asked for it. So many jobs compete for one
slot, from any number of open sessions, each of which may have read a different subset of them.
Mux timestamps are whole seconds, so two jobs completing in the same second are a real case, and
the stored `completedAt` is user-reachable JSON that may not be a number.

Provenance does not depend on the key. Each output carries its own `jobId` and `completedAt`, so
whatever is on the entry is traceable to the job that produced it. `robotsJobs`, append-and-update
only, records every job read on the asset, including the one that produced the output. And the job
itself is readable from Mux for 30 days via `GET /robots/v0/jobs/{workflow}/{id}`, outputs
included.

Alternatives considered:

- **Key by job id.** Breaks the stable read path — the consumer has to enumerate the map, sort by
  `completedAt` and pick, for a question that has one useful answer. It also pushes a policy
  decision (which summary is the summary?) out to every consumer independently.
- **Keep an array per workflow.** Same burden on the consumer, plus unbounded growth of the field
  for data that is by definition superseded. Contentful's JSON-field size limits are undocumented,
  which is exactly the reason scenes and key moments are not persisted either.
- **Refuse to overwrite, or ask the editor to confirm.** The common case is an editor deliberately
  re-running summarize because the first result was not good enough. A confirm dialog there is
  noise on the happy path, and refusing outright would mean the better result cannot reach the
  Delivery API at all.

## Decision

`robotsOutputs` stays keyed by workflow, and the newest completed run wins, by a **strict order**
(`isNewerOutput`): a later `completedAt` wins, and on a tie the greater job id does. A missing
`completedAt` counts as oldest, and so does one that is not a number (`completionTime`), so an
output whose completion cannot be placed never displaces one that can, and one that can displaces
it. The same job read again replaces its output only when the output differs.

The job id carries no meaning in the tie-break. What matters is that every session, every read
order and every subset of reads agrees, so a session that has only seen the losing job leaves the
winning one alone, and two open tabs cannot rewrite the entry back and forth over a tie. A late
read of an older job, such as a row past ADR-0005's detail window opened later, is compared like
any other and cannot displace a newer output.

History is answered elsewhere, deliberately: `robotsJobs` for which jobs ran on the asset and
when, Mux for what a specific job produced.

## Consequences

### Positive
- `robotsOutputs.summarize.description` is a stable, single-valued read path on the Delivery API. No
  sorting, no choosing, no array handling in the consumer.
- The field cannot grow with re-runs. A video summarized fifty times has the same
  `robotsOutputs` size as one summarized once.
- The surviving output is attributable: `jobId` and `completedAt` say which run produced it.
- One answer per workflow, whichever session asks and in whatever order reads land. A garbled
  timestamp cannot pin an output against every later run.
- Re-running to get a better title just works, which is what an editor expects from a Run button.

### Negative
- **A superseded output is unrecoverable from Contentful, and recoverable from Mux only for 30
  days.** After the purge window it is gone. There is no undo in the entry, and re-running summarize
  silently discards the previous result — usually what the editor wants, and not reversible from
  Contentful either way.
- A summary from elsewhere, such as the dashboard or a directive, supersedes one run here when it
  completes later, by the same rule a re-run here does.
- The tie-break is arbitrary. It is not "the one that really finished last", which the API cannot
  tell at a second's resolution.
- When the newest summarize is past ADR-0005's detail window, the entry keeps the older output
  until that row is read.
- The entry cannot answer "did the summary change between these two runs". Comparing runs means
  reading both jobs from Mux inside the retention window.

### Neutral
- `robotsJobs` and `robotsOutputs` differ in cardinality by design: many jobs, at most one output
  per workflow. Anyone reading the field needs to know that the two answer different questions.
- Nothing migrates. The map has always had this shape.
