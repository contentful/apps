# Agent Guide — translation-companion

## What This App Does
Holds an App Identity (App Keys) so Translation product services can authenticate to the CMA
without a user in the loop -- for webhook-driven syncs and scheduled reconciliation jobs. The
app itself has no product logic: it exists so an `AppInstallation` (and therefore an App
Identity) exists per space + environment. It is a companion to the `translation-api` service and
is not scoped to any single feature of that service.

## Archetype
Standard Vite app. Config-screen-only app (single location), no App Actions, no Functions, no
Lambda. Mirrors `apps/remote-mcp`.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Confirms installation, states purpose, warns against uninstalling |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()` |
| `contentful-management` | CMA (unused at runtime today; kept for parity with other Standard Vite apps) |

## App Identity setup (not done by this app's code)

App Identity/App Keys and CMA permission scopes are **not** configurable through this app's
code, this repo's CLI tooling, or any manifest file -- confirmed by grepping the vendored
`contentful-management` SDK types and `@contentful/app-scripts`' `create-app-definition`
implementation, neither of which exposes an App Keys or scopes field. They're set up out of
band:

1. **App Definition**: `scripts/actions/createAppDefinition.ts` (root `scripts/` package).
2. **App Keys**: generated manually by an org admin via the App Definition's **Security** tab in
   the Contentful web app ("Generate a key pair"). Not scripted -- this happens once per
   environment tier (test/staging/prod) and is never repeated, so there's little to amortize by
   scripting it, and Contentful's `organization.createAppKey()` API offers no safer handoff than
   the UI anyway (both put the raw private key in front of a human who then copies it into
   Secrets Manager).
   **Contentful returns the generated private key exactly once, at generation time.** There is
   no way to retrieve it again afterward -- if it's lost, the only recovery is generating a new
   key and re-distributing it.
3. **Scopes** (Entry read, ContentType read, Locale read for `translation-api`'s current needs):
   set manually via the App Definition's Permissions tab in the Contentful web app. Extend
   incrementally as new Translation features attach to this same App Definition -- don't
   pre-grant scopes nothing currently uses.
4. **Install**: `scripts/actions/installApp.ts` (root `scripts/` package), run explicitly per
   target space + environment by an org admin. Deliberately not self-service or
   lazily-triggered by a consuming service's first request -- that would need "manage apps"
   permission most callers won't have.

The generated private key is handed to the consuming service (e.g. `translation-api`) via AWS
Secrets Manager. This app and this repo never hold or transmit the private key at runtime.

## Sharp Edges & Invariants

- **This app never touches the App Identity private key at runtime.** JWT signing and App
  Access Token exchange happen entirely in the consuming service (e.g. `translation-api`, using
  `@contentful/node-apps-toolkit`'s `getManagementToken()`).
- **Uninstalling the `AppInstallation` breaks every consuming service immediately** -- App
  Access Token exchange requires a live installation for the target space + environment. The
  ConfigScreen calls this out explicitly.
- Not published to the Marketplace. Visible in a space's "Installed apps" list like any other
  app -- there is no true hidden/system-app mechanism in this repo today.
- Owned by Applied AI Solutions (`@contentful/group-applied-ai-solutions`).

## Never / Always

- **Never** add product logic, App Actions, or Functions to this app to serve a specific
  Translation feature -- keep it purely an identity holder. Feature-specific logic belongs in
  the consuming service.
- **Always** call `sdk.app.setReady()` after initialization in ConfigScreen.
