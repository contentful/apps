# Agent Guide — side-notes-app

## What This App Does
Allows editors to add private, per-entry notes and annotations visible in the Entry Sidebar. Notes are not part of the published content — they are stored as app installation data, making them useful for editorial workflows and collaboration. Published as `widget-builder`.

## Archetype
Standard Vite app. One of the more feature-rich apps in the repo with migrations support.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_ENTRY_FIELD` | `src/locations/Field/` | Inline field-level annotations |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar/` | Entry-level notes panel |
| `LOCATION_DIALOG` | `src/locations/Dialog/` | Note creation/editing dialog |
| `LOCATION_PAGE` | `src/locations/Page/` | Full-page notes management |
| `LOCATION_APP_CONFIG` | `src/locations/config/` | App configuration |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-icons` | Icons |
| `@contentful/field-editor-boolean` | Reused boolean editor |
| `@contentful/field-editor-json` | Reused JSON editor |
| `contentful-management` | CMA for note storage |

## Source Layout

```
src/
├── App.tsx
├── locations/         # Field, Sidebar, Dialog, Page, config
├── components/
├── migrations/        # Data migration scripts for note schema changes
├── stores/            # State management (likely Zustand or similar)
└── types/
```

## Sharp Edges & Invariants

- **`src/migrations/`**: this app has a migrations directory, meaning the note storage schema has changed over time. Before modifying the stored data format, check existing migrations to understand the current schema version.
- **Notes are stored via CMA** — likely in `AppInstallation` parameters or a dedicated Contentful entry (check `stores/`). The storage mechanism determines how notes are scoped (per-space vs per-environment vs per-entry).
- **`stores/`**: check here for the state management approach before adding new state — it likely uses a specific library already.
- The `widget-builder` package name is unrelated to Contentful's Widget Builder product — it's just this app's npm name.

## Never / Always

- **Never** change the note storage schema without adding a migration in `src/migrations/`.
- **Always** use `useAutoResizer()` in the Sidebar and Field locations.
