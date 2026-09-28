# ADR-0001: A single serialized write path for the Mux field value

**Date:** 2026-09-28
**Status:** Accepted

## Context

Two poll loops write the Mux field. The asset loop polls Mux every 500 ms while an asset prepares;
the Robots loop polls every few seconds for minutes. Both do a read-modify-write of the same JSON
object field.

`this.state.value` is refreshed by `sdk.field.onValueChanged`, asynchronously. A writer that builds
its next value from component state can be building on a value that is already out of date. With
one loop that staleness is invisible. With two it is a lost update in both directions: a Robots
write landing mid-flight in the asset loop gets rebuilt away, and an asset write landing mid-flight
in the Robots loop clobbers freshly polled asset state.

A writer that rebuilds the whole value from a fixed allowlist of keys drops every key it does not
know about, and the asset loop writes several times a second while an asset prepares.

And every `setValue` bumps the entry version and flips a published entry to *Changed*, so a write
that changes nothing is not free.

Alternatives considered:

- **Fold Robots into the asset loop.** One loop, one writer, no race. Rejected: 500 ms while an
  asset prepares and 5–10 s across several minutes are different problems, and merging them would
  multiply app-action calls (each costs at least two CMA requests) for no benefit.
- **Rely on the `isPolling` / `pollPending` guard.** Rejected: that guard is re-entrancy protection
  for `pollForAssetDetails` against *itself*. It says nothing about a second loop.
- **A mutex around `setValue`.** Rejected as insufficient on its own: serialising the writes
  without also reading the authoritative value inside the critical section still loses updates,
  because the value being written was computed from stale state before the lock was taken.
- **Derive Robots state and never persist it.** Viable for display alone. Rejected because
  `robotsOutputs` and the other Robots records are persisted from the same loop regardless
  (ADR-0010), so the serialized write path has to exist either way.

## Decision

`App.updateField(mutate, options)` is the only place the field value is written. Callers describe
their own change as a mutator; `updateField` reads the current value through
`sdk.field.getValue()`, applies the mutator, skips the write when the normalized value is
unchanged, and chains concurrent calls on a promise so they serialize. While the publish gate is
shut (ADR-0002) a mutator is parked, and it is re-applied against the value the publish function
left behind.

Each call can also pass `UpdateFieldOptions`: `save` persists the entry as soon as the value lands,
`onParked` tells the caller its write is waiting behind the publish gate, and
`flushOnUnmount: false` drops a still-parked write when the editor closes instead of flushing it.
ADR-0010 records why the Robots writes use them.

Three writes stay direct because they deliberately discard everything: `resetField`, pasting an
existing Mux asset ID, and the upload-id → asset-id handoff.

`pollForAssetDetails` spreads the current value first and overlays only the keys it owns.

## Consequences

### Positive
- The two loops cannot clobber each other, and no future writer can either.
- Keys the asset loop does not know about survive, which is what makes the Robots keys possible at
  all.
- No-op writes are impossible, which is enforced in one place. That is what keeps entries with no
  Robots data byte-identical to what is on disk, so they never flip to *Changed*.

### Negative
- Reading the field rather than React state means a mutator cannot use component helpers that read
  state. `swapPlaybackIDs` works out the current policy from the value it is handed for exactly
  this reason.

### Neutral
- Callers get a promise that rejects on a failed write, or with `DiscardedFieldWriteError` when a
  parked write is dropped, while the internal chain never rejects.
