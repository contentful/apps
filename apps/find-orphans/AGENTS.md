# Agent Guide — find-orphans

> Claude Code does not read AGENTS.md directly — the one-line `CLAUDE.md` beside this file
> imports it (`@AGENTS.md`) so it loads automatically every session. Keep both files.

## What This App Does
Full-page app that scans an environment for "orphaned" draft entries and media assets. Two
criteria, each in its own tab with its own scan button and its own cached results:

- **Untitled**: a draft (never published, not archived) with no title value in the default
  locale — typically created by accident from a reference field. These are confident junk.
- **Unreferenced**: a draft that no entry links to (`links_to_entry` / `links_to_asset` count
  is 0). A review lead, NOT proof of junk — top-level content (landing pages) is legitimately
  unreferenced. Copy must never claim these are safe to delete.

Scans are broad: edit history NEVER excludes results at scan time. Every result carries a
`neverEdited` flag (`sys.version === 1`) and the UNTITLED tab's results header has a segmented
view switch — "Show: All (N) / Never edited (M)" ToggleButton pills, exactly one always
pressed, clicking the active pill is a no-op — starting on Never edited (hardcoded; the
`untouchedOnly` parameter that once set this default is retired). The unreferenced tab has NO
never-edited switch at all (decided 2026-07-13: edit history says nothing about
referenced-ness). Keep it this way: silent scan-time
exclusion was tried first and read as "the scan is broken" when rows appeared in one tab and
not the other, and a single on/off toggle was tried next and read as ambiguous.

The scan scope (entries and/or assets) is a per-run checkbox choice, both on by default.
Results deep-link into the matching editor, can be archived in bulk, and can be exported to
CSV (with editor-link column) for offline review.

## Archetype
Standard Vite app. Page location plus an app-config screen for installation parameters.

## Command Run-book

| Task | Command | Needs |
|------|---------|-------|
| Dev server (localhost:3000) | `npm start` | Install the app in a space pointing at localhost, or you get the LocalhostWarning |
| Tests: watch / single run | `npm test` / `npm run test:ci` | — |
| Lint / lint with auto-fix | `npm run lint` / `npm run lint:fix` | ESLint 9 flat config (`eslint.config.mjs`); warnings fail the run |
| Production bundle | `npm run build` | — |
| Upload bundle to the app definition | `npm run build && npm run upload` | `.env` |
| Sync installation parameter definitions | `npm run update-app-parameters` | `.env`; run after editing the parameter list in `scripts/update-app-parameters.mjs` |
| Seed test data / remove it | `npm run seed-test-data` / `npm run seed-test-data:cleanup` | `.env.seed` |

## Credentials & Env Files

