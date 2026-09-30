# ADR-0002: The publish function merges the field value instead of replacing it

**Date:** 2026-09-28
**Status:** Accepted

## Context

`onPublish` is the second writer of the Mux field, and it writes from a server with no knowledge of
the browser. When an entry is published carrying `pendingActions`, the function runs those actions
against Mux and then refreshes the field from a fresh `GET /video/v1/assets/{id}`.

Several forces meet in that refresh:

1. Some keys exist only because the browser wrote them: `robotsJobs`, `robotsOutputs`,
   `robotsDirectiveRuns` and `robotsPendingCreates`. A refresh that builds a fresh object from a
   fixed key list and assigns it over the field destroys them, and publishes the result.
2. The field carries a version. A refresh that asserts one downgrades newer records or bumps older
   ones, and either makes the browser's next diff see a change that is not one.
3. Each locale holds its own value. One object assigned to every locale flattens them.
4. Both writers derive the same mirror keys from the same asset. If they filter differently, a
   publish swaps the field's `captions` for a differently filtered list — an errored track, or a
   non-subtitle text track such as `cues`, reappears on the entry — and keeps it until the next
   browser resync.
5. A mirror key clears only if it is written as `undefined`, which JSON drops on the way to the
   CMA. A key merely absent from the mirror keeps whatever the entry already held.
6. The function runs in two cycles — clear `pendingActions` and update, then rebuild the field and
   republish — so a browser guard keyed off `pendingActions` still being present lifts one cycle
   before the rewrite lands.

Only the first locale of the field is scanned for pending actions, so actions queued from any
other locale never run.

Alternatives considered:

- **Have the browser stop writing during a publish, and leave the function alone.** Rejected as
  insufficient: the browser cannot observe the function directly, so any gate is a heuristic. A
  heuristic in front of a destructive replace is not a fix.
- **Have the function skip the field refresh entirely** and let the browser resync. Rejected: the
  refresh is what makes a publish leave correct data behind for consumers even if the editor closes
  the tab immediately.
- **Reconcile Robots outputs inside the function**, so a directive that ran unattended lands its
  output at publish time. Rejected: the function early-returns unless there are `pendingActions`,
  so it would only help on the narrow subset of publishes that carry one. Making it run on every
  publish means an entry update plus republish on every publish, which re-triggers the same event —
  a loop that needs its own guard, for a case the browser covers on its next read. What this
  leaves, a publish mid-job carrying the job's unfinished state, is the subject of ADR-0013.
- **Make the browser's caption filter match the function's** (`type === 'text'`, any status).
  Rejected: it would put errored tracks on every entry, which is what the browser filter exists to
  avoid, and it would rewrite the `captions` array of every entry on its next resync.
- **Share the caption predicate through a build step.** Rejected: `frontend/` and `functions/` are
  separate packages with independent builds, and a build dependency between them is a much larger
  commitment than a few duplicated lines.
- **Write `captions: []` when the asset has no tracks.** Rejected: it would differ from what the
  browser stores for the same asset, so the next browser diff would see a change and write the
  field again (ADR-0006).

## Decision

`mergeMuxAssetIntoField` (in `functions/src/helpers/muxField.ts`) spreads the existing locale value,
overlays only the keys the function owns, derives the version rather than asserting it, and is
called once per locale with *that locale's* value. Every browser-owned key survives, including
`robotsPendingCreates`. `pendingActions` is set only when actions actually failed, and **deleted**
otherwise — not set to `null`. Every published entry already has the key absent once its actions
have run, and `null` would both differ from that (the browser's next diff would see a change and
bump the entry version for nothing) and make the next publish's pending-action scan index into
`null` and throw from outside the handler's try block.

The keys the function owns are `MUX_ASSET_MIRROR_KEYS`, and the mirror is built by iterating them:
`buildMuxAssetMirror` in `functions/src/onPublish.ts` supplies one value per key as a
`Record<MuxAssetMirrorKey, unknown>`, and `buildAssetMirror` writes every listed key, `undefined`
included. A key listed but not supplied is a compile error, and a key whose value is gone clears.
`captions` and `audioTracks` are `undefined` rather than `[]` when the asset has none, which is what
the browser stores.

Which tracks go into `captions` is decided by `isCaptionTrack`: `text_type === 'subtitles'` with
status `ready` or `preparing`. It is defined twice, in `frontend/src/index.tsx` and
`functions/src/onPublish.ts`, with each copy's comment naming the other. The browser's filter is
the definition, because it is the one every existing entry was written with.

A 404 from Mux is the one case that does not merge. `fetchMuxAsset` returns nothing on a 404 and
throws on every other failure; `updateEntryFieldWithMuxAsset` then sets the whole field to
`undefined`, Robots keys included, while a thrown error is caught per field and leaves it as it
was. The field is a mirror of a Mux asset: if Mux says the asset does not exist, there is nothing
for the entry to describe, and keeping provenance and outputs for a video that cannot be played,
resynced or re-run would make every consumer tell that state apart from a live one. ADR-0010's
argument that Robots data is unrecoverable is about losing it by accident; this loses it because
the asset it describes was deleted, and only on a positive answer that it was.

The first-locale-only scans are left as they are. The pending-action scan reads the first locale
only; widening it would make the next publish execute actions queued in a non-default locale that
have never run, including asset deletes queued long ago and forgotten, which is a destructive
surprise to ship to installs that already exist. It is only hardened against a `null`
`pendingActions`, which the first cycle writes. The 404 has the same shape: it is decided from the
first locale's `assetId` and applied to every locale.

Alongside the merge, the browser holds a **publish gate**: when a sys change shows the entry was
published while `pendingActions` were present, browser writes are parked until the function's own
publish lands, or `PUBLISH_GATE_TIMEOUT_MS` (90 s) passes. Parked mutators are then re-applied
against the value the function left behind (ADR-0001).

Outputs from jobs that completed with nobody watching are reconciled in the browser on its next
Robots read, not at publish time.

## Consequences

### Positive
- The worst case in the publish window is "briefly stale", not "destroyed": the function overwrites
  the asset mirror, Robots keys survive, and the next poll reconciles.
- A publish never downgrades the version and never flattens per-locale values.
- A publish leaves exactly the caption list the app itself would have written, and a deleted last
  track clears instead of lingering.
- A key added to `MUX_ASSET_MIRROR_KEYS` and forgotten in the mirror stops type-checking.

### Negative
- The gate is a heuristic, not a lock. It narrows the window; the merge is what makes the remainder
  survivable. Both are needed and neither is sufficient alone.
- A directive that runs unattended lands its output on the next Robots read, which produces a draft
  change the editor did not ask for. Unavoidable while the field JSON is the delivery path.
- An asset deleted from the Mux dashboard, followed by a publish carrying any unrelated pending
  action, clears the field's Robots history along with the mirror. A field whose locales point at
  different Mux assets loses the live ones alongside the dead one.

### Neutral
- The pending-action scan still reads one locale, as it always has.
- `deriveFieldVersion` and `isCaptionTrack` each exist in both `functions/` and `frontend/`. The two
  are separate packages with independent builds — the same split as `util/apiClient.tsx` and
  `functions/src/helpers/muxClient.ts`. The version rule is held together by the mirrored
  `muxFieldVersionParity.test.ts` tables on each side; the caption filter by the comments that
  name each other.
