# ADR-0014: A destructive Robots parameter is armed on the form and named at the confirm step

**Date:** 2026-09-17
**Status:** Accepted

## Context

`moderate` takes an optional `on_flagged` object. It has exactly one documented field:

> `on_flagged.action` — "Action to take when exceeds_threshold is true. `delete_playback_ids`
> deletes every playback ID on the asset, making it unplayable while preserving the underlying
> asset so it can be re-published or reviewed."

and one documented value, `delete_playback_ids`. The reference adds a caveat of its own: "in a
directive run that targets the same asset with other workflows, deleting playback IDs can break
sibling workflows that need a playback ID."

Three forces pull against each other. The parameter makes the video unplayable everywhere it is
embedded, which is not something to offer behind a bare checkbox in a CMS. It is not a shape
problem: `on_flagged` is as well documented as `thresholds`, which the form exposes without
comment. And leaving it out does not stop the runs: an editor who wants this configures it on the
Mux directive instead, where the app cannot see it, cannot warn about it and cannot tell the entry
what happened — which is how ADR-0010's "entry rendered as empty because its asset could not be
played" arises. Omitting the control stops the app knowing about the runs, not the runs.

Arming an action that makes a video unplayable is only half a feature if Contentful has no way to
make it playable again. ADR-0015 supplies the other half.

Alternatives considered:

- **Leave it out of the catalog.** The editor who needs this gets it from Mux with less visibility,
  not never.
- **A checkbox on the form and nothing else.** A checkbox sets a flag; it does not tell anyone what
  the flag does, and the consequence lands minutes later when a job completes.
- **A second confirm dialog of its own.** The run modal already has a confirm step that names the
  workflow and its cost, put there because Robots spends money on a click. Adding a third screen
  for a fourth click makes the *existing* confirm cheaper to dismiss, which is the opposite of the
  point.
- **A validation error, so the run cannot be built.** Wrong mechanism. ADR-0012 uses `showWhen` to
  make a request Mux *documents as invalid* unconstructable; this run is perfectly valid and may
  well be what the editor wants. What they must not do is arrive at it uninformed.
- **The `formOnly` + `showWhen` pairing from ADR-0011.** That pattern exists to gate an optional
  object whose contents are required-ish, so the editor can express "not at all" without a
  synthetic enum member. `on_flagged` has one sub-field, so there is nothing for a gate to reveal:
  the checkbox and the select would be the same control drawn twice.

## Decision

**`on_flagged.action` is exposed as a select with two options: `''`, which sends nothing, and
`delete_playback_ids`.** `''` is the default. One control, because the object has one field — and
`buildRobotsParameters` never creates a parent object for a value it was not given, so the default
leaves `on_flagged` out of the request entirely rather than sending it empty.

Its `''` option is labelled "Do nothing — just record the scores", not the catalog's shared
`NO_PREFERENCE_LABEL`. Every other `''` in the catalog sits on a best-effort steering parameter
where absence means no steering; here the reference documents `on_flagged` as optional, so absence
has a definite meaning — nothing is done to the asset. "No preference" would imply Mux might still
act. The test that holds every other select to "No preference" carves this one out by name, so a
steering select added later is still covered by construction.

**A `confirmWarning` is catalog data, keyed on the value that arms it.** `RobotsParamField` has
`confirmWarnings`, and `confirmWarnings(definition, values, context)` collects the ones that apply
to what the form currently says. The run modal renders them last on the confirm step, as `negative`
notes below the pricing line, so the run's cost and its damage are read together.

Keyed on the value rather than on the field being present, because the risk belongs to the value:
`on_flagged.action` is harmless until it says `delete_playback_ids`. Derived on every render rather
than captured when Continue is pressed, so going Back, changing the select and returning shows the
truth. Filtered through the same `isFieldVisible` that decides what is sent, so a parameter cannot
be armed without its warning, or warned about after being hidden.

**The warning names the blast radius, not the parameter.** That playback stops everywhere the video
is embedded and not only in Contentful; that anything needing a playback ID breaks with it,
including the other workflows of a directive run on this asset — the reference's own caveat, which
applies to this asset's future directive runs even though the run being confirmed is a single job;
and that the asset, its captions and everything recorded on the entry survive, with the Playback
tab able to request a new playback ID.

**`moderate`'s `notes` say nothing about the action being unavailable**, and a test asserts they do
not claim it is "not offered here". The catalog header comment lists `on_flagged.action` beside the
parameters it deliberately leaves out, as the one that is exposed, with its risk carried by
`confirmWarning` and its way back by the Playback tab, and points to this ADR and ADR-0015.

## Consequences

### Positive
- The editor who wants this gets it where the app can see it: the job is recorded on the entry
  (ADR-0005), the resync after completion covers `moderate` changing the asset, and the "no
  playback IDs" notice explains the end state.
- The mechanism generalises. A future parameter with a consequence worth stating declares it beside
  the control, and no component learns about a specific workflow.
- The two screens divide cleanly: the form is where a run is described, the confirm step is where
  its cost and its consequences are. `notes` are workflow-wide; these are the only thing on that
  screen that depends on what the editor chose.

### Negative
- `confirmWarnings` compares `values[field.name] ?? field.defaultValue` against a string
  `whenValue`, so it only keys off fields whose form value is a string. Enough for every case there
  is, and it would need widening for a warning on a boolean or a row array.
- The confirm step can be reached with a warning on it that the editor has already read and
  dismissed once, since it is recomputed rather than acknowledged. That is the right side to err
  on, but it means the screen gets noisier the more warnings the catalog grows.

### Neutral
- The reference lists exactly one value for `action`. A select with one option is furniture by this
  catalog's own rule, and this one escapes it only because "do nothing" is a real second choice.
  If Mux documents a second action, it is one more option and no new machinery.
