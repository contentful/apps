# ADR-0001: App Identity for unattended CMA access

**Date:** 2026-08-06
**Status:** Accepted
**Deciders:** Adrian Meyer

## Context

This app is a companion to the `translation-api` service, which needs to make Content
Management API (CMA) calls from a webhook consumer and a periodic reconciliation job. Neither has a request-scoped user token available -- there's no end user in
the loop for a webhook delivery or a scheduled job, unlike every other CMA usage in that
service.

Contentful's App Framework offers a few ways to give a service like this CMA access:

1. **App Identity.** An App Definition with App Keys can mint short-lived App Access Tokens
   fully independent of any user session -- see
   [App Identity](https://www.contentful.com/developers/docs/extensibility/app-framework/app-identity/)
   in Contentful's docs.
2. **Delegated App Access Tokens**, which compute effective permissions as the intersection of
   an app's permissions and a specific attending user's permissions. Not applicable here --
   there's no user to intersect with in a webhook delivery or a cron job.
3. **App Functions (App Event Handlers)**, which run inside Contentful's own runtime and receive
   a pre-authenticated CMA client. Ruled out for now: it would move `translation-api`'s
   CMA-resolution logic into this repo instead, a materially different design from how that
   service is currently built.

## Decision

Provision a standalone App Definition (`translation-companion`) whose only job is to hold an App
Identity. `translation-api` signs JWTs and exchanges them for App Access Tokens itself, using
the private key generated for this App Definition. This repo never handles the private key at
runtime.

The app is scoped and named generically, as a companion to the Translation product's unattended
CMA needs, rather than to a single feature -- so any future Translation feature with the same
need can reuse this App Definition instead of provisioning a new one.

## Consequences

### Positive
- Uses App Identity, an App Framework mechanism designed for exactly this case, rather than
  building a custom credential-exchange mechanism.
- Reusable by future Translation features needing the same unattended-access shape, without
  renaming or re-provisioning.

### Negative
- Installation is admin-mediated per space + environment, so rolling this out across many
  spaces is a manual, ongoing operational task.

### Neutral
- CMA scopes are granted via the Contentful web app's Permissions tab, not through any tooling
  in this repo -- there's no manifest or CLI surface for it yet.
