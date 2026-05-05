# Agent Guide — braze

## What This App Does
Integrates Contentful with Braze (customer engagement platform). Lets editors link Contentful content to Braze campaigns and content cards, and push content updates to Braze from within the Contentful web app.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Braze API key, instance URL, and field mappings |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Show linked Braze objects; trigger push to Braze |
| `LOCATION_DIALOG` | `src/locations/Dialog.tsx` | Asset/content picker dialog |
| `LOCATION_PAGE` | `src/locations/Page.tsx` | Full-page Braze content management view |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-multiselect` | Multi-select field UI |
| `@contentful/rich-text-html-renderer` | Converts Contentful rich text to HTML for Braze |
| `contentful-resolve-response` | Resolves linked entries/assets in CDA responses |
| `contentful-management` | CMA for reading content |

## Source Layout

```
src/
├── App.tsx
├── locations/         # ConfigScreen, Sidebar, Dialog, Page
├── components/
├── fields/            # Field-specific rendering logic
├── scripts/           # Utility scripts (may include deploy/setup helpers)
└── utils/
```

## Sharp Edges & Invariants

- **Rich-text → HTML conversion**: Braze expects HTML, not Contentful Document nodes. `@contentful/rich-text-html-renderer` handles this — do not write a custom renderer unless the existing one is insufficient.
- **Braze API key** is stored in installation parameters — never log it.
- `contentful-resolve-response` is used to inline linked entries/assets from CDA responses before sending to Braze. If you change how content is fetched, ensure links are still resolved.
- The Page location may make many CMA calls — batch where possible and respect Contentful rate limits (7 req/s for CMA).

## Never / Always

- **Never** send raw Contentful Document nodes to Braze — always render to HTML first.
