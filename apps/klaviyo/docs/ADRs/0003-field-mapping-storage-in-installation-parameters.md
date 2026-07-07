# ADR-0003: Field Mappings Stored in Installation Parameters

**Date:** 2026-05-05
**Status:** Accepted
**Deciders:** David Shibley, Marketplace team

## Context

The Klaviyo app lets space admins configure which Contentful content types and fields map to which Klaviyo profile/event attributes. This configuration must persist across sessions and be available to both the frontend (for display in `FieldMappingScreen` and `ConfigScreen`) and to the `entrySyncFunction` App Function (to know which fields to sync on publish).

Storage options considered:
1. **Contentful Installation Parameters** — key/value store attached to the app installation, read/written via `sdk.app.getParameters()` / `sdk.app.setReady()` + `sdk.app.onConfigure()`
2. **Contentful CMA — dedicated entry/asset** — a content type created by the app to store config as entry data
3. **External database** — a third-party store (e.g., DynamoDB, Fauna) outside Contentful
4. **App Function environment/secrets** — suitable for credentials, not structured config

Installation parameters are the canonical Contentful App Framework mechanism for storing app-level configuration. They are scoped to the installation (space + environment), accessible server-side inside App Functions, and do not require the app to create or own content types in the customer's space.

## Decision

All field mapping configuration (`selectedContentTypes`, `fieldMappings`, `contentTypeMappings`) is stored in installation parameters via `sdk.app.getParameters()` and set through the `onConfigure` callback in `ConfigScreen.tsx`. App Functions access this configuration at runtime via the App Functions context object.

## Consequences

### Positive
- No content model pollution — the app does not add content types to the customer's space
- Configuration is automatically scoped to the space + environment; separate Contentful environments have independent mappings
- Accessible to both the frontend SDK and App Functions without any additional API calls
- Backed by Contentful's own storage — no external database to provision or pay for

### Negative
- Installation parameters have a size limit — deeply nested or large mapping configurations risk hitting the limit as customers add more content types and field mappings
- The parameters object is a flat key/value structure; complex nested schemas require careful serialization and versioning
- Migrations to a new parameter schema must be handled in `ConfigScreen.tsx` at read time (backwards-compatible reads of old shape)

### Neutral
- The `parameters.installation` array in `contentful-app-manifest.json` declares the parameter schema — keep it in sync with the TypeScript types in `src/config/`
- Parameters are visible to space admins via the Contentful UI; do not store secrets (tokens, API keys) here — those belong in App Function secrets (see ADR-0002)
