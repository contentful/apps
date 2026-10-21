# ADR-0001: Request OAuth scopes per action

**Date:** 2026-10-19
**Status:** Proposed
**Deciders:** SFCC app maintainers

## Context
The app originally requested `sfcc.catalogs sfcc.products` for every call. Adding customer
group, promotion, campaign, coupon and store references needs `sfcc.customergroups`,
`sfcc.promotions` and `sfcc.stores`. Account Manager rejects a client-credentials request that
asks for a scope the API client was not granted, so adding the new scopes to every token request
would break every existing installation whose client only has the product/catalog scopes.

Alternatives considered:
- **Request all scopes always** — simplest, but breaks existing installs until every customer
  updates their API client.
- **Installation-level toggle per resource** — explicit, but adds configuration editors must keep
  in sync with their Account Manager client.

## Decision
Each function invocation requests the base scopes plus only the scope its resource needs
(`scopesFor` in `functions/index.ts`). Missing scopes surface as an auth error only on the field
types that need them.

## Consequences

### Positive
- Existing product/category installations keep working with no Account Manager changes.
- Customers opt in to new field types by granting the matching scope.

### Negative
- A missing scope is only discovered when an editor opens a field of that type.

### Neutral
- The config screen lists which scopes each field type needs.