| File | Holds | Git status |
|------|-------|------------|
| `.env` | `CONTENTFUL_ACCESS_TOKEN` (CMA token), `CONTENTFUL_ORG_ID`, `CONTENTFUL_APP_DEF_ID` — the app definition is "Orphan Finder" | ignored (repo-root `.gitignore`) |
| `.env.seed` | `CONTENTFUL_SPACE_ID`, `CONTENTFUL_ENVIRONMENT_ID`, `SEED_*` knobs; token falls back to `.env` | ignored (this app's `.gitignore`) |
| `.env.seed.example` | Documented template for `.env.seed` | committed |
| `~/.contentfulrc.json` | `managementToken` from Contentful CLI login — fallback token source if `.env` is missing one | outside the repo |

The CMA rate limit is 7 requests/second per space — Shanon's test spaces have unlimited
entries but the STANDARD rate limit; never raise a concurrency knob past 7.

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

Retired parameters (do not reintroduce): `defaultStaleDays`, `referenceBatchSize` (pre-2026-07-09
design) and `untouchedOnly` (2026-07-13, briefly the never-edited default; retired because the
visible "All / Never edited" switch made an admin-level default pointless). Old installations
may still store their values — `resolveParameters()` ignores unknown keys.

Parameter definitions on the app definition must use these exact IDs and types. They are
scripted: `npm run update-app-parameters` (scripts/update-app-parameters.mjs) replaces the app
definition's installation parameters via the CMA — keep that script, `src/parameters.ts`, and
the README table in sync when parameters change.

## Test Data Seeding

`npm run seed-test-data` (scripts/seed-test-data.mjs) fills a test environment with known
quantities of each orphan shape — untitled drafts, titled unreferenced drafts, referenced
drafts linked from published containers, fileless draft assets, optional published filler —
and prints the expected scan results per criterion at the end. That summary is computed from
actual successful creates, not the configured counts: on partial failure it warns and adjusts —
notably, "referenced" items whose container failed to CREATE count as unreferenced, while a
container that was created but failed to PUBLISH still references its targets (`links_to_entry`
counts links from drafts) and itself appears as one extra unreferenced titled draft. Config
lives in `.env.seed`
(copy `.env.seed.example`; the CMA token falls back to `.env`). Everything it creates is
tagged `seedTestData` under content type `seedOrphanTest`, so `npm run seed-test-data:cleanup`
removes it exactly. The script is additive across runs; cleanup between runs for exact counts.
Published filler adds no API calls to a scan (draft filters are server-side) — it exists to
grow the corpus the `links_to_entry` searches run over.

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
        ├── index.tsx     # Page UI, scan orchestration, scope checkboxes
        ├── types.ts      # OrphanResult (entry|asset union) / progress types
        ├── components/   # OrphanTable
        └── utils/
            ├── constants.ts     # Fallback defaults for parameters
            ├── entryActions.ts  # Batched bulk archive, kind-routed (pure, unit-tested)
            ├── exportCsv.ts     # CSV building + download trigger (pure, unit-tested)
            └── orphanFinder.ts  # All CMA query logic, entries + assets (pure, unit-tested)
```

## Sharp Edges & Invariants

- **Draft scope is fixed and filtered server-side**: every entry and asset query includes
  `sys.publishedAt[exists]=false` and `sys.archivedAt[exists]=false`. The remaining criteria are
  evaluated client-side.
- **The empty-title check must stay client-side**: the API's `[exists]` operator misses
  whitespace-only titles, and with a `select` query the CMA omits the `fields` object entirely
  from items that have no value in any selected field — both shapes count as orphans.
- **The version check must stay client-side too**: `sys.version` is not a queryable attribute in
  CMA searches, but it rides along in every returned `sys` object, so it costs nothing.
  Version 1 means "never saved after creation" only because published and archived items are
  already excluded — publish/unpublish/archive/unarchive (and asset file processing) also bump
  `sys.version`.
- **Default-locale only**: the missing-title check and title rendering use `sdk.locales.default`.
  Localized titles in other locales are not considered.
- **Content types without a text display field are skipped by the untitled scan** — including
  types with NO display field configured (component types): their entries always render as
  "Untitled", but flagging every draft of them would sweep in legitimate work-in-progress.
  This, plus the "Never edited" filter (and the fact that archive→unarchive round-trips bump
  `sys.version`), is why an "Untitled" row can appear in unreferenced results and not on the
  untitled tab. That divergence is BY DESIGN and pinned in tests — investigated 2026-07-13
  after it was mistaken for a regression; do not "fix" it without Shanon deciding to change
  the criteria.
- **Every view-narrowing control must narrow the selection too** — the "Never edited" pills
  (`setNeverEditedFilter`) and the scope checkboxes (`setScope`, which live-filter cached
  results client-side as well as scoping the next scan; unchecking prunes selections in BOTH
  tabs since scope is shared). Otherwise "Archive selected" could archive rows the user can no
  longer see. When filters hide every result, render the explanatory `filtered-empty-note`
  naming the responsible filter, never a bare empty table.
- **Pagination is navigation, NOT a view-narrowing control** (added 2026-07-15): the results
  table pages client-side at `RESULTS_PAGE_SIZE` (50) via f36 `Pagination` — no API calls, all
  results are already in memory. Select-all (the header checkbox) deliberately spans EVERY
  page so "archive all N" is one click; the count line and the itemized archive confirmation
  are the guards. Do not prune the selection on page change. The page index lives in
  `TabState.page` (survives tab switches), resets to 0 whenever the displayed set is reshaped
  (new scan via `SCAN_RESET`, scope change, never-edited switch), and is CLAMPED at render
  time — not written back — so rows vanishing beneath the current page (bulk archive of the
  last page) can never strand the view on an empty page. The control renders only when the
  displayed set exceeds one page.
- **The CSV export is broad ON PURPOSE and must say so** (added 2026-07-15): "Export CSV"
  downloads the tab's FULL cached results — including rows hidden by the scope checkboxes and
  the never-edited view — with `Kind` and `Edited after creation` as columns, so filtering
  happens visibly in the spreadsheet, never silently in the file (same philosophy as the broad
  scan). The edit-history column is deliberately positive-phrased (Shanon, 2026-07-15: a
  "Never edited" yes/no column read as a confusing double negative); the UI's "Never edited"
  view maps to `Edited after creation = no`. Keep cell values plain yes/no.
  Because it ignores the visible filters, the button's tooltip must announce that; don't
  quietly change the export to the displayed subset. Titles export as EMPTY cells (not an
  "Untitled" placeholder) so blank-title spreadsheet filters match exactly the untitled
  results. `exportCsv.ts` is pure (no React) and unit-tested; keep the RFC 4180 quoting, CRLF
  line endings, the UTF-8 BOM (Excel mojibake otherwise), and the formula-injection guard
  (leading `=`/`+`/`-`/`@` gets a literal-text apostrophe — titles are content-controlled).
  Each row carries an Editor URL deep link (`…/entries/{id}` / `…/assets/{id}`, alias-aware).
- **No header info tooltip**: the page heading is plain (removed 2026-07-13); the app explains
  itself via the general subtitle and each tab's visible description.
- **One entry query per content type is unavoidable** (entry queries require a single
  `content_type`), so the scan runs those queries `batchSize` at a time in parallel chunks. A
  chunk shares one remaining-budget snapshot and can overshoot `maxCandidates`; the result is
  trimmed and flagged truncated afterwards.
- **Assets are one paged query** — they are homogeneous (no content type), so the whole media
  library is a single scan step that runs after the entry phase and spends whatever remains of
  the `maxCandidates` budget. This is why one scan button with scope checkboxes beats separate
  entry/asset CTAs: the asset step is marginal next to the entry fan-out.
- **Reference counting is N+1 and must stay batched**: the CMA filters `links_to_entry` /
  `links_to_asset` by ONE target id per query, so the unreferenced criterion costs one
  `limit: 0` count request per candidate, run `batchSize` at a time (`filterUnreferenced`).
  Never fan these out unbatched, and keep the cost warning in the unreferenced button's
  tooltip. The
  untitled criterion's content-type restriction (text display fields only) does NOT apply to
  the unreferenced scan — any entry can be a link target.
- **One criterion per scan, each criterion is a tab** (chosen 2026-07-13, evolving radio →
  two buttons → tabs; the OR-combined design was removed on 2026-07-09): results always have a
  single unambiguous meaning, only unreferenced scans pay the reference-count cost, and
  separate tabs keep the confident-junk vs review-lead expectations apart.
- **Per-tab state is cached and must survive tab switches** (`tabStates: Record<ScanCriterion,
  TabState>` — results, truncation, selection): switching tabs NEVER clears results or re-runs
  a scan; tab labels show the cached counts. Scans are exclusive (one `activeScan` at a time)
  and the scope checkboxes are shared across tabs.
- **Criterion explanations are visible text inside each tab's panel**, above the scan button —
  NOT tooltips on the tab labels (tried and removed 2026-07-13: they duplicated the adjacent
  visible description). The unreferenced description must lead with the one-request-per-draft
  cost warning. The archive button keeps its tooltip with an `InfoIcon` end-icon as the hover
  cue; the archive deep links live in the confirmation modal (a hover tooltip cannot hold
  clickable links).
- **`maxCandidates` caps each scan across both scopes** — the UI shows a truncation warning.
  Keep the cap or replace it with real pagination, but never scan unbounded.
- **Creator names are best-effort**: `resolveCreatorNames` batches `user.getManyForSpace`
  lookups (`sys.id[in]`, 100 ids per request) and swallows failures — unresolved creators render
  as "Unknown user", non-User `sys.createdBy` links (apps/automations) as "App". Never let a
  users-endpoint failure fail the scan. The results table shows **Created** (`sys.createdAt`),
  not last-updated: orphans are by default never edited after creation.
- **Archiving routes by kind**: `archiveOrphans` calls `cma.entry.archive` or
  `cma.asset.archive` per target — `OrphanResult.kind` must survive any refactor of the result
  shape, and preview likewise routes to `openEntry`/`openAsset`.
- **Mixed-kind selection is guarded twice, keep both**: the scope checkboxes (hide AND
  deselect a kind, so "archive only entries" = uncheck assets + select-all) and an archive
  confirmation that itemizes the selection by kind ("Archive 19 entries and 4 assets").
  Kind-scoped select-all ToggleButtons existed but were removed 2026-07-13 as redundant once
  the scope checkboxes became live filters — select-all deliberately spans every displayed
  kind, and per-kind result tables were also considered and rejected.
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
- **Docs are Shanon's run-book — update them unprompted**: whenever behavior, parameters, or
  tooling (scripts, npm commands, env files) change, update README.md and this file in the
  same change. Shanon relies on these to remember how things work and how to run them.

## Change Checklist

When you change one thing, these must move with it (Shanon relies on docs staying true):

| Changed... | Also update... |
|------------|----------------|
| Scan logic or criteria | README (including the mermaid diagram), the Page intro/tab copy, this file |
| Installation parameters | `scripts/update-app-parameters.mjs` (then RUN `npm run update-app-parameters`), `src/parameters.ts`, ConfigScreen, README table, the table above |
| npm scripts, env files, tooling | README Development section, the Run-book and env tables above |
| Any of the above | Claude's memory files (standing instruction — unprompted) |

## Marketplace Submission (Standard Contribution)

Source: "Field Team Guide - Requirements for building and submitting apps" (Confluence, by
Jenny Dobner): <insert Confluence link>. Submission is a PR to the Marketplace Apps (MPA)
repo with the app name in the PR title; after acceptance the Marketplace team owns the code
(no ongoing contributor obligations). Status against the guide's requirements:

| Requirement | Status |
|-------------|--------|
| TypeScript | Met — TS 5.9 throughout; `npx tsc --noEmit` is clean (2026-07-15) and must stay that way even though vite/vitest don't typecheck |
| Lint script in package.json | Met (2026-07-15) — `npm run lint`, ESLint 9 flat config in `eslint.config.mjs` modeled on apps/auto-prefix plus react-hooks; `--max-warnings 0` |
| Test script, no `--passWithNoTests` | Met — `npm test` (watch) / `npm run test:ci`, 69 real tests |
| Build and start scripts | Met — `npm start` / `npm run build` |
| README | Met — kept current per the Change Checklist above |
| No boilerplate/placeholder code | Met — LocalhostWarning is the standard scaffold component |
| OWASP basics / no hardcoded secrets | Met — tokens live in gitignored `.env`* files; CSV export even guards spreadsheet formula injection |
| Dependencies up to date | Met within majors (2026-07-15) — in-range bumps applied, TS on 5.9, `npm audit` clean. Major upgrades deliberately deferred as real migrations: React 19, f36 v6, vite 8, vitest 4, react-apps-toolkit 2, contentful-management 12 |
| Secret detection | Met — nothing sensitive committed; `.env` / `.env.seed` are gitignored |
| Bundle size ≤ 10 MB | Met — production bundle ~1.7 MB |
| Static site / no SSR | Met — plain Vite client-side build, uploadable via `npm run upload` |
| Accessibility basics | Met — f36 components plus explicit aria-labels on icon-only controls |
| App name in package.json | `find-orphans` — decide before the PR whether the marketplace name should match the app definition ("Orphan Finder") |

## Testing Notes

- `orphanFinder.ts` and `entryActions.ts` are the pure, unit-tested core — new query or
  archive logic gets tests there, not through the Page component.
- f36 `Tabs` activate on **mousedown**, not click — use the `switchTab` helper in
  `test/locations/Page.test.tsx` (fires both events) rather than a bare `fireEvent.click`.
- The untitled-vs-unreferenced result divergence (see Sharp Edges) is pinned in tests on
  purpose; a "failing" test there usually means the divergence rule was broken, not the test.

## Never / Always

- **Never** perform bulk actions without an explicit confirmation dialog — archiving goes through
  `ModalConfirm`, and any future delete action must do the same.
- **Never** abort a bulk archive on the first failure — `archiveEntries` collects failures so the
  remaining entries still get processed; failed entries stay listed and selected for retry.
- **Always** surface CMA failures via Forma 36 `Notification.error` and empty states via `Note`.
- **Always** keep row clicks selection-only — opening the slide-in editor is a dedicated
  "Preview" action so accidental clicks never navigate.
