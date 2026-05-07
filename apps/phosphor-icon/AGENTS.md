# Agent Guide — phosphor-icon

## What This App Does
Provides a searchable icon picker powered by the [Phosphor Icons](https://phosphoricons.com/) library. Lets editors choose an icon name/variant from a visual browser and stores the icon identifier in a Contentful field.

## Archetype
Standard Vite app. One of the most location-rich apps in the repo.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure icon set and default style |
| `LOCATION_HOME` | `src/locations/Home/` | Home screen widget |
| `LOCATION_PAGE` | `src/locations/Page/` | Full-page icon browser |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar/` | Entry sidebar panel |
| `LOCATION_ENTRY_EDITOR` | `src/locations/EntryEditor/` | Entry editor integration |
| `LOCATION_ENTRY_FIELD` | `src/locations/Field/` | Custom field editor — icon selector |
| `LOCATION_DIALOG` | `src/locations/Dialog/` | Icon picker dialog |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useAutoResizer()` |
| `contentful-management` | CMA |

## Source Layout

```
src/
├── App.tsx
├── locations/         # All 7 locations above
├── components/        # Icon grid, search, preview
├── hooks/
├── types/             # Icon data types
└── utils/
```

## Sharp Edges & Invariants

- **Phosphor Icons library**: icons are bundled as an SVG set or loaded from the Phosphor npm package. Check `package.json` for the specific package (`@phosphor-icons/react` or `phosphor-react`) and its version — the icon API differs between major versions.
- **Stored value**: the field stores an icon identifier string (e.g. `"House"` with variant `"bold"`). The schema for this value must remain stable — changes break existing field data.
- **Large icon set**: Phosphor has 1000+ icons. The Field and Dialog locations must use virtualization or pagination for the icon grid — rendering all icons at once will freeze the browser.
- **7 locations** — verify which locations are actually used/installed before modifying all of them.

## Never / Always

- **Never** render the full icon set without virtualization in field/dialog locations.
- **Always** use `useAutoResizer()` in Field, Sidebar, and Dialog locations.
