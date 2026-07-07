# Agent Guide — netlify

## What This App Does
Connects Contentful spaces to Netlify sites. Shows build status in the Entry Sidebar and lets editors trigger Netlify builds directly from Contentful. Published as `@contentful/netlify-build-and-preview`.

## Archetype
**Legacy Lambda + Frontend** app.

## Structure

```
apps/netlify/
├── frontend/          # React app
│   └── src/           # Standard Vite app with locations/
├── lambda/            # AWS Lambda — Netlify webhook and build API proxy
│   ├── app.js
│   ├── handlers/      # Route handlers
│   └── helpers/
└── images/            # Logo assets
```

## Key Dependencies (frontend)

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Current Forma 36 |
| `@contentful/f36-icons` | Icons |
| `@contentful/f36-tokens` | Design tokens |
| `date-fns` | Date formatting for build timestamps |

## Sharp Edges & Invariants

- **Lambda proxies Netlify API** — the frontend does not call the Netlify API directly. All Netlify build hooks and status checks go through the Lambda. Netlify build hook URLs are sensitive (they trigger builds without authentication).
- **Lambda URL** is in installation parameters.
- **Build hook URL** is a secret — it is stored in installation parameters and only ever sent to the Lambda, not exposed in the frontend.
- The Lambda uses Node.js — check `lambda/package.json` for its runtime version and dependencies separately from the frontend.
- Netlify build status is polled — the Sidebar polls the Lambda for build status updates. Respect the polling interval.

## Never / Always

- **Never** expose Netlify build hook URLs in the frontend bundle or logs.
- **Never** call the Netlify API directly from the frontend.
- **Always** handle the case where the Lambda is unreachable (network error, cold start timeout).
