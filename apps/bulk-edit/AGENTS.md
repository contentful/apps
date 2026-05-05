# Agent Guide — bulk-edit

## What This App Does
Provides a full-page interface for batch-editing field values across many entries of the same content type simultaneously. Avoids the need to open entries one by one.

## Archetype
Standard Vite app. Page-only location (no sidebar or config screen).

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_PAGE` | `src/locations/Page/` | Full-page bulk edit table UI |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-multiselect` | Multi-select UI for filtering |
| `@contentful/f36-navlist` | Navigation list component |
| `@contentful/field-editor-boolean` | Inline boolean field editor |
| `@contentful/field-editor-checkbox` | Inline checkbox editor |
| `@contentful/field-editor-date` | Inline date editor |
| `@contentful/field-editor-dropdown` | Inline dropdown editor |
| `contentful-management` | CMA for bulk entry reads and writes |

## Source Layout

```
src/
├── App.tsx
├── locations/
│   └── Page/           # Main bulk edit UI
├── components/         # Table, cell editors, toolbar
├── validations/        # Field validation logic
└── scripts/            # Build/deploy helpers
```

## Sharp Edges & Invariants

- **Batched CMA writes**: bulk-edit makes many `space.updateEntry()` calls. The existing code batches these — do not refactor to sequential updates without understanding the rate-limit implications (CMA limit: 7 req/s per space).
- **Field editor components** (`@contentful/field-editor-*`) are embedded inline inside table cells. Each requires its own SDK context — if you add a new field type, follow the existing pattern for injecting a mock SDK into the field editor component.
- **No ConfigScreen** — app configuration (if any) is embedded in the Page location. Do not add a config screen without understanding how installation params are currently used.
- **Validation logic in `src/validations/`** mirrors Contentful's field validation rules — keep it in sync with CMA validation responses.

## Never / Always

- **Never** call `space.updateEntry()` in a tight loop without batching and error handling — one failure should not abort the entire bulk operation.
- **Always** show a progress indicator during bulk operations (users may be editing hundreds of entries).
- **Always** confirm before performing destructive bulk changes.
