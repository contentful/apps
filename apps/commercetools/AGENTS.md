# Agent Guide — commercetools

## What This App Does
Integrates commercetools (e-commerce platform) with Contentful. Lets editors pick commercetools products/categories directly from Contentful field editors. Published as `@contentful/commercetools`.

## Archetype
**Ecommerce base app** — wraps `@contentful/ecommerce-app-base`. Published as `@contentful/commercetools`.

## Structure

```
apps/commercetools/
└── src/
    ├── index.tsx              # Mounts ecommerce-app-base with commercetools config
    ├── api/                   # commercetools API client
    ├── config.ts              # Connection config constants
    ├── constants.ts
    ├── dialog.ts              # Dialog renderer passed to ecommerce-app-base
    ├── types.ts
    ├── additionalDataRenderer.tsx  # Custom renderer for product metadata
    └── logo.svg
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/ecommerce-app-base` | Provides entire product picker UI and CMA wiring |
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI (for `additionalDataRenderer`) |
| `@contentful/react-apps-toolkit` | `useSDK()` |

## Sharp Edges & Invariants

- **All core UI lives in `ecommerce-app-base`** — do not reimplement product listing, search, or config screens here. Extend via the provided callbacks (`fetchProductPreviews`, `renderDialog`, `additionalDataRenderer`).
- **`additionalDataRenderer.tsx`** renders extra product metadata (e.g. price, stock) alongside the standard product preview — it receives a product object from commercetools. Changes here require that the commercetools API response shape is understood.
- **commercetools API credentials** (client ID, secret, project key) are stored in installation parameters — never log them.
- **`commercetools-without-search`** is a sibling app with the same architecture but without the search capability — keep changes aligned between the two when fixing shared logic.

## Never / Always

- **Never** bypass `ecommerce-app-base` to implement custom product picker UI.
- **Always** return products in the format expected by `ecommerce-app-base`.
