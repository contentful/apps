# Agent Guide — frontify

## What This App Does
Integrates Frontify (brand management platform) as a Digital Asset Management (DAM) source. Lets editors pick Frontify assets directly from Contentful field editors.

## Archetype
**DAM base app** — thin wrapper around `@contentful/dam-app-base`. Published as `@contentful/frontify-assets`.

## Structure

```
apps/frontify/
└── src/
    ├── index.js      # Mounts dam-app-base with Frontify config
    └── logo.svg
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/dam-app-base` | Provides entire DAM integration UI |
| `@contentful/app-scripts` | Deploy tooling |
| `react` | Peer dependency |

## Sharp Edges & Invariants

- **All core logic in `dam-app-base`** — this is a configuration-only file.
- **JavaScript, not TypeScript.**
- **Frontify picker** opens via Frontify's JavaScript SDK. The SDK must be loaded — check how it is initialized in `src/index.js`.
- Frontify uses OAuth for authentication — access token flow is handled by the Frontify SDK, not this app. Credentials are in installation parameters.

## Never / Always

- **Never** implement a custom asset picker — use the Frontify SDK's provided picker.
- **Always** return assets in `dam-app-base` format.
