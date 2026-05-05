# Agent Guide — commercetools-without-search

## What This App Does
Same as the `commercetools` app but without the product search capability — intended for commercetools configurations that do not have search enabled. Published as `@contentful/commercetools-without-search`.

## Archetype
**Ecommerce base app** — wraps `@contentful/ecommerce-app-base`. Structurally identical to `commercetools` minus search.

## Structure

```
apps/commercetools-without-search/
└── src/
    ├── index.tsx     # Mounts ecommerce-app-base, search disabled
    ├── api/          # commercetools API client (subset — no search)
    ├── config.ts
    ├── constants.ts
    ├── dialog.ts
    └── types.ts
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/ecommerce-app-base` | Provides entire product picker UI |
| `@contentful/app-sdk` | App Framework SDK |

## Sharp Edges & Invariants

- This app intentionally omits the search feature — do not add it here; use the `commercetools` app instead.
- Shares the same API client pattern as `commercetools` — when fixing commercetools API bugs, check if they apply here too.
- `ecommerce-app-base` requires a `fetchProductPreviews` function to be passed — this app provides a listing-only version.

## Never / Always

- **Never** add search functionality here — that app is `commercetools`.
- **Always** keep this app's API client in sync with `commercetools` when the commercetools API shape changes.
