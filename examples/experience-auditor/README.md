# Experience Auditor

A polished, real-world example app for the **Experience Editor toolbar** — the
`experience-toolbar` location introduced in
[`@contentful/app-sdk@4.58.0`](https://www.npmjs.com/package/@contentful/app-sdk).

Experience Auditor runs alongside the Experience Orchestration (ExO) editor and
continuously audits the experience you are editing for **accessibility, SEO, and
content-completeness** issues. It demonstrates the standout capability of the
toolbar location: **live, selection-aware tooling that reads _and_ mutates the
experience tree as the author works.**

> Looking for the bare-bones starter instead? See the
> [`experience-toolbar`](../experience-toolbar) example, which demonstrates the
> minimal `sdk.exo` patterns. Experience Auditor builds on those to show a
> complete, opinionated app.

## What it does

- **Live audit** — walks the experience tree with `getRootNodes()` →
  `getProperties()`, runs a set of pure rules, and re-runs automatically on
  `sdk.exo.experience.onChange()`.
- **Scored dashboard** — a 0–100 health score with error / warning / info
  counts.
- **Locate on canvas** — clicking **Locate** calls
  `selection.set(nodeId)` + `selection.highlight(nodeId, { flash, scrollIntoView })`
  to jump straight to the offending component (visual mode only, and only where
  the host backs the selection surface — see _Capability-aware behavior_).
- **One-click fixes** — findings can carry a fix that writes back via
  `getNode().setContentProperty()`, permission-checked with `sdk.access.can()`
  and confirmed through `sdk.notifier`. Fixes come in two kinds (see below).
- **Pre-publish gate** — `experience.publish()` is blocked while any error-level
  finding remains.

### Audit rules

| Rule                     | Severity        | What it checks                                                        |
| ------------------------ | --------------- | --------------------------------------------------------------------- |
| `a11y/image-alt-text`    | error / warning | Images must have non-empty alt text; trims stray whitespace           |
| `content/required-empty` | warning         | Headings/titles should not be empty                                   |
| `seo/missing-meta`       | info            | SEO meta fields should be populated                                   |
| `content/broken-binding` | error           | Entry-bound properties must resolve via the host's binding resolution |
| `a11y/heading-order`     | warning         | Heading levels should not skip (e.g. H2 → H4)                         |

Most rules are **per-node**: they look at a single component's properties in
isolation. `a11y/heading-order` is **cross-node** — it reads the heading levels
across the experience in order, so it lives alongside the per-node rules but is
applied by the engine over the full node list rather than node-by-node.

The per-node rules live in [`src/audit/rules.ts`](src/audit/rules.ts) as pure
functions over a SDK-independent `CollectedNode` shape, so they are fully
unit-tested without a live SDK. Adding a per-node rule is a matter of dropping
another `AuditRule` into `AUDIT_RULES`.

### One-click fixes

A finding can offer a fix, and there are two kinds — the distinction matters
because one is safe to apply blindly and the other is not:

- **Deterministic** — exactly one correct result, applied immediately on click.
  Examples: trimming surrounding whitespace from alt text, or setting a skipped
  heading to the level that keeps the outline sequential. There is nothing to
  review, so the app just writes the value.
- **Suggested** — a proposed value the author reviews and edits _before_ it is
  written. Example: deriving an SEO meta value from the component's heading. The
  app pre-fills the suggestion with its provenance, and the author can accept it
  as-is or change it. **A suggested value is never written silently** — the
  write only happens after the author confirms.

The fix shapes are modelled as a discriminated union in
[`src/audit/types.ts`](src/audit/types.ts) (`AutoFix`), so the toolbar can route
each kind to the right UI and the rules stay declarative about what they offer.

### Capability-aware behavior

Not every `sdk.exo` surface is backed by every host, and surfaces can roll out
incrementally. Rather than call a method and catch the failure, the app probes
up front which surfaces are available
([`src/audit/capabilities.ts`](src/audit/capabilities.ts)) and adapts its UI to
match. Concretely: where the host does not back selection, **Locate** is
rendered **disabled** with an explanation of why, instead of calling an
unsupported API and erroring.

This is a pattern worth copying for any app that depends on optional or
still-rolling-out host capabilities: detect once, degrade gracefully, and tell
the user why an affordance is unavailable rather than letting it fail.

## Architecture

```
src/
  audit/
    types.ts          SDK-independent domain types (CollectedNode, AuditFinding, AutoFix, …)
    rules.ts          Pure audit rules (per-node + the cross-node heading-order rule)
    engine.ts         Runs rules, aggregates findings, computes the score
    fixes.ts          Pure derivation of suggested fix values (e.g. meta from heading)
    capabilities.ts   Probes which optional sdk.exo surfaces the host backs
    collect.ts        The only SDK-coupled piece: walks sdk.exo.experience → CollectedNode[]
  components/
    ScoreSummary.tsx
    FindingList.tsx   Groups findings by severity; renders locate + fix affordances
    SuggestedFix.tsx  Review-and-edit step for suggested fixes
    EmptyState.tsx
  demo/
    DemoProvider.tsx  Dev-only: renders the toolbar against the seeded mock (?demo)
    mockExo.ts        Seeded in-memory sdk.exo for the demo
  locations/
    ConfigScreen.tsx
    ExperienceToolbar.tsx   Wires the SDK to the engine (collect → audit → locate/fix/publish)
```

Keeping the rules pure and the SDK boundary thin (`collect.ts`) is the key
pattern: all the interesting logic — rules, scoring, suggested-fix derivation,
capability detection — is testable in isolation, and the live SDK work is small
enough to reason about.

## How to use

```bash
# npx
npx create-contentful-app --example experience-auditor

# npm
npm init contentful-app -- --example experience-auditor

# Yarn
yarn create contentful-app --example experience-auditor
```

Then:

```bash
npm install
npm start
```

### Try it locally (demo mode)

You can drive the full audit → suggested-fix → re-score loop without a live host
at all:

```bash
npm start
# then open:
http://localhost:3000/?demo
```

The `?demo` flag renders the toolbar against a seeded, in-memory experience so
you can click an audit, accept or edit a suggested fix, and watch the score
update. It is a **dev-only convenience with no live canvas** — because there is
no real selection surface behind it, **Locate is disabled in the demo** (an
illustration of the capability-aware behavior described above). The demo
scaffolding is dynamically imported and stripped from production builds; the
real runtime is inside the Contentful host.

## Registering the toolbar location

Like other toolbar apps, this is **not** assigned per content type — there is no
`EditorInterface` target state. It renders whenever the `experience-toolbar`
location is registered on your app definition. Create one with:

```bash
npm run create-app-definition
```

selecting the **App configuration screen** and **Experience toolbar** locations,
pointing the app at `http://localhost:3000`.

## A note on verification

This app is built against the published `@contentful/app-sdk@4.58.0` types,
which are the contract for the toolbar location. The host renderer that serves
`sdk.exo` at runtime is still rolling out, so the app is **type-verified and
unit-tested against a mocked SDK** — 40 tests cover the audit rules, scoring,
the collector and its binding resolution, capability detection, the suggested-
fix derivation, and the toolbar's locate / fix / publish-gate behavior. It is
not yet verified end-to-end inside a live ExO editor; that live verification is
tracked separately as the host renderer rolls out. The API shapes used here
match the published types exactly.

## Available scripts

- `npm start` — run in development mode
- `npm run build` — production build to `build/`
- `npm run test:ci` — run the test suite once
- `npm run upload` / `npm run upload-ci` — deploy the bundle to Contentful

## Libraries

- [Forma 36](https://f36.contentful.com/) — Contentful's design system
- [App SDK](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/) — the `sdk.exo` reference
