# Agent Guide — salesforce-commerce-cloud

## What This App Does
Integrates Salesforce Commerce Cloud (SFCC) with Contentful as a product picker. Lets editors select SFCC products/categories for use in Contentful fields. Published as `contentful-sfcc-vite`.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure SFCC instance URL, client ID, and credentials |
| `LOCATION_ENTRY_FIELD` | `src/locations/Field.tsx` | Custom field editor — SFCC product/category selector |
| `LOCATION_DIALOG` | `src/locations/Dialog.tsx` | SFCC product/category search and selection dialog |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/f36-layout` | Layout components |
| `@contentful/react-apps-toolkit` | `useSDK()` |
| `contentful-management` | CMA |

## Source Layout

```
src/
├── App.tsx
├── locations/         # ConfigScreen, Field, Dialog
├── components/
└── utils/             # SFCC API client and data formatting
```

## Sharp Edges & Invariants

- **SFCC OAuth**: SFCC uses OAuth 2.0 (client credentials grant). Credentials (client ID + secret + site ID) are in installation parameters — never log them.
- **SFCC API is CORS-restricted**: SFCC's OCAPI may not permit browser-side requests depending on configuration. If direct browser calls fail, a backend proxy (Lambda or App Action) may be needed. Check the current implementation in `src/utils/` to understand whether requests go through a proxy.
- **Product ID format**: SFCC product IDs follow a specific format per catalog configuration. The stored field value format is defined by the integration — verify in `src/utils/` before changing.

## Never / Always

- **Never** log SFCC OAuth credentials or tokens.
- **Always** handle SFCC API pagination — product catalogs can be very large.
