# ADR-0004: Entry Sync Triggered via App Event Handler (Not Webhooks or Frontend Polling)

**Date:** 2026-05-05
**Status:** Accepted
**Deciders:** David Shibley, Marketplace team

## Context

The Klaviyo app's core value proposition is automatically syncing Contentful entry data to Klaviyo profile/event attributes when content is published or updated. Three trigger mechanisms were considered:

1. **Frontend polling** — the Sidebar or Field location polls Klaviyo/Contentful for state and pushes updates on a timer
2. **Contentful webhooks** — the app registers a Contentful webhook that calls an external URL (Lambda or third-party endpoint) on entry publish
3. **App Event Handler** — a Contentful App Functions feature where the platform invokes a function when specific CMA events occur, configured declaratively in `contentful-app-manifest.json`

Problems with each alternative:
- **Frontend polling**: requires the Contentful web app to be open; sync does not happen if an editor publishes via the CMA directly (CI/CD, migration scripts, API integrations)
- **Contentful webhooks**: requires an external, publicly reachable endpoint; adds infrastructure management overhead (see ADR-0001); webhook URL must be registered per-installation

## Decision

Entry sync is handled by `entrySyncFunction.ts` declared as an `appEventHandler` in `contentful-app-manifest.json`. It subscribes to `ContentManagement.Entry.publish`, `ContentManagement.Entry.auto_save`, and `ContentManagement.Entry.save` topics. The platform invokes the function server-side whenever a matching CMA event occurs for a space where the app is installed — no frontend involvement required.

## Consequences

### Positive
- Sync fires for every publish path: web editor, CMA API, migration scripts, CI/CD pipelines
- No external infrastructure — the event handler runs inside Contentful's App Functions runtime (same as the proxy, see ADR-0001)
- Subscription topics are declared in the manifest; the platform handles event routing and retry logic
- Frontend shows sync state by calling `checkStatus` (via `proxyRequest`) rather than being the sync initiator

### Negative
- `auto_save` and `save` topics fire on every save, not just publish — the function must check entry publish state to avoid syncing unpublished drafts to Klaviyo unintentionally
- App Event Handlers share the same App Functions execution limits as action-triggered functions; very large entries or bulk publishes may cause timeouts
- Debugging event handler invocations requires App Functions observability tooling; failures are not surfaced directly in the Contentful web app UI

### Neutral
- Adding or removing subscribed topics requires a manifest update and app redeployment — this is not configurable at runtime
- The frontend (`Sidebar.tsx`) should reflect sync status by polling `checkStatus` rather than assuming the event handler succeeded
