# Agent Guide — optimizely

## What This App Does
Integrates Optimizely (A/B testing and feature flagging platform) with Contentful. Lets editors connect Contentful entries to Optimizely experiments and variations, and view experiment status from within Contentful.

## Archetype
Standard Vite app (legacy). Published as `@contentful/optimizely`.

> This app uses **JSX, not TSX**. TypeScript is not enforced. Uses a non-standard location routing pattern.

## Structure

```
src/
├── index.jsx          # App entry + location router
├── index.spec.jsx
├── AppPage/           # Full-page app view
├── EditorPage/        # Entry editor integration
├── Sidebar/           # Entry sidebar
├── ConnectButton/     # OAuth connection UI
├── components.spec.jsx
├── hooks/             # useOptimizely, etc.
├── optimizely-client.js  # Optimizely REST API client
├── constants.js
└── util.js
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Current Forma 36 |
| `@contentful/f36-icons` | Icons |
| `@contentful/f36-tokens` | Design tokens |

## Sharp Edges & Invariants

- **JSX, not TSX** — all files are `.jsx` or `.js`. Do not add TypeScript without a migration plan.
- **Non-standard location routing**: locations are routed in `src/index.jsx` using directory-based components (`AppPage/`, `Sidebar/`, `EditorPage/`), not a `locations/` directory.
- **Optimizely OAuth**: uses Optimizely's OAuth 2.0 flow. The `ConnectButton/` component handles the OAuth handshake. Token storage — check `src/optimizely-client.js`.
- **Snapshot tests** (`src/index.spec.jsx`, `src/components.spec.jsx`) — UI changes will break snapshots. Update intentionally.
- Optimizely's API rate limits are per-project — be careful with polling experiment status.

## Never / Always

- **Never** add TypeScript to this app without a full migration plan.
- **Always** update snapshots intentionally after UI changes (`vitest --update-snapshots`).
