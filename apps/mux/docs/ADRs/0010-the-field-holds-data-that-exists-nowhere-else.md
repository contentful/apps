# ADR-0010: The field holds data that exists nowhere else

**Date:** 2026-09-28
**Status:** Accepted

## Context

Every key the Mux field held before Robots is a **mirror**. `playbackId`, `ready`, `duration`,
`captions` — all of it is re-derived from `GET /video/v1/assets/{id}` on the next entry open, so
losing any of it costs a resync and nothing else. That assumption is load-bearing in the design:
it is why the asset poll can rebuild the mirror several times a second, why a failed write is
survivable, and why nobody has ever had to think hard about durability here.

Robots breaks the assumption. `robotsJobs`, `robotsOutputs`, `robotsDirectiveRuns` and
`robotsPendingCreates` are written **only** by the browser, from information that is not
recoverable anywhere else. The job and run records outlive Mux's 30-day purge (ADR-0005,
ADR-0009); an output replaced by a newer one is gone from Mux after 30 days, and from the entry
immediately (ADR-0008); a running job is *billing* whether or not anything remembers it; and a
`robotsPendingCreates` placeholder is the only thing that stops a second click from starting, and
billing, a duplicate of a create whose outcome is not known (ADR-0003).

"Exists nowhere else" is an argument against losing this data by accident, not a guarantee that it
outlives its asset. `onPublish` clears the whole field, Robots keys included, when
`GET /video/v1/assets/{id}` returns a 404 (ADR-0002).

Two places are built for the old assumption.

**An entry whose asset cannot be played looks empty.** Gating the rich editor on a playback ID
existing — `playbackId || signedPlaybackId || drmPlaybackId` — fails for an asset that has lost
all three: `moderate` with `on_flagged.action: delete_playback_ids` deletes every one of them, and
so does anyone clicking delete in the Mux dashboard. The mirror then correctly clears them, and a
playback gate drops to the upload area and the "URL or Mux Asset ID" form, with no player, menu,
tabs, Robots panel or explanation, for an entry still holding `assetId`, `captions` and its Robots
records.

The asset-ID form's submit is one of the three deliberate full-value replaces (ADR-0001):
`setValue({ assetId: input })`. Pasting a different asset ID in destroys `robotsJobs`,
`robotsOutputs` and `captions`. A moderation directive is the *most likely* way to reach this
state, so the entries most exposed are the ones with Robots records on them. Recovery belongs to
the asset: the Playback tab can request a new playback ID, queued as a `pendingActions` create and
applied on publish (ADR-0015), and a playback ID added in Mux arrives on resync.

**A write can be reported as successful when it never happened.** Two independent windows:

1. The publish gate (ADR-0002) parks browser writes for up to 90 seconds
   (`PUBLISH_GATE_TIMEOUT_MS`) while `onPublish` rewrites the field server-side. A parked write
   that returns without writing and without throwing lets `await updateField(...)` resolve
   cleanly, and an unmount that empties the queue then loses it: stage a caption change, publish,
   start a Robots job inside the window, close the tab. The job is running and billing, and
   nothing reports a problem.
2. `sdk.field.setValue` resolves when the value has crossed the postMessage bridge into the
   Contentful web app. Persisting it is the web app's own autosave, on its own schedule. A write
   that "succeeded" can still be lost by closing the tab quickly enough, which for an asset mirror
   is free and for a billable job record, or the placeholder guarding a create, is not.

Alternatives considered:

- **Keep the playback-ID gate and add a special "no playback IDs" screen.** Rejected: it is the
  same mistake one level down. The editor's job is to edit the entry's asset, and playability is a
  property of the asset, not a precondition for the entry existing. A second top-level screen
  means every future feature has to be added to both.
- **Have the asset poll re-create a playback ID when it finds none.** Rejected: the app would be
  undoing a moderation decision automatically, which is the opposite of what
  `delete_playback_ids` is for. A person asking for one from the Playback tab (ADR-0015) is a
  different act.
- **Make `addVideoByInput` merge instead of replace.** Rejected: pasting a *different* asset ID
  must discard the old asset's mirror, and merging two assets' data into one value is worse than
  either replacing or refusing. A confirm keeps the semantics and removes the silence.
- **Make `updateField` reject immediately when it parks a mutator.** Rejected: the mutator is
  still queued and will usually be applied a moment later, so "rejected" would be a lie in the
  common case and would make callers retry a write that is about to land.
- **Have the caller's promise stay pending and block the write chain on it.** Rejected — it
  deadlocks. A parked mutator is released *through* `updateField`, so a chain waiting on the
  parked promise waits on a release that is queued behind itself.
- **Await the write chain during unmount, instead of writing directly.** Rejected: a promise
  chained at unmount may never get a turn. The flush has one shot and has to take it inline.
- **Call `sdk.entry.save()` after every write.** Rejected: the asset poll writes several times a
  second while an asset prepares, and an entry save per tick is an entry version per tick and a
  load pattern nobody asked for. Durability is needed for the few writes that guard or record
  something billable, so the caller says when.
