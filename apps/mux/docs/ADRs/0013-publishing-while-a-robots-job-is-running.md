# ADR-0013: Publishing while a Robots job is running is allowed, and said out loud

**Date:** 2026-09-28
**Status:** Accepted

## Context

Two sequences an editor will hit routinely:

1. Start a Robots job, then click Publish a few seconds later.
2. Start a Robots job, close the tab, come back later, click Publish.

Neither destroys anything. `onPublish` merges rather than replaces (ADR-0002), so a publish carrying
pending actions keeps `robotsJobs`, `robotsOutputs`, `robotsDirectiveRuns` and
`robotsPendingCreates`. The publish gate parks browser writes while the function rewrites the field,
and parked writes survive an unmount (ADR-0010), except a placeholder save, which is dropped because
a closing editor sends no create for it to guard (ADR-0003). And a create is on the entry before it
is sent, as a placeholder that the job record replaces when Mux answers, so a job started and
published seconds later is already on the entry.

What none of that fixes is **staleness of the published value**. A job that is `processing` when
Publish is clicked publishes as `processing`, and the published entry keeps saying so until
somebody reopens the entry, lets the poll update the record, and publishes again. A placeholder
published before Mux answered is stale the same way. Reconciling Robots inside `onPublish` does not
help (ADR-0002): the function returns early unless there are `pendingActions`, so it would cover
only the publishes that carry one, and running it on every publish means an entry update plus a
republish on every publish, which re-triggers the same event and needs its own loop guard.

Sequence 2 has a second, sharper edge. `isActive` gates the Robots tab's first fetch, which is what
keeps the feature free for editors who never open it. So an editor who reopens the entry, does not
open the Robots tab, and publishes, re-publishes the same stale record, because the poll never ran.

### The obvious idea: block Contentful's Publish button

Rejected, on facts rather than taste.

There is no App SDK method to disable or hide the native Publish button; it lives in the Contentful
shell, outside the app's iframe. `sdk.field.setInvalid()` is visual only — it draws the error bar
and does not block publishing — and only affects the field the app is bound to.

The documented lever is a **content-type validation**, for example on a `status: 'processing' |
'ready'` key inside the field's JSON. That does not work. Contentful's validation vocabulary applies
to a *field value*, not to a path inside one — the full list, from `contentful-management`'s
`ContentTypeFieldValidation`, is `linkContentType`, `in`, `linkMimetypeGroup`, `enabledNodeTypes`,
`enabledMarks`, `unique`, `size`, `range`, `dateRange`, `regexp`, `prohibitRegexp`,
`assetImageDimensions`, `assetFileSize` and `nodes`. None of them can address a nested key; `regexp`
is for Symbol and Text, and on an Object field the only validation that applies is `size`, which
counts properties.

Making it work would need an **auxiliary Symbol field on the customer's content type**, and that is
where the cost sits for this app:

- This is a field editor installed on JSON Object fields of content types customers already own.
  It writes no content types anywhere.
- Adding a field is a schema change delivered to every existing install at once — ADR-0006's
  central hazard, one level worse, because it changes their model rather than an entry's value.
- It would make the entry **un-publishable** while a job runs. A `summarize` takes minutes and a
  directive considerably longer, and an editor fixing a caption typo has no reason to be blocked by
  an AI job running in the background.

It would not simplify anything either. The serialized write path (ADR-0001) is still needed because
two poll loops write the field whether or not a publish is happening; `onPublish` merging (ADR-0002)
and the publish gate because the function rewrites the field on any publish carrying
`pendingActions`, which asset and caption deletes produce independently of Robots; the placeholder
(ADR-0003) because it is about surviving a reload. Blocking publish would be additive complexity
that addresses one symptom by removing a capability.

## Decision

Publishing mid-job stays allowed. Two behaviours, driven by predicates over the stored value, which
cost no request and are known on the first render, before anything has been fetched:

- **`unfinishedJobRecords(value)`** (`util/robotsField.ts`) returns the job records the entry
  carries that are neither terminal nor older than `ROBOTS_STALE_JOB_MS` (six hours). The entry
  records every job on its asset, whoever started it (ADR-0005), so this counts jobs started from
  another entry, a directive or the Mux dashboard as well as this entry's own.
- **`freshPendingCreates(value)`** returns the placeholders newer than the same six hours.

1. **The editor is told what a publish now will do.** A notice above the tabs — not inside the
   Robots tab, because the editor deciding to publish is not necessarily looking at it — says how
   many jobs are running, that publishing now publishes the job unfinished, and that publishing
   again after it completes includes the result. It is driven by `unfinishedJobRecords`.

2. **The poll resumes without anybody opening the Robots tab.** The first-load effect fires when
   `isActive || hasUnfinishedJobs || hasFreshPendingCreates`. The `isActive` gate is otherwise
   untouched, so an entry with no Robots data qualifies for nothing and fetches nothing.

Publishing while a placeholder exists publishes the placeholder, the way a mid-job publish
publishes a `processing` record; the next read replaces it with the job, and the next publish
carries that. A placeholder save that is itself parked behind the publish gate is not part of that
publish.

The six-hour cut-off keeps both behaviours honest. A record stuck at `processing` — a job Mux
purged, a session that died mid-run — stops driving the notice and the fetch after six hours rather
than nagging on every open and polling for the life of the entry. For a placeholder it bounds only
this resumed read, never the guard ADR-0003 puts on Run.

## Consequences

### Positive
- An editor who publishes mid-job gets an accurate published value on their second publish, and
  knows that before they click rather than after.
- The notice is driven by the stored record, not by a live read, so it is correct the moment the
  entry renders and wrong only in the window where the job finished and nothing has polled yet,
  which the resumed poll closes within one tick.
- A create whose outcome is unknown is looked for on the next open even if nobody opens the Robots
  tab.

### Negative
- An entry reopened with an unfinished job or a fresh placeholder costs one job list and one run
  list per directive the tab polls, whether or not the Robots tab is opened. Bounded to entries that
  hold one, a small set by construction.
- The resumed read records what it reads like any other, so an entry reopened and left alone can be
  marked Changed when a job it records moves on.
- A job started elsewhere on the same asset also raises the notice, which is accurate about the
  video but not about anything this entry started.

### Neutral
- The notice writes nothing, and an entry that predates Robots has no records or placeholders,
  qualifies for neither behaviour, and stays byte-identical to what is on disk (ADR-0006).
- Reconciling Robots inside `onPublish` remains the only thing that would make a *single* publish
  carry a finished result. If that is ever wanted, ADR-0002's loop-guard problem is the thing to
  solve first.
