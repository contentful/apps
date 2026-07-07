# Agent Guide — sap-commerce-cloud

## What This App Does
Integrates SAP Commerce Cloud (formerly Hybris) with Contentful as a product picker. Lets editors select SAP Commerce products and categories for use in Contentful fields. Published as `@contentful/sap-commerce-cloud`.

## Archetype
**App Actions + Frontend** app.

## Structure

```
apps/sap-commerce-cloud/
├── frontend/                  # React app
├── app-actions/               # App Action handlers (SAP API proxy)
├── contentful-app-manifest.json
├── build-actions.js
└── package.json
```

## Sharp Edges & Invariants

- **App Actions proxy SAP Commerce API** — the frontend does not call SAP Commerce directly. All product data fetching goes through App Actions. This is necessary because SAP Commerce APIs typically require server-side authentication.
- **SAP OAuth credentials** (client ID, secret, base URL) are in installation parameters — never log them.
- See `sap-commerce-cloud-with-air` for a variant that also supports SAP's AIR (Advanced Integration Runtime).
- `contentful-app-manifest.json` defines App Action signatures — update when adding new actions.

## Never / Always

- **Never** call SAP Commerce APIs from the frontend — all calls must go through App Actions.
- **Always** update `contentful-app-manifest.json` when adding or removing App Actions.
