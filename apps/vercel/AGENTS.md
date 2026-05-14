# Agent Guide — vercel

## What This App Does
Connects Contentful spaces to Vercel projects. Triggers Vercel deployments from the Entry Sidebar, shows deploy status, and provides preview URLs for draft content. Published as `@contentful/vercel-app`.

## Archetype
**App Actions + Frontend** app.

## Structure

```
apps/vercel/
├── frontend/                  # React app
│   └── src/                   # ConfigScreen + Sidebar
├── app-actions/               # App Action handlers
├── contentful-app-manifest.json
├── build-actions.js
└── package.json
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-scripts` | Deploy tooling |
| `contentful-management` | CMA in app-actions |

## Sharp Edges & Invariants

- **App Actions handle all Vercel API calls** — Vercel's API tokens are kept server-side. The frontend only displays status and triggers actions.
- **Vercel API token** is in installation parameters (accessed in app-actions, not exposed to frontend).
- **Deploy hook URL** is a sensitive secret — it triggers deployments without authentication. Store in installation parameters, never expose to the browser.
- **Preview URLs**: Vercel generates per-deployment preview URLs. The app must correctly construct these from deployment data returned by the Vercel API.
- `contentful-app-manifest.json` defines App Action signatures — update when adding new actions.

## Never / Always

- **Never** expose the Vercel API token or deploy hook URL to the frontend browser.
- **Never** call the Vercel API from the frontend — all Vercel API calls go through App Actions.
- **Always** update `contentful-app-manifest.json` when adding or removing App Actions.
