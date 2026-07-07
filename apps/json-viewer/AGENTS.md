# Agent Guide — json-viewer

## What This App Does
Provides a read-only, formatted JSON viewer as a custom entry editor location. Useful for debugging — lets editors view the raw JSON of an entry without leaving the Contentful web app.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure display options (indentation, collapsing) |
| `LOCATION_ENTRY_EDITOR` | `src/locations/EntryEditor.tsx` | Full entry editor replacement showing formatted JSON |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK, entry data access |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()` |
| `contentful-management` | CMA for fetching full entry with resolved links |

## Source Layout

```
src/
├── App.tsx
├── locations/       # ConfigScreen, EntryEditor
└── components/      # JSON tree renderer
```

## Sharp Edges & Invariants

- **Entry editor location**: this app replaces the entire entry editor UI. There is no field-level editing — it is a read-only display. Do not add edit capabilities; that is out of scope for this app.
- **`LOCATION_ENTRY_EDITOR`** requires the app to be assigned as the entry editor for a content type in the Contentful web app settings — it does not appear automatically.
- Large entries with many fields and deep references can produce very large JSON payloads — the viewer must handle deeply nested structures without crashing the browser tab.

## Never / Always

- **Never** add write/edit functionality to this app — it is intentionally read-only.
- **Always** use `useAutoResizer()` in the EntryEditor location if the content height is variable.
