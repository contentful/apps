# ADR-0012: A controlled vocabulary is one atomic field, and a documented cross-field rule is a shape, not an error

**Date:** 2026-09-24
**Status:** Accepted

## Context

Three Robots workflows take a controlled vocabulary under `output_steering`:

- `find-scenes` — `topic_taxonomy`, sub-schema documented in full.
- `find-key-moments` — `topic_taxonomy`, **listed with no type, no description and no sub-schema**.
  The only evidence for its shape on that page is its parent's summary, "Curated output_steering
  controls for execution scope, selection strategy, title style, audience, taxonomy, and rubric
  tie-breakers."
- `summarize` — `tag_taxonomy`, documented in full *and* with six explicit caps: "Supports up to 50
  values and 2000 serialized characters", a name "up to 100 characters", "Supports 1-50 values", a
  label "up to 100 characters", a description "up to 300 characters", and "Up to 10 aliases, each
  up to 100 characters."

All three share one shape: `{ name?, values: [{ label, description?, aliases? }], allow_other? }`.
The reference renders no *Required* badge on any sub-field of these request bodies, and that
absence carries no information: the running API refuses a `summarize` run whose `tag_taxonomy`
has no `allow_other`, with `parameters.output_steering.tag_taxonomy.allow_other: Invalid input:
expected boolean, received undefined`. Which parts are mandatory once the object is present is
answered by the API, not by the page.

Separately, two workflows document a rule that spans two parameters:

- `generate-premium-captions`' `upload_to_mux`: "Whether to upload the generated VTT to the Mux
  asset as a new text track. Defaults to true. When false, no track is created and
  `replace_existing` must also be false; the generated SRT remains available via
  `temporary_srt_url`."
- `edit-captions`' `delete_original_track`: "Whether to delete the original source text track after
  the edited track upload succeeds. Has effect only when `upload_to_mux` is true. Defaults to true."

Rendered as independent checkboxes, each pair lets an editor tick two individually reasonable boxes
and then be refused for it — the form describing a request it will not let them make. The same
problem has two more shapes: a well-formed request this asset cannot satisfy (a workflow that reads
the transcript, on an asset with no caption track), and a whole workflow the asset cannot run
(`find-scenes` on an audio-only video). The first is accepted by Mux and errors minutes later, after
the editor has been told the run started and has been charged for finding out.

Alternatives considered for the vocabularies:

- **Three dotted-path fields per taxonomy** (`…tag_taxonomy.name`, `.values`, `.allow_other`), which
  is how every other nested parameter in the catalog works. It lets the three parts be set
  independently, which is exactly the problem: a name and an `allow_other` with no values produces
  `tag_taxonomy: { name: 'x', allow_other: false }` — a controlled vocabulary with nothing in it,
  against a schema that says "Supports 1-50 values". It also has nowhere to hang a cap that is
  about the object as a whole, like the 2000 serialized characters.
- **A tri-state `allow_other` with a "No preference" member that omits it.** Absence is not an
  outcome the API accepts, so the third state would only produce refused runs.
- **Borrow `summarize`'s caps for `topic_taxonomy`.** Tempting, since the shape matches. But those
  numbers belong to a different workflow's schema, and a cap we invent blocks a run Mux accepts.
- **Leave `find-key-moments`' `topic_taxonomy` out, since its shape is undocumented.** The
  parameter itself *is* documented — it is listed in the request body. Omitting a documented,
  editorially useful control because one page is thinner than its sibling costs the editor a real
  capability over a formatting gap in the docs.

## Decision

