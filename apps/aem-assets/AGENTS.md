# Agent Guide — aem-assets

## What This App Does
"Adobe Experience Manager Asset Selector" — integrates Adobe Experience Manager (AEM) as a Cloud Service Assets with Contentful via Adobe's Content Advisor Micro-Frontend. Lets editors browse, select, sort, and remove AEM DAM assets directly from a Contentful entry field.

## Archetype
**DAM base app** — thin wrapper around `@contentful/dam-app-base`, plus a custom Adobe IMS OAuth handshake (popup-based login) that the base package does not handle out of the box.

## Structure

```
apps/aem-assets/
└── src/
    ├── index.jsx   # Mounts the DAM base app; Adobe IMS auth wiring; logout button; popup auth-redirect fix
    ├── utils.js     # Asset shape transforms (renditions, metadata) between AEM's API and dam-app-base's expected format
    ├── index.css
    └── logo.svg
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/dam-app-base` | Provides the picker dialog shell, entry-field UI, and CMA wiring |
| `@contentful/f36-components` | Used for the custom `Log out` button (Forma 36 compliant) |
| Adobe's `assets-selectors.js` (loaded at runtime from `experience.adobe.com`) | Renders the actual AEM Content Advisor picker UI inside the dialog |

## Sharp Edges & Invariants

- **Adobe IMS auth uses a popup, not a redirect within the iframe.** `modalMode: true` opens a real popup window for login. Per Adobe's own examples, `registerContentAdvisorAuthService` must be called unconditionally on every page load — including on the popup's own redirect page. This app's `renderDialog(sdk)` only runs after `@contentful/app-sdk`'s `init()` iframe handshake resolves, which never happens inside the plain popup window. See the clearly-delimited `EXPERIMENTAL: popup auth-redirect fix` block in `index.jsx` — it re-registers the auth service when the page is *not* embedded in an iframe, using IMS config persisted to `localStorage`. Flip `ENABLE_POPUP_AUTH_REDIRECT_FIX` to `false` (or delete the block) to fully revert if this ever needs rolling back.
- **Adobe enforces CORS/origin allowlisting server-side** on the IMS token endpoint. The hosted app's origin (e.g. its Contentful-hosted bundle URL) must be allowlisted on the customer's IMS Client ID by Adobe support before auth will work at all — this is not fixable in app code. This must be called out in customer-facing help docs.
- **IMS Client ID must come from an Adobe support ticket**, not the normal Adobe Developer Console — a common setup gotcha.
- `makeThumbnail` in `index.jsx` references `ASSET_RENDITIONS_KEY`, which is not defined in that file (it's only defined in `utils.js`). This does not currently throw or cause visible bugs: optional chaining (`asset?.computedMetadata?._links[...]`) short-circuits before evaluating the bracket expression for the persisted asset shape (`{id, name, url, metadata}`), and `dam-app-base`'s `SortableComponent` overrides the computed thumbnail URL with the persisted `resource.url` anyway. Worth cleaning up, but is not the cause of any known rendering bug.
- Unlike `bynder`/`cloudinary` (which use static credentials + session cookies, no OAuth), this app's auth model is fundamentally OAuth/popup-based because that's how Adobe's Content Advisor SDK works — there is no way to avoid the origin-allowlisting requirement within this architecture.

## Never / Always

- **Never** bypass `dam-app-base` to implement custom picker/entry-field UI — use the provided extension points (`makeThumbnail`, `openDialog`, `renderDialog`).
- **Always** keep the popup auth-redirect fix block clearly delimited and flag-gated so it can be disabled without a full revert if it ever misbehaves.
- **Always** return assets in the format expected by `dam-app-base` (array of `{id, name, url, metadata}`).
