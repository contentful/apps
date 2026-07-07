# Agent Guide — brandfolder

## What This App Does
Integrates Brandfolder's Digital Asset Management (DAM) system with Contentful. Lets editors pick Brandfolder assets directly from Contentful field editors.

## Archetype
**DAM base app** — thin wrapper around `@contentful/dam-app-base`. Almost no custom logic. Published as `@contentful/brandfolder-assets`.

## Structure

```
apps/brandfolder/
└── src/
    ├── index.js            # Mounts the DAM base app with Brandfolder config
    └── brandfolder-icon-favicon.png
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/dam-app-base` | Provides the entire DAM integration UI and CMA wiring |
| `@contentful/app-scripts` | Deploy tooling |
| `react` | Peer dependency required by dam-app-base |

## Sharp Edges & Invariants

- **All core logic lives in `@contentful/dam-app-base`** — do not reimplement picker dialogs, asset rendering, or config screens here. Changes to the integration UX should go into the base package.
- `src/index.js` supplies a `makeThumbnail` function (asset thumbnail renderer) and an `openDialog` function (launches Brandfolder's asset picker). These are the only two extension points.
- **JavaScript, not TypeScript** — this app uses `.js`. Do not add TypeScript without coordinating a migration of the base package consumer pattern.
- Brandfolder picker opens in a new browser window/tab via `window.open` — popup blockers can interfere. This is a known limitation of the Brandfolder SDK.

## Never / Always

- **Never** bypass `dam-app-base` to implement custom DAM UI — use the provided extension points.
- **Always** return assets in the format expected by `dam-app-base` (array of `{ id, url, filename, ... }`).
