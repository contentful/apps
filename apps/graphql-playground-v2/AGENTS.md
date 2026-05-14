# Agent Guide — graphql-playground-v2

## What This App Does
Updated version of `graphql-playground` — embeds a GraphQL query playground inside the Contentful web app, pre-configured to query the Contentful GraphQL Content API. Uses current Forma 36 and modern tooling.

## Archetype
Standard Vite app.

## Structure

```
src/
├── index.tsx          # App entry and location router
├── assets/
└── components/        # GraphQL playground wrapper
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Current Forma 36 |
| `@contentful/f36-layout` | Layout components |
| `@contentful/f36-tokens` | Design tokens |
| `@contentful/react-apps-toolkit` | `useSDK()` |

## Sharp Edges & Invariants

- This is the **v2 / current** version — prefer this over `graphql-playground` for all changes.
- The GraphQL playground is embedded as a component (check `package.json` for the specific library — likely `graphql-playground-react` or `@graphiql/react`). Pin its version carefully; major versions can break the embedded experience.
- The playground endpoint and CDA token are read from `sdk.parameters.installation` and `sdk.ids.space`.
- No `src/locations/` directory — location routing is handled directly in `src/index.tsx`.

## Never / Always

- **Never** make changes to `graphql-playground` (v1) when the fix should be in v2.
- **Always** verify that the GraphQL playground works with the Contentful GraphQL endpoint after any dependency upgrade.
