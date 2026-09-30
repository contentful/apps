# ADR-0004: The apply-to-entry dialog is the field mapping UI

**Date:** 2026-09-21
**Status:** Accepted

## Context

Generated summaries are only *retrievable* on the field JSON, not *queryable*: the Delivery API
cannot filter, search or order on values inside a JSON object field. To query by a generated title
or tag, the value has to land on a real entry field. That needs a mapping from output to field.

The mapping writes, so a wrong guess overwrites an editor's copy. And a feature that only appears
once its own output exists cannot be found by anyone who has not already used it.

Alternatives considered:

- **Per-content-type instance parameters.** Rejected: instance parameter *definitions* live in the
  App Definition, which Contentful owns and which is not in this repo, so declaring them is a
  change on their side rather than a PR. The app declares none. And the app does not render that
  form — Contentful generates it from the declaration, so the mapping UI would be text boxes where
  someone types field IDs by hand (`seoDescription`, not the label "SEO Description"), failing
  silently on a typo until an editor clicks Apply.
- **Installation parameters holding a content-type → field map.** Workable and needs nothing from
  Contentful, but it is a config screen an admin has to fill in before an editor gets any value, for
  a mapping the app can usually guess correctly.
- **A pure convention with no UI**, the way `MetadataConfiguration` finds a `title` field and syncs
  it to the Mux asset. Rejected on its own: that case only *reads*, so guessing wrong is free —
  worst case the Mux asset has no title. This case writes.
- **A checkbox per row beside the target dropdown.** Rejected: two controls for one decision can
  disagree, and a dropdown that already offers "Do not apply" makes the checkbox redundant.

## Decision

The apply-to-entry dialog *is* the mapping UI. It opens from an `Apply summary` button that is
always on the Robots tab, disabled with a tooltip saying what has to happen first until a
summarize output is stored — the disabled-with-a-reason pattern `TrackList` and
`Mp4RenditionsList` already use.

The dialog has one row per generated output (title, description, tags) with the generated value
beside the field's current value. Each row has a single control, a target dropdown filtered to
type-compatible fields, and `Do not apply` is how a row is skipped. Choosing a target is the whole
decision, so pre-filling one is consent to write: `defaultTargetFieldId` pre-fills the
convention's suggestion only when `wouldOverwrite` says the field is empty. A row it declined names
the field it would have chosen.

Each row is in one of three states, keyed on `matchesGeneratedValue` and `wouldOverwrite`:

- the field already holds **this** value — "Title already holds this value. Nothing to apply.",
  and an `Already applied` badge if the editor targets it anyway;
- the field holds **something else** — "SEO Description already has content. Pick it as the target
  to replace it.", and a `Will be replaced` badge once targeted;
- the field is empty — pre-filled, nothing to warn about.

`matchesGeneratedValue` compares by value: strings exactly, tags element by element and in order,
Rich Text through `richTextToPlainText`. Both strict readings fail towards "has other content",
the state that says something.

Text outputs can target `Symbol`, `Text` and `RichText` fields; tags target lists of `Symbol` or
`Text`. A Rich Text field holds a document, not a string, so `valueForField` wraps the generated
string at the write in the minimal valid document: one `paragraph`, one unmarked `text` node,
`data` on every node and `marks` on the text node, matching `@contentful/rich-text-types`'
`EMPTY_DOCUMENT` (v16.8.5). The shape is declared locally rather than imported, because that
package is only a transitive dependency of `contentful-management` and the document format is the
CDA/CMA wire format. Reading goes through `richTextToPlainText`, so an occupied Rich Text field
previews as its text and a field holding only an empty document counts as empty. Tags are not
offered Rich Text targets: a list of strings has no single-document home.

Everything the dialog needs is already at the field location: `sdk.contentType.fields` for names,
`sdk.entry.fields[id]` for type, `items` and `setValue`. No CMA call, no App Definition change, no
config screen. Writes go to the default locale unless the field is not localized there, in which
case its own locale is used. Fields are written independently so one validation failure does not
discard the rest.

## Consequences

### Positive
- Nothing to configure, and nothing needed from Contentful.
- An editor sees exactly what would be replaced before anything is written, and one control per row
  cannot contradict itself.
- An editor who has never run a Robots job can see the feature and read what it would take.
- Reopening the dialog after applying reads as done rather than as a row needing attention.
- A Rich Text body, the most obvious target a marketing content type has for a generated
  description, is a valid target.

### Negative
- The mapping is not remembered between runs. For bulk work that is repetitive; installation
  parameters could carry a remembered choice later as an add-on.
- Only summarize output is mappable. Moderation scores are numbers no editor would paste into a
  text field, and chapters/scenes/key moments are structured arrays with no single-field home.
- A Rich Text write flattens to one paragraph: a multi-paragraph description arrives as a single
  block with the newlines inside it. Splitting on blank lines would guess at structure the model
  never expressed, and a document that does not validate breaks the field's editor outright. A
  split would be a change to `richTextDocument` alone.
- Equality is exact, so an editor who changed one character sees "already has content" again. The
  dialog cannot tell "edited" from "never applied" without storing the applied value somewhere.

### Neutral
- Where a content type has no type-compatible field, the dialog says so rather than silently
  skipping — the opposite of the read-only convention's behaviour, and deliberately so.
- Rich Text is offered for `title` as well as `description`. The conversion is identical for both,
  and a type rule that applied to one text output and not the other would be arbitrary.
