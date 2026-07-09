# Agent Guide — find-orphans

## What This App Does
Full-page app that scans an environment for "orphaned" draft entries — typically empty entries
accidentally created from a reference field when the user meant to link an existing entry. The
user selects criteria (missing display title, unreferenced, stale draft) and runs a scan; results
deep-link into the entry editor.

## Archetype
Standard Vite app. Page location plus an app-config screen for installation parameters.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_PAGE` | `src/locations/Page/` | Criteria panel + scan + results table |
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Installation parameters (scan limits) |

## Installation Parameters

Defined in `src/parameters.ts`; the constants in `src/locations/Page/utils/constants.ts` are the
defaults. All three parameters are **required** on the app definition, with their default values
set there too — the ConfigScreen shows the defaults only as placeholders and rejects saves with
empty or out-of-range values. `resolveParameters()` remains the defensive fallback on the Page
side, so a scan never runs with missing or invalid limits.

| Parameter ID | Type | Required | Default | Purpose |
|--------------|------|----------|---------|---------|
| `maxCandidates` | Number | Yes | 500 | Hard cap on candidate entries per scan |
| `defaultStaleDays` | Number | Yes | 30 | Pre-fill for the "not updated in N days" criterion |
| `referenceBatchSize` | Number | Yes | 5 (max 7) | Concurrent CMA requests (scan queries, reference counts, archiving) |

Parameter definitions on the app definition must use these exact IDs and the Number type; the
README documents the full table (including descriptions) for the app definition setup.

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
        ├── types.ts      # Criteria/result/progress types
        ├── components/   # CriteriaPanel, OrphanTable
        └── utils/
            ├── constants.ts     # Fallback defaults for parameters
            ├── entryActions.ts  # Batched bulk archive (pure, unit-tested)
            └── orphanFinder.ts  # All CMA query logic (pure, unit-tested)
```

## Sharp Edges & Invariants

- **Criteria are OR-combined** (`matchesAnyCriterion`): an entry is listed when it matches at
  least one selected criterion, so selecting more criteria widens the results. The CMA cannot OR
  independent filters in one query, so only the draft scope is filtered server-side; criteria are
  evaluated client-side. With no criteria selected, every draft is listed.
- **Draft scope is fixed**: every entry query includes `sys.publishedAt[exists]=false` and
  `sys.archivedAt[exists]=false`.
- **Default-locale only**: the missing-title check and title rendering use `sdk.locales.default`.
  Localized titles in other locales are not considered.
- **Missing-title never applies to non-text display fields**: `matchesAnyCriterion` requires
  `hasTitleField`, otherwise every entry of such a type would vacuously match. Those content
  types are skipped entirely only when missing-title is the sole selected criterion.
- **One entry query per content type is unavoidable** (entry queries require a single
  `content_type`), so the scan runs those queries `referenceBatchSize` at a time in parallel
  chunks. A chunk shares one remaining-budget snapshot and can overshoot `maxCandidates`; the
  result is trimmed and flagged truncated afterwards.
- **Reference counting is N+1**: one `links_to_entry` query per candidate (`limit: 0`, total
  only), batched `referenceBatchSize` at a time. `resolveParameters()` clamps the batch size to 7
  (the CMA req/s limit per space) — keep that clamp. When the unreferenced criterion is off, the
  scan filters by the cheap criteria first and only counts entries that will be listed — keep
  that ordering, it is the main cost control.
- **`maxCandidates` caps each scan** — the UI shows a truncation warning. Keep the cap or replace
  it with real pagination, but never scan unbounded.
- **Never read `sdk.parameters.installation` directly** — always go through `resolveParameters()`
  so fresh installs and hand-edited values fall back to safe defaults.
- **`sdk.app.setReady()` must stay in the ConfigScreen init effect** — without it the config
  screen never leaves its loading state.
- **Keep `orphanFinder.ts` free of React/UI imports** — it is the unit-tested core; the Page
  component only orchestrates state and rendering.

## Never / Always

- **Never** perform bulk actions without an explicit confirmation dialog — archiving goes through
  `ModalConfirm`, and any future delete action must do the same.
- **Never** abort a bulk archive on the first failure — `archiveEntries` collects failures so the
  remaining entries still get processed; failed entries stay listed and selected for retry.
- **Always** surface CMA failures via Forma 36 `Notification.error` and empty states via `Note`.
- **Always** keep row clicks selection-only — opening the slide-in editor is a dedicated
  "Preview" action so accidental clicks never navigate.
