# Agent Guide — hubspot

## What This App Does
Integrates HubSpot with Contentful. Lets editors link Contentful entries to HubSpot CRM objects (contacts, companies, deals) and view linked HubSpot data in the entry editor.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure HubSpot API key and content type mappings |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Show linked HubSpot objects for the current entry |
| `LOCATION_DIALOG` | `src/locations/Dialog.tsx` | HubSpot object search and selection |
| `LOCATION_PAGE` | `src/locations/Page/` | Full-page HubSpot data management view |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-multiselect` | Multi-select UI |
| `@contentful/field-editor-json` | JSON field editor |
| `@contentful/rich-text-html-renderer` | Converts rich-text for HubSpot content |
| `contentful-management` | CMA for reading entries and content types |

## Source Layout

```
src/
├── App.tsx
├── locations/         # ConfigScreen, Sidebar, Dialog, Page
├── components/
├── scripts/           # HubSpot API interaction utilities
└── utils/
```

## Sharp Edges & Invariants

- **HubSpot API key** is in installation parameters — never log it. HubSpot uses OAuth2 or private app tokens; check `src/scripts/` for the auth implementation.
- **CRM object linking** is stored as a JSON field value (array of HubSpot object IDs with type). If the field schema changes, existing stored links may break.
- The Page location can display a large amount of HubSpot data — ensure pagination is respected; do not load all HubSpot objects at once.
- `@contentful/rich-text-html-renderer` is used when sending Contentful content to HubSpot.

## Never / Always

- **Never** store HubSpot credentials in entry field values — use installation parameters only.
- **Always** paginate HubSpot API requests.