**A taxonomy is one form field of kind `taxonomy`, holding one `TaxonomyValue`.** Rows are edited
as flat strings (`aliases` is a comma-separated box, exactly like `ask-questions`' answer options)
and converted in `toApiParamValue`, so the renderer stays generic and the conversion is testable
without mounting a component — the same split `questions` and `replacements` use.

**The object is sent only when it has at least one labelled value, and `values` is always present
when it is.** A name with no values is reported to the editor by `validateParams`, naming the name,
rather than dropped in silence.

**`allowOther` is a plain boolean, defaulting to `true`, and always sent with the object.** Where a
sub-field's required-ness decides the shape, the form sends it unconditionally or cannot leave it
out; a badge the reference does not render is not evidence either way. The default is `true`
because `false` is documented on `summarize` as a hard filter — "generated tags are filtered to
taxonomy labels and aliases" — and an editor who adds a vocabulary without touching the control
must not have the rest of the model's output discarded for it. `asTaxonomyValue` reads anything
non-boolean as `true`. `name`, `values[].description` and `values[].aliases` are still omitted when
empty: there is no API response showing any of them is required, and requiring one on no evidence
would block a run Mux may accept.

**Caps are declared as data per field, in `taxonomyLimits`, and an absent limit means the reference
states none.** `summarize` gets all six documented figures plus the serialized-size cap, measured
over `JSON.stringify` of the object actually sent. `find-scenes` and `find-key-moments` get none.

**`find-key-moments`' `topic_taxonomy` uses `find-scenes`' documented sub-schema**, as one shared
descriptor, and inherits no caps from `summarize`.

**A request Mux documents as invalid is made unconstructable with `showWhen`.**
`replace_existing` and `delete_original_track` are hidden — and therefore unsent — while
`upload_to_mux` is off, and each sits below the checkbox that gates it. `validateParams` has no rule
for the `generate-premium-captions` combination, because the form cannot build it.

**`showWhen` can key off what the asset is, not only off another field.** `moderate`'s
`language_code` — "Used only for audio-only assets; ignored for video assets with visual content" —
declares `{ context: 'isAudioOnly', notEquals: false }`. The condition is `notEquals` rather than
`equals` on purpose: `isAudioOnly` is tri-state, and an unknown asset kind must still render the
control. Hiding a usable control on missing information is the worse of the two failures.

**A well-formed request this asset cannot satisfy is refused by `validateParams` before Continue.**
`find-key-moments` without `use_shots`, and `generate-chapters` always, need a caption track and are
refused on `RobotsAssetContext.hasCaptions === false`; chapters' message does not offer visual
evidence as the way out, because it has no `use_shots`. The reference calls chapters'
`language_code` "the caption track to analyze". `summarize`, `ask-questions` and `find-scenes` pick
a caption track the same way and are not gated: a field that selects captions is not a documented
prerequisite, and a restriction we invent blocks a run Mux accepts. `translate-audio`'s documented
"The run is rejected if the video has no audio track" is not enforced either: the API rejects that
create synchronously, so the editor learns at once, and the asset context has no audio-track key.

**Continue is disabled while `validateParams` reports anything**, with the first error as its
title. `handleContinue` keeps the same check, which is what stops a keyboard or programmatic
activation getting past the disabled button.

**A workflow the asset cannot run is offered disabled, not refused.** The catalog's
`requiresVideoTrack` marks `find-scenes` — documented: "Audio-only assets are not supported." — and
`find-best-thumbnails`, which is **a product decision, not a documented restriction**: the reference
says nothing about audio-only assets, but the workflow ranks frames and such an asset has none.
`workflowUnavailableReason` is the one place that reads the flag. The picker lists every workflow
and shows these two as "… (not available for audio-only)" on a known audio-only asset; an unknown
kind disables nothing. The form never holds an unavailable workflow: `availableWorkflow` swaps it
for the default — a preselected `initialWorkflow`, or a choice made before the asset turned out to
be audio-only — and the swap sticks. The confirm step is tied to the workflow it was reached for,
so it cannot survive the swap and confirm the default by accident. `find-key-moments`' `use_shots`
on an audio-only asset stays a `validateParams` refusal: it is a parameter the asset restricts, and
the rest of that form is still usable.

**The scope window is refused by `validateParams`, because there is nothing to hide.** Six
workflows take `output_steering.scope`, "an optional execution window in seconds on the original
asset timeline". A start at or past the end is an empty window and is refused, keyed on the
parameters rather than on workflow names so a workflow that gains a scope gains the rule. When the
asset's duration is known, a *start* past the end of the video is refused too. An *end* past it is
not: the window still covers real content, and the reference does not say Mux rejects one. A live
stream's duration is still growing, so it is not passed.

## Consequences

### Positive
- The three documented controlled vocabularies are usable, and each workflow is held to its own
  documented limits rather than a shared guess.
- A request that Mux documents as invalid cannot be built, so it cannot be refused. Hidden means
  unsent, and one predicate drives both, as for the profanity toggle (ADR-0011).
- Asset facts and form values gate fields through the same declarative mechanism, so
  `RobotsParamFields`, `validateParams` and `paramsFromFormValues` stay in agreement by
  construction. All three take the same `RobotsAssetContext`.
- A prerequisite is stated where it can still be acted on, and a form that refuses a run looks like
  it refuses it. Nothing on offer in the picker is refused later.

### Negative
- `taxonomy` is the first field whose form value is a nested object rather than a scalar or a row
  array. `asTaxonomyValue` exists to normalise it, and anything new reading form values directly
  has to go through it.
- The serialized-size cap is measured against our JSON. The reference does not say what it
  serializes, so this is the strict reading; it can refuse a taxonomy Mux would have accepted. The
  catalog's standing rule is that the stricter figure wins, because the looser one only buys a 400
  on a run the editor already confirmed.
- `find-key-moments`' taxonomy is built on a sibling page's schema. If Mux documents that page
  properly and the shape differs, this is where it breaks.
- The empty-omitted taxonomy keys are the untested part. If one comes back with its own
  `received undefined`, that response is the evidence, and the fix is the one made for
  `allow_other`.
- A chapters run on an asset whose caption track exists but is not mirrored yet is blocked by us
  rather than by Mux. `isCaptionTrack` admits `preparing`, so the window is the seconds between a
  track being attached and the asset poll seeing it, and Refresh closes it.
- An audio-only video whose editor wanted scenes meets a disabled option; the suffix is the whole
  of the explanation. If Mux documents a video-less path for thumbnails, the flag is the one line
  to remove.

### Neutral
- `prompt_overrides` stays off the catalog, with the reference's own wording: "Legacy/internal
  prompt-section overrides. Prefer output_steering for new integrations." It is documented on
  `summarize` and `generate-chapters`, exposed on neither, and a test asserts no catalog parameter
  path begins with it.
- `edit-captions`' `delete_original_track` gets the same treatment as `replace_existing` despite a
  weaker rule — "has effect only when" is an ignore, not a rejection. A checkbox that provably does
  nothing is still worth removing.
- `validateParams` is a list of `if (definition.key === …)` blocks plus the parameter-keyed scope
  rule, rather than anything data-driven. A handful of preconditions across twelve workflows does
  not pay for a mechanism, and each has been a different shape.
- The five `language_code` fields that pick a caption track are labelled "Captions to read", which
  is what the reference means by "the caption track to analyze"; a language label reads as the
  language of the result.
