# Agent Guide — google-analytics-4

## What This App Does
Displays Google Analytics 4 (GA4) metrics for Contentful content. Shows page-level performance data in the entry editor.

## Archetype
**Legacy Lambda + Frontend** app.

## Structure

```
apps/google-analytics-4/
├── frontend/           # React app
│   └── src/
│       ├── App.tsx
│       ├── apis/       # GA4 API client
│       ├── clients/    # Auth/token clients
│       ├── components/
│       ├── config.ts
│       ├── hooks/
│       ├── locations/  # Standard location pattern
│       ├── providers/
│       └── utils/
├── lambda/             # AWS Lambda — handles GA4 API proxying
├── shared/             # Shared types between frontend and lambda
└── README.md
```

## Key Dependencies (frontend)

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-*` | Current Forma 36 (NOT legacy) |

## Sharp Edges & Invariants

- **Lambda proxies GA4 API calls** — the frontend does not call the GA4 API directly. All GA4 requests go through the Lambda. This is required because GA4's Data API requires server-side credentials (service account JSON key).
- **Lambda URL** is in installation parameters.
- **`shared/`** directory: types and constants are shared between `frontend/` and `lambda/`. If you change a shared type, update both sides.
- **Google service account JSON** is stored in installation params — it is sensitive. Never log it.
- Unlike `google-analytics` (GA3), this app uses current Forma 36 (`@contentful/f36-*`).

## Never / Always

- **Never** make GA4 Data API calls from the frontend — all GA4 calls must go through the Lambda.
- **Never** log or expose the service account JSON key.
- **Always** keep `shared/` types consistent between frontend and lambda.
