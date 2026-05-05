# Agent Guide — dropbox

## What This App Does
Integrates Dropbox as a Digital Asset Management (DAM) source. Lets editors pick files from Dropbox directly from Contentful field editors.

## Archetype
**DAM base app** — thin wrapper around `@contentful/dam-app-base`. Published as `@contentful/dropbox-assets`.

## Structure

```
apps/dropbox/
└── src/
    ├── index.jsx     # Mounts dam-app-base with Dropbox config
    └── logo.svg
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/dam-app-base` | Provides the entire DAM integration UI |
| `react` | Peer dependency |

## Sharp Edges & Invariants

- **All core logic lives in `dam-app-base`** — this file is ~50 lines configuring the base library.
- **JavaScript (JSX), not TypeScript** — do not add TypeScript here without a migration plan.
- **Dropbox Chooser SDK**: Dropbox's file picker is loaded via a script tag from `https://www.dropbox.com/static/api/2/dropins.js`. This is a third-party script — it must be whitelisted in CSP and will fail in environments that block external scripts.
- The Chooser runs in a popup window — popup blockers can prevent it from opening.

## Never / Always

- **Never** bypass `dam-app-base` extension points.
- **Always** return files in the format `dam-app-base` expects (array of asset objects).
