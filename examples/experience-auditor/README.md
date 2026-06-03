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
  `getNode()` → `getProperties()`, runs a set of pure rules, and re-runs
  automatically on `sdk.exo.experience.onChange()`.
- **Scored dashboard** — a 0–100 health score with error / warning / info
  counts.
- **Locate on canvas** — clicking **Locate** calls
  `selection.set(nodeId)` + `selection.highlight(nodeId, { flash, scrollIntoView })`
  to jump straight to the offending component (visual mode only).
- **One-click fixes** — where a safe, deterministic fix exists (e.g. trimming
  stray whitespace from alt text), the app applies it via
  `getNode().setContentProperty()`, permission-checked with `sdk.access.can()`
  and confirmed through `sdk.notifier`.
- **Pre-publish gate** — `experience.publish()` is blocked while any error-level
  finding remains.

### Audit rules

| Rule | Severity | What it checks |
| --- | --- | --- |
| `a11y/image-alt-text` | error / warning | Images must have non-empty alt text; trims stray whitespace |
| `content/required-empty` | warning | Headings/titles should not be empty |
| `seo/missing-meta` | info | SEO meta fields should be populated |
| `content/broken-binding` | error | Entry-bound properties must resolve to an entry |

The rules live in [`src/audit/rules.ts`](src/audit/rules.ts) as pure functions
over a SDK-independent `CollectedNode` shape, so they are fully unit-tested
without a live SDK. Adding a rule is a matter of dropping another `AuditRule`
into `AUDIT_RULES`.

## Architecture

```
src/
  audit/
    types.ts     SDK-independent domain types (CollectedNode, AuditFinding, …)
    rules.ts     Pure audit rules
    engine.ts    Runs rules, aggregates findings, computes the score
    collect.ts   The only SDK-coupled piece: walks sdk.exo.experience → CollectedNode[]
  components/
    ScoreSummary.tsx
    FindingList.tsx
  locations/
    ConfigScreen.tsx
    ExperienceToolbar.tsx   Wires the SDK to the engine (collect → audit → locate/fix/publish)
```

Keeping the rules pure and the SDK boundary thin (`collect.ts`) is the key
pattern: all the interesting logic is testable in isolation, and the live SDK
work is small enough to reason about.

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
which are the contract for the toolbar location. At the time of writing the host
renderer that serves `sdk.exo` at runtime is still rolling out, so the app is
**type-verified and unit-tested against a mocked SDK** (audit rules, scoring,
collector, and the toolbar's locate/fix/publish-gate behavior all have tests),
but not yet verified end-to-end inside a live ExO editor. The API shapes used
here match the published types exactly.

## Available scripts

- `npm start` — run in development mode
- `npm run build` — production build to `build/`
- `npm run test:ci` — run the test suite once
- `npm run upload` / `npm run upload-ci` — deploy the bundle to Contentful

## Libraries

- [Forma 36](https://f36.contentful.com/) — Contentful's design system
- [App SDK](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/) — the `sdk.exo` reference
