# Agent Guide — saleor

## What This App Does
Integrates Saleor (open-source e-commerce platform) with Contentful as a product picker. Lets editors select Saleor products for use in Contentful fields. Published as `@contentful/saleor`.

## Archetype
**Ecommerce base app** — wraps `@contentful/ecommerce-app-base`.

## Structure

```
apps/saleor/
└── src/
    ├── index.ts            # Mounts ecommerce-app-base with Saleor config
    ├── ApiClient.ts        # Saleor GraphQL API client
    ├── DataParser.ts       # Parses Saleor product data into base-app format
    ├── PaginatedFetcher.ts # Pagination over Saleor product listings
    ├── queries.ts          # GraphQL query definitions
    ├── constants.ts
    └── types.ts
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/ecommerce-app-base` | Provides entire product picker UI |
| `@contentful/app-sdk` | App Framework SDK |
| `graphql` | GraphQL client |

## Sharp Edges & Invariants

- **GraphQL API**: Saleor uses a GraphQL API (not REST). All product fetching goes through `src/ApiClient.ts` which executes the queries in `src/queries.ts`. Any product data shape changes must be reflected in both.
- **Pagination via `PaginatedFetcher.ts`**: Saleor's GraphQL API uses cursor-based pagination (`first`, `after` params). Do not refactor to offset pagination.
- **`DataParser.ts`**: transforms Saleor's product object shape into the format `ecommerce-app-base` expects. If Saleor's API changes, update the parser, not the base library.
- Saleor API URL and credentials are in installation parameters.

## Never / Always

- **Never** bypass `ecommerce-app-base` to implement custom product picker UI.
- **Never** switch from cursor-based to offset pagination — Saleor's GraphQL API requires cursors.
- **Always** update `DataParser.ts` when Saleor's product schema changes.