- **Persist Robots records outside the entry** (app state, a Mux-side lookup). Viable, and
  rejected as a much larger change: the field JSON is the delivery path for `robotsOutputs`, so
  the entry has to hold it regardless, and a second store would have to be reconciled with it.

## Decision

**The editor branch is gated on `assetId`.** An entry with an asset gets the editor for that
asset. Where the player would go, an asset with no playback IDs gets a note that says so, why it
can happen, and what to do: request a new one in the Playback tab and publish, or add one in Mux
and resync, with its own Resync button. A playback ID that disappears mid-session raises a toast
saying the same. The "Waiting for asset to be playable" spinner is suppressed in that state,
because nothing is coming.

Every child of that branch handles a missing playback ID by saying why an affordance is not
there, rather than rendering a dead one: the caption table's VTT and transcript links (which need
a playback ID to build a URL), the MP4 rendition list (which would otherwise build
`https://stream.mux.com/undefined/...` for a rendition that outlived the playback IDs), and
`swapPlaybackIDs`, which queues a delete only when there is a playback ID to delete; a delete with
no `id` would make the publish function issue `DELETE /assets/{id}/playback-ids` with no ID on
four consecutive publishes before giving up.

**`addVideoByInput` asks first** when the stored value holds job records, outputs or captions and
the pasted ID differs from the one already there. It is still a full replace — that is the point
of it — but not a silent one. With the branch keyed off `assetId` this path is nearly unreachable:
the gate removes the trap, and the confirm is what is left standing if anyone ever re-gates the
render.

**A parked write settles when it is applied, and rejects when it is dropped.** `updateField`
returns a promise that stays pending while the mutator is parked behind the publish gate, and
settles with the real outcome of the re-applied write, including being parked again by a second
publish. If it is dropped instead, it rejects with `DiscardedFieldWriteError`. The write chain
deliberately does not wait on the parked promise, for the deadlock above.

**`componentWillUnmount` flushes the queue** before raising the unmount flag
(`flushDeferredMutations`): it applies every parked mutator in order against the current stored
value and writes once, directly, not through the chain. Best effort by construction — a closing
tab may not finish anything — but every parked caller learns whether its change was written.

**`UpdateFieldOptions` lets a caller that guards or records something billable say so:**

- **`save: true`** calls `sdk.entry.save()` after a write that actually changed something, and
  after the unmount flush if any flushed write asked for it. Off by default. A save failure is
  logged and swallowed: `setValue` has already resolved, the value is in the editor's buffer, and
  reporting a failed write would make the caller retry one that happened.
- **`onParked`** is called when the write is parked behind the publish gate, and again if it is
  parked once more. The promise still settles with the real outcome. It tells the one caller whose
  write is held that it is waiting, so no copy of the gate state lives anywhere else; the Robots
  tab uses it to show a create as waiting for publish (ADR-0003).
- **`flushOnUnmount: false`** makes the unmount flush reject that write with
  `DiscardedFieldWriteError` instead of applying it. Only the placeholder saved before a Robots
  create uses it. Flushing on unmount is right for a write that records something that has
  already happened, such as a job that is running. The placeholder is the opposite: it guards a
  create that is sent only after the save lands, and a closing editor sends nothing, so flushing
  it would leave a guard with no create behind it, blocking Run until someone clears it.

## Consequences

### Positive
- An asset that loses its playback IDs costs the editor a player, and nothing else. The captions,
  the Robots tab, the menu, the metadata and the Data tab are all still there, the entry's data is
  not one plausible keystroke from being destroyed, and the way back is named on screen.
- A caller that guards or records something billable can tell "written" from "dropped", can learn
  that its write is waiting behind a publish, and can ask for the write to be persisted rather than
  buffered.
- The 90 s publish window is not a data-loss window. A parked record lands on unmount, and a
  parked placeholder is dropped together with the create it would have guarded.
- Every call site that passes no options behaves as it would without them, so none of this
  changes anything for an install that never enables Robots (ADR-0006).

### Negative
- A caller awaiting `updateField` during a publish waits for the gate to lift, up to 90 seconds.
  That is the honest answer to "is my change stored", but a Resync clicked inside the publish
  window appears to hang. The asset poll stalls in the same window, which at least stops it
  queueing a mutator every 500 ms for 90 seconds.
- The unmount flush writes directly rather than through the chain, so in principle it can race a
  write already in flight. The gate being open is what parks writes in the first place, so the
  overlap is a write that started *before* the gate opened — narrow, and the alternative is
  certain loss.
- A dropped write surfaces as a rejected promise. A caller that ignores the promise turns that into
  an unhandled rejection in the console instead of silence. That is the intended direction, and it
  is still console noise.

### Neutral
- A mutator still sitting on the write chain (not yet parked) when the component unmounts is
  dropped silently. The chain holds a mutator for the duration of one `setValue` — milliseconds —
  against the gate's 90 seconds, so it is not the reachable case, and closing it would mean
  tracking every in-flight apply to avoid double-writing one.
- `options.save` is used by the Robots writes that add or remove a placeholder, and by the one
  that records a confirmed create in its place. Nothing else asks for it.
- The confirm in `addVideoByInput` is, by design, nearly dead code. It is cheap, and it is the
  backstop for the render gate rather than a substitute for it.
