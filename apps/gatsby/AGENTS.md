# Agent Guide — gatsby

## What This App Does
Connects a Contentful space to a Gatsby Cloud site. Shows build status and provides a preview link in the Entry Sidebar, and lets editors trigger new Gatsby builds.

## Archetype
Standard Vite app (legacy). Published as `@contentful/gatsby-preview`.

> **Warning**: This app uses the **legacy Forma 36** library (`@contentful/forma-36-react-components`, `@contentful/forma-36-fcss`, `@contentful/forma-36-tokens`), NOT the current `@contentful/f36-*` packages. Do not mix the two component libraries.

## Locations

Not using the standard `src/locations/` directory pattern. Locations are routed in `src/index.jsx`:

| File | Purpose |
|------|---------|
| `src/AppConfig/` | Config screen |
| `src/Sidebar.jsx` | Entry sidebar — build status and trigger |
| `src/index.jsx` | App entry and location router |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/forma-36-react-components` | **Legacy** Forma 36 — NOT `@contentful/f36-components` |
| `@contentful/forma-36-fcss` | **Legacy** Forma 36 CSS utilities |
| `@contentful/forma-36-tokens` | **Legacy** design tokens |
| `react` | UI |

## Sharp Edges & Invariants

- **Legacy Forma 36** — all UI must use `@contentful/forma-36-react-components`. Using `@contentful/f36-components` here will cause style conflicts and API errors.
- **JSX, not TSX** — this app uses `.jsx` files. TypeScript is not enforced.
- **Gatsby Cloud is deprecated** — Gatsby Cloud shut down in 2023. This app may be in maintenance-only mode. Confirm status before investing in significant changes.
- `src/index.spec.jsx` and `src/Sidebar.spec.jsx` use Jest snapshot tests — update snapshots if you change UI components.

## Never / Always

- **Never** use `@contentful/f36-*` components in this app — use only `forma-36-react-components`.
- **Never** add TypeScript to this app without a full migration plan.
