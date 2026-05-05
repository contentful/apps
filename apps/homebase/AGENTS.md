# Agent Guide — homebase

## What This App Does
Provides a customizable home screen widget for Contentful spaces. Lets space admins configure a markdown-based welcome message and quick links that appear on the Contentful home screen.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure home screen content (markdown, links) |
| `LOCATION_HOME` | `src/locations/Home/` | Renders the configured content on the Contentful home screen |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/field-editor-markdown` | Markdown editor for the config screen |
| `contentful-management` | CMA for reading/writing app installation parameters |

## Sharp Edges & Invariants

- **`LOCATION_HOME`** is a relatively new App Framework location — it renders inside the Contentful home screen, not inside an entry. Do not use `useAutoResizer()` here; the home location manages its own sizing.
- **`@contentful/field-editor-markdown`** is used in the ConfigScreen to let admins edit the welcome message — it's a heavy component. Do not use it in the Home location.
- Markdown content is stored in installation parameters and rendered in the Home location.
- `src/consts.ts` — check here for default content and limits before modifying stored values.

## Never / Always

- **Never** use `useAutoResizer()` in the Home location — `LOCATION_HOME` manages its own sizing at the platform level; calling `useAutoResizer()` here has no effect and may cause layout conflicts.
- **Always** sanitize or limit the markdown rendered in the Home location — arbitrary HTML in markdown could be a security risk if not handled by the markdown renderer.
