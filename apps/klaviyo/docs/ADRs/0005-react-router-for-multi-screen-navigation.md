# ADR-0005: React Router for Multi-Screen Navigation

**Date:** 2026-05-05
**Status:** Accepted
**Deciders:** David Shibley, Marketplace team

## Context

The Klaviyo app's `Page` location (`FieldMappingScreen`) has multiple views: a content type selection step and a per-content-type field mapping step. Navigation between these views needs a mechanism.

Options considered:
1. **Local state flag (`useState`)** — a boolean or enum controls which view renders; no URL change
2. **React Router (`react-router-dom`)** — URL-based routing within the app iframe; each screen has a path
3. **Contentful `sdk.navigator` / `sdk.dialogs`** — platform navigation APIs for navigating between entries or opening dialogs

The `sdk.navigator` and `sdk.dialogs` APIs are for navigating the Contentful host application (opening entries, spaces, dialogs). They are not designed for intra-app screen navigation within the `Page` location iframe.

## Decision

The app uses `react-router-dom` for navigation between screens within the `Page` location. Routes are defined in `App.tsx` and components in `src/locations/` map to route paths.

## Consequences

### Positive
- Browser back/forward navigation works within the app iframe — editors can navigate back to content type selection without losing state
- Deep-linking to a specific content type's mapping screen is possible (useful for debugging and support)
- Well-understood pattern; any React developer familiar with `react-router-dom` can follow the navigation structure

### Negative
- The app runs in an iframe; the URL changes are within the iframe context and are not reflected in the parent Contentful URL bar — deep links cannot be shared directly from the browser address bar
- Adds a dependency (`react-router-dom`) for what is, in effect, two screens; `useState` would be simpler for fewer views
- Route mismatches (e.g., stale links after a route rename) silently show a blank screen without an explicit 404 component

### Neutral
- Router configuration lives in `App.tsx` — add new screens there, not ad hoc in individual components
- The `dialog` location (`FieldSelectDialog`) is opened via `sdk.dialogs.openCurrentApp()` and does not participate in the React Router tree
