# ADR-0002: OAuth 2.0 for Klaviyo Authentication

**Date:** 2026-05-05
**Status:** Accepted
**Deciders:** David Shibley, Marketplace team

## Context

The Klaviyo app must authenticate with the Klaviyo API on behalf of a customer's Klaviyo account. Two authentication models are relevant:

1. **Static API key** — customer generates a Klaviyo private API key and pastes it into the app's ConfigScreen; the key is stored in installation parameters and passed to App Functions at runtime
2. **OAuth 2.0 (3-legged)** — the app redirects the user through Klaviyo's authorization server; the resulting access/refresh tokens are managed by App Functions and never exposed to the frontend

The app previously used static API keys (per specstory history `2025-06-24_14-37-update-readme-for-oauth-changes.md`). This was migrated to OAuth 2.0.

Problems with static API keys:
- Keys with broad permissions — customers may generate admin-level keys out of convenience
- No per-installation revocation without deleting the key entirely from Klaviyo
- Key rotation requires manual re-entry in ConfigScreen; expired or rotated keys silently break sync
- Keys stored in installation parameters are accessible to anyone with space admin rights in Contentful

## Decision

The app uses OAuth 2.0 with the authorization code flow. The `initiateOauth` App Function starts the flow by generating an authorization URL; `completeOauth` exchanges the authorization code for tokens; `disconnect` revokes and clears tokens. Access tokens are stored in the App Function environment/secrets layer, not in installation parameters visible to space admins.

## Consequences

### Positive
- Least-privilege scopes: the OAuth app is configured in Klaviyo with only the permissions the integration needs
- Per-installation revocation: a customer can disconnect the app (via `disconnect` function) or revoke access directly in Klaviyo without affecting other installations
- No credentials in installation parameters — space admins cannot extract a raw Klaviyo key from the Contentful UI
- Token refresh is handled server-side in App Functions; the frontend never sees raw tokens

### Negative
- OAuth flow requires a redirect URI — in local development, this requires a tunneled URL (e.g., ngrok) or a dedicated dev OAuth app registered in Klaviyo
- Three App Functions (initiateOauth, completeOauth, disconnect) are now part of the auth critical path; bugs in any of them break the entire app for new installations
- Token refresh logic must be implemented and maintained; a stale refresh token locks out the installation until the user re-authenticates

### Neutral
- `www.klaviyo.com` (authorization server) and `a.klaviyo.com` (API) are different hosts — both must appear in `allowNetworks` in the relevant function declarations in `contentful-app-manifest.json`
- Existing installations using static API keys required a one-time migration during the OAuth rollout
