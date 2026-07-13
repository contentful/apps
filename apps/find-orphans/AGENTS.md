# Agent Guide — find-orphans

## What This App Does
Full-page app that scans an environment for "orphaned" draft entries — typically empty entries
accidentally created from a reference field when the user meant to link an existing entry. An
orphan is a draft (never published, not archived) with no value in its display (title) field in
the default locale; with the `untouchedOnly` parameter (default on) it must also never have been
saved after creation (`sys.version === 1`). Results deep-link into the entry editor and can be
archived in bulk.

## Archetype
Standard Vite app. Page location plus an app-config screen for installation parameters.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_PAGE` | `src/locations/Page/` | Scan + results table + bulk archive |
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Installation parameters |

## Installation Parameters

Defined in `src/parameters.ts`; the constants in `src/locations/Page/utils/constants.ts` are the
defaults. All parameters are **required** on the app definition, with their default values set
there too — the ConfigScreen pre-fills the defaults and rejects saves with empty or out-of-range
values. `resolveParameters()` remains the defensive fallback on the Page side, so a scan never
runs with missing or invalid settings.

| Parameter ID | Type | Required | Default | Purpose |
|--------------|------|----------|---------|---------|
| `maxCandidates` | Number | Yes | 500 | Hard cap on candidate entries per scan |
| `batchSize` | Number | Yes | 5 (max 7) | Concurrent CMA requests (scan queries, archiving) |
| `untouchedOnly` | Boolean | Yes | true | Only flag drafts never saved after creation (`sys.version === 1`) |

Parameter definitions on the app definition must use these exact IDs and types; the README
documents the full table (including descriptions) for the app definition setup.

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK (`sdk.cma`, `sdk.navigator`) |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()` hook |
| `contentful-management` | CMA types (`ContentTypeProps`, `EntryProps`) |

## Source Layout

```
src/
├── App.tsx
├── parameters.ts         # Installation parameter types, defaults, resolver
├── components/           # LocalhostWarning
└── locations/
    ├── ConfigScreen.tsx  # Installation parameter form
    └── Page/
        ├── index.tsx     # Page UI, scan orchestration
        ├── types.ts      # Result/progress types
        ├── components/   # OrphanTable
        └── utils/
            ├── constants.ts     # Fallback defaults for parameters
            ├── entryActions.ts  # Batched bulk archive (pure, unit-tested)
            └── orphanFinder.ts  # All CMA query logic (pure, unit-tested)
```

## Sharp Edges & Invariants

- **Draft scope is fixed and filtered server-side**: every entry query includes
  `sys.publishedAt[exists]=false` and `sys.archivedAt[exists]=false`. The remaining criteria are
  evaluated client-side.
- **The empty-title check must stay client-side**: the API's `[exists]` operator misses
  whitespace-only titles, and with a `select` query the CMA omits the `fields` object entirely
  from entries that have no value in any selected field — both shapes count as orphans.
- **The version check must stay client-side too**: `sys.version` is not a queryable attribute in
  CMA entry searches, but it rides along in every returned `sys` object, so it costs nothing.
  Version 1 means "never saved after creation" only because published and archived entries are
  already excluded — publish/unpublish/archive/unarchive also bump `sys.version`.
- **Default-locale only**: the missing-title check and title rendering use `sdk.locales.default`.
  Localized titles in other locales are not considered.
- **Content types without a text display field are skipped entirely** — their entries cannot be
  missing a title, so querying them would waste API calls.
- **One entry query per content type is unavoidable** (entry queries require a single
  `content_type`), so the scan runs those queries `batchSize` at a time in parallel chunks. A
  chunk shares one remaining-budget snapshot and can overshoot `maxCandidates`; the result is
  trimmed and flagged truncated afterwards.
- **`maxCandidates` caps each scan** — the UI shows a truncation warning. Keep the cap or replace
  it with real pagination, but never scan unbounded.
- **Pagination order needs the `sys.id` tiebreaker**: entries sharing an `updatedAt` (bulk
  imports) sort non-deterministically otherwise, and skip-based paging can drop or duplicate
  them.
- **`resolveParameters()` clamps `batchSize` to 7** (the CMA req/s limit per space) — keep that
  clamp.
- **Never read `sdk.parameters.installation` directly** — always go through `resolveParameters()`
  so fresh installs and hand-edited values fall back to safe defaults.
- **`sdk.app.setReady()` must stay in the ConfigScreen init effect** — without it the config
  screen never leaves its loading state.
- **Keep `orphanFinder.ts` free of React/UI imports** — it is the unit-tested core; the Page
  component only orchestrates state and rendering.
- **README (including the mermaid diagram) must track logic changes** — the scan criteria are
  documented in three places that must agree: README, the Page intro paragraph, and the
  ConfigScreen help texts.

## Never / Always

- **Never** perform bulk actions without an explicit confirmation dialog — archiving goes through
  `ModalConfirm`, and any future delete action must do the same.
- **Never** abort a bulk archive on the first failure — `archiveEntries` collects failures so the
  remaining entries still get processed; failed entries stay listed and selected for retry.
- **Always** surface CMA failures via Forma 36 `Notification.error` and empty states via `Note`.
- **Always** keep row clicks selection-only — opening the slide-in editor is a dedicated
  "Preview" action so accidental clicks never navigate.
