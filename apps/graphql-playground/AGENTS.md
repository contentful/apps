# Agent Guide — graphql-playground

## What This App Does
Embeds a GraphQL query playground inside the Contentful web app, pre-configured to query the Contentful GraphQL Content API for the current space. Published as `@contentful/graphql-playground`.

## Archetype
Standard Vite app (legacy). Not using the standard `src/locations/` directory pattern.

> **Warning**: Uses the **legacy Forma 36** library (`forma-36-react-components`, `forma-36-fcss`, `forma-36-tokens`), NOT `@contentful/f36-*`.

## Structure

```
src/
├── index.tsx          # App entry and location router
├── components/        # GraphQL playground wrapper components
└── assets/
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/forma-36-react-components` | **Legacy** Forma 36 |
| `@contentful/forma-36-fcss` | **Legacy** CSS |
| `@contentful/forma-36-tokens` | **Legacy** design tokens |
| `@contentful/field-editor-single-line` | Reused for input UI |

## Sharp Edges & Invariants

- **Legacy Forma 36** — do not use `@contentful/f36-*` here.
- The GraphQL playground component is likely a third-party library (e.g. `graphql-playground-react`) — check `package.json` for the specific version and its maintenance status before upgrading.
- The playground is pre-seeded with the Contentful GraphQL endpoint and the space's CDA token from `sdk.parameters`.
- See `graphql-playground-v2` for the updated version of this app.

## Never / Always

- **Never** use `@contentful/f36-*` components here.
- **Always** check `graphql-playground-v2` before making changes — the fix may be better applied there.
