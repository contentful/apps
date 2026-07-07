# Agent Guide — klaviyo

## What This App Does
Integrates Contentful with Klaviyo (email/SMS marketing platform). Maps Contentful content type fields to Klaviyo profile properties, letting marketers push content updates to Klaviyo segments and flows.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Klaviyo API key |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Show Klaviyo sync status and trigger push |
| `LOCATION_DIALOG` | `src/locations/FieldSelectDialog.tsx` | Field mapping configuration dialog |
| `LOCATION_PAGE` | `src/locations/FieldMappingScreen.tsx` | Full-page field mapping management |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-forms` | Forma 36 form components |
| `@contentful/node-apps-toolkit` | Shared utilities |
| `@contentful/rich-text-html-renderer` | Converts rich-text to HTML for Klaviyo |
| `contentful-management` | CMA for content type field inspection |

## Source Layout

```
src/
├── App.tsx
├── locations/         # ConfigScreen, Sidebar, FieldSelectDialog, FieldMappingScreen
├── config/            # Default config and constants
├── services/          # Klaviyo API client
└── utils/
```

## Sharp Edges & Invariants

- **Field mapping**: maps Contentful field IDs to Klaviyo profile property keys. Stored in installation parameters. If a content model changes (field renamed or removed), mappings silently break — the Sidebar should validate mappings on render.
- **Klaviyo API key** is in installation parameters — never log it. Klaviyo uses server-side API keys; calling the API from the frontend exposes the key in network requests.
- **Rich-text → HTML**: Klaviyo accepts HTML in its properties — use `@contentful/rich-text-html-renderer` for conversion.
- **`services/`**: the Klaviyo API client — all API calls should go through here, not directly in components.

## Never / Always

- **Never** log or expose the Klaviyo private API key.
- **Always** validate that mapped Contentful fields still exist before attempting a sync.
