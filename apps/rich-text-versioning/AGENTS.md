# Agent Guide — rich-text-versioning

## What This App Does
Adds version history to Contentful rich-text fields. Lets editors save and restore named snapshots of a rich-text field's content, providing undo/redo beyond Contentful's native entry versioning.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure which fields support versioning and snapshot limits |
| `LOCATION_ENTRY_FIELD` | `src/locations/Field.tsx` | Custom field editor with version history panel |
| `LOCATION_DIALOG` | `src/locations/Dialog.tsx` | Version diff view and restore confirmation |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | Field value read/write |
| `@contentful/f36-multiselect` | Multi-select UI |
| `@contentful/field-editor-rich-text` | Embeds the standard rich-text editor |
| `@contentful/rich-text-html-renderer` | Renders rich-text for diff display |
| `@contentful/rich-text-react-renderer` | Renders rich-text in React |
| `@contentful/rich-text-types` | Document node types |
| `contentful` | CDA client (for reading published content) |

## Sharp Edges & Invariants

- **`@contentful/field-editor-rich-text`** is embedded to provide the actual editing experience — this is the standard Contentful rich-text editor. Do not replace it with a custom editor.
- **Versions stored as JSON** in a separate Contentful JSON field (not in the rich-text field itself). The versioning field must exist on the content type alongside the rich-text field — document this requirement clearly to users.
- **Snapshot schema**: each snapshot has `{ id, timestamp, label, value: Document }`. Changing this schema requires migrating all existing version data.
- **Restore operation**: restoring a version calls `sdk.field.setValue(snapshot.value)` on the rich-text field. If the field editor is unmounted during restore, the change may not persist — handle this edge case.
- `@contentful/field-editor-rich-text` has its own internal state management — ensure the embedded editor re-reads field value after a restore.

## Never / Always

- **Never** store version history in the rich-text field itself — use a dedicated JSON field.
- **Never** change the snapshot schema without a migration plan for existing stored versions.
- **Always** use `useAutoResizer()` in the Field location.
