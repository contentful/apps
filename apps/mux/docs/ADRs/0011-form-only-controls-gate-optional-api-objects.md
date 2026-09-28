# ADR-0011: A form-only control gates an optional API object, instead of a synthetic enum member

**Date:** 2026-09-15
**Status:** Accepted

## Context

`edit-captions` takes an optional `auto_censor_profanity` object. Inside it, `mode` is an enum —
`blank`, `remove`, `mask` — and the reference documents `blank` as its default *when the object is
present*. The object itself is optional: the API requires at least one of `replacements` and
`auto_censor_profanity`, so "replace these words and censor nothing" is a perfectly ordinary
request.

A single `mode` select cannot express both intents. With a fourth, invented `''` option meaning
"do not censor", one control carries two unrelated decisions — *whether* to censor, and *how* —
and the sentinel for "not at all" sits in the same list as the three real enum members, so the
form's default can never be the API's documented `blank`. Preselecting `blank` instead makes every
`edit-captions` run censor, and the intent "censor nothing" is real and has to survive.

The steering selects — `find-key-moments`' `selection_strategy` and `title_style`,
`find-best-thumbnails`' `selection_strategy`, `summarize.tone`, and the `output_steering` style
selects on `summarize`, `generate-chapters` and `find-scenes` — have the same shape for a different
reason. Their reference pages document **no** default: they are best-effort guidance, in tables
that do say "Defaults to …" where one exists, so an absent parameter means no steering rather than
some other steering. An omit-this-parameter option is the only way to say that, and whatever it is
called must not claim a default Mux does not document.

Alternatives considered:

- **Preselect a real enum member on every select.** Ground rule on this feature is that we never
  invent a value. Picking `blank` for profanity censors runs nobody asked to censor; picking
  `face_or_action` for thumbnails steers every thumbnail run toward faces. Choosing a default the
  API does not document is inventing one, just at a higher level than inventing an enum member.
- **Keep `''` on the profanity select, labelled "Leave as is".** Leaves one control answering two
  questions, so the documented default can never be the form's default. It also reads as a fourth
  mode in a list of three.
- **Send `auto_censor_profanity: {}` and let Mux apply its own default.** Undocumented behaviour —
  the reference describes `mode`'s default within a present object, not what a present-but-empty
  object does. Not something to find out from production.

## Decision

Two rules, both expressed in the catalog rather than in component code:

**A `formOnly` field shapes the request without being a request parameter.** `edit-captions` has
`censor_profanity`, a checkbox that never reaches Mux. `paramsFromFormValues` drops it.

**A `showWhen` field is hidden and unsent by the same predicate.** The three `auto_censor_profanity.*`
fields declare `showWhen: { field: 'censor_profanity', equals: true }`. `RobotsParamFields` filters
on `isFieldVisible` and so does `paramsFromFormValues`, so the form cannot display one request and
send another. With the toggle off nothing profanity-related is sent at all; with it on, `mode` is
sent explicitly at its documented `blank`.

**Where the reference documents no default, the `''` sentinel stays, omits the parameter, and is
labelled `NO_PREFERENCE_LABEL` ("No preference").** Every steering select in the catalog uses it,
and `robotsCatalog.test.ts` holds that: no select may offer an option labelled "Default", every
steering `''` option reads "No preference", and the sentinel still sends nothing. The one `''`
option with a different label is `moderate`'s `on_flagged.action`, where absence has a definite
meaning (ADR-0014); the test carves it out by name, so a steering select added later is covered by
construction.

## Consequences

### Positive
- Both intents are expressible, and each control answers one question. "Censor nothing" is a
  cleared checkbox; "censor like this" is a documented enum member.
- The form's default matches the API's documented default wherever one exists, and nowhere claims
  one that is not documented.
- Visibility and payload come off one predicate, so a hidden field can never leak into a request.
- The pattern generalises. Any future optional API object with required-ish contents gets the same
  treatment without new component code.

### Negative
- `values` holds keys that are not parameter paths. Anything reading form values has to know that
  `formOnly` fields exist — `validateParams`' `edit-captions` check reads `censor_profanity`
  directly.
- A `showWhen` field's value survives while it is hidden. That is deliberate — toggling twice does
  not lose what was typed — but it means the stored form state can describe a request that is not
  being sent.

### Neutral
- `toApiParamValue` omits only empty values; it does not drop a value equal to its catalog default.
  Doing so would be wrong here: dropping `mode: 'blank'` leaves an `auto_censor_profanity` object
  with no mode in it.
