# ADR-0001: App Functions as API Proxy for All Klaviyo API Calls

**Date:** 2026-05-05
**Status:** Accepted
**Deciders:** David Shibley, Marketplace team

## Context

The Klaviyo app needs to make API calls to Klaviyo's REST API (`a.klaviyo.com`). Klaviyo's API does not include CORS headers that would allow direct browser-to-API calls from the Contentful web app. Without a server-side intermediary, every API call from the frontend would fail with a CORS error.

Alternative intermediary options considered:
1. **Direct browser calls** — blocked by CORS
2. **AWS Lambda (legacy pattern)** — available in other Contentful apps (`netlify`, `typeform`) but requires external infrastructure, separate deployment pipeline, and IAM credential management
3. **Contentful App Functions** — serverless functions bundled with the app, deployed alongside the frontend, with `allowNetworks` controlling which external hosts can be reached
4. **Third-party proxy service** — adds an external dependency and a new trust boundary

## Decision

All Klaviyo API calls are routed through a `proxyRequest` App Function (`functions/proxyRequest.ts`). The frontend invokes this function via `sdk.cma.appAction.call(...)` for on-demand requests. A separate `entrySyncFunction` handles event-driven sync (see ADR-0004). The manifest declares `allowNetworks: ["a.klaviyo.com"]` to enforce network egress at the platform level.

## Consequences

### Positive
- No external infrastructure to provision, monitor, or rotate credentials for
- Network egress is locked to `a.klaviyo.com` in the app manifest — accidental exfiltration to other hosts is prevented at the platform level
- App Functions bundle with the app, so the proxy is always in sync with the frontend (no version skew between UI and backend)
- Cold-start latency is acceptable for Klaviyo's use case (user-triggered sync, not sub-100ms SLA)

### Negative
- App Functions have an execution timeout — long-running bulk sync operations risk hitting the limit
- The `proxyRequest` function must validate allowed endpoints explicitly; failing to allowlist a new Klaviyo endpoint requires a manifest update and redeployment
- Debugging App Functions is harder than debugging a standalone Lambda with full CloudWatch access

### Neutral
- Any new Klaviyo API endpoint the app needs must be added to `allowNetworks` in `contentful-app-manifest.json` and handled in `proxyRequest.ts`
- OAuth endpoints are on `www.klaviyo.com`, which requires a separate `allowNetworks` entry (see `initiateOauth` and `completeOauth` function declarations in the manifest)
