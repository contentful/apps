# Agent Guide — google-analytics

## What This App Does
Displays Google Analytics (Universal Analytics / GA3) metrics for the content being viewed — page views, sessions, and other stats — in the entry editor. Published as `@contentful/google-analytics`.

> **Note**: Universal Analytics (GA3) was sunset by Google in July 2023. This app targets the GA3 API and may be in maintenance-only mode. For GA4, see the `google-analytics-4` app.

## Archetype
Standard Vite app (legacy). Not using the standard `src/locations/` directory pattern.

> **Warning**: Uses the **legacy Forma 36** library (`forma-36-react-components`, `forma-36-fcss`, `forma-36-tokens`), NOT `@contentful/f36-*`.

## Structure

```
src/
├── index.tsx          # App entry + location router
├── AppConfig.tsx      # Config screen
├── Analytics.tsx      # Main sidebar analytics display
├── Timeline.tsx       # Time-series chart component
└── utils.ts           # GA API utilities
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/forma-36-react-components` | **Legacy** Forma 36 |
| `@contentful/forma-36-fcss` | **Legacy** CSS utilities |
| `@contentful/forma-36-tokens` | **Legacy** design tokens |

## Sharp Edges & Invariants

- **Legacy Forma 36** — do not use `@contentful/f36-*` here.
- **TypeScript (.tsx), but legacy patterns** — types may be incomplete or use `any`.
- **GA3 API is sunset** — if this app needs significant work, evaluate migrating to GA4 (`google-analytics-4`) instead.
- Google OAuth token is managed via the Google Identity Services — stored in installation parameters.

## Never / Always

- **Never** use `@contentful/f36-*` components here.
- **Always** check if `google-analytics-4` is a better target for any new feature work.
