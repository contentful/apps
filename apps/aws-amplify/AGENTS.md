# Agent Guide — aws-amplify

## What This App Does
Integrates with AWS Amplify to trigger builds and show deploy status for Amplify-hosted sites. Appears in the Entry Sidebar with build status and trigger controls.

## Archetype
Standard Vite app. Published as `@contentful/aws-amplify`.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure AWS Amplify App ID, branch, and credentials |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Show build status and trigger new builds |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/integration-component-library` | Shared build/deploy UI components (Contentful internal) |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useCMA()` |
| `contentful-management` | CMA for reading space/entry context |

## Source Layout

```
src/
├── App.tsx
├── locations/       # ConfigScreen, Sidebar
├── components/
├── config.ts        # AWS Amplify config constants
└── lib/             # AWS API client wrapper
```

## Sharp Edges & Invariants

- **`@contentful/integration-component-library`** — this is an internal Contentful package. Check its API carefully before upgrading; it is not published publicly and may change without semver guarantees.
- **AWS credentials** (App ID, branch, access key) are stored in installation parameters. Never log them.
- Build triggers call AWS Amplify's REST API — the `lib/` directory contains the client. Errors from AWS must be caught and surfaced via Forma 36 notifications, not console logs.
- The Sidebar polls for build status — respect the polling interval already in place; aggressive polling will hit AWS rate limits.

## Never / Always

- **Never** embed AWS credentials in the app bundle — all credential access must go through `sdk.parameters.installation`.
- **Always** use `useAutoResizer()` in the Sidebar.
