# Mux

Contentful Marketplace App that allows customers to link to and work with Mux-hosted video assets.

## Front End

See the [front end README](./frontend/README.md) for more information about using and working with the front end.

## App Actions

This app relies on app actions to correctly sign JWT tokens in a secure context, and to proxy Mux
REST calls out of the browser (`functions/src/muxProxy.ts`).

## Functions

`functions/` is a standalone package with its own dependencies, build and tests:

```bash
cd functions && npm ci && npm test
```

## Robots

The Robots tab runs Mux AI workflows against the current video. Setup, requirements and the stored
data shape are documented in the [front end README](./frontend/README.md#robots).

## Architectural Decision Records

See [docs/ADRs](./docs/ADRs) for the reasoning behind the field write model, the publish-time
merge, how a Robots create is guarded, entry mapping, what Robots data the entry records, what this release
deliberately does **not** change for installs that already exist, why outputs are keyed by
workflow, why a directive run is recorded on the entry, what makes the field non-re-derivable, and
the two rules the run form is built on — form-only controls and atomic controlled vocabularies.

There is no ADR-0007; the number is unassigned.
