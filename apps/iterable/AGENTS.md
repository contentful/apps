# Agent Guide — iterable

## What This App Does
Integrates Contentful with Iterable (marketing automation platform). Lets editors link Contentful entries to Iterable campaigns and push content updates to Iterable from the Entry Sidebar.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Iterable API key and field mappings |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Show Iterable campaign links and push content |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-multiselect` | Multi-select UI |
| `@contentful/field-editor-json` | JSON field editor |
| `contentful-management` | CMA for reading content type and field data |

## Source Layout

```
src/
├── App.tsx
├── locations/       # ConfigScreen, Sidebar
├── components/
└── utils.ts
```

## Sharp Edges & Invariants

- **Iterable API key** is stored in installation parameters — never log it.
- Content pushed to Iterable is serialized from Contentful field values — if field types change in a content model, the push logic may break silently. The Sidebar should validate field types before pushing.
- Iterable API calls are made from the frontend (no backend Lambda/App Actions) — CORS must be permitted by Iterable. If Iterable restricts their API to server-side, this will break.

## Never / Always

- **Never** expose the Iterable API key in client-side JS beyond what is required for the API call.
- **Always** handle Iterable API errors gracefully with Forma 36 notifications.
