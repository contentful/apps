# Agent Guide — auto-prefix

## What This App Does
Automatically prepends a configurable prefix to short-text field values. A field-level app that intercepts the field editor and applies prefix logic transparently.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure prefix string per content type / field |
| `LOCATION_ENTRY_FIELD` | `src/locations/Field.tsx` | Custom field editor that applies the prefix |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | Field value access and mutation |
| `@contentful/field-editor-single-line` | Reuses the standard single-line field editor UI |
| `@contentful/node-apps-toolkit` | Shared utilities |
| `contentful-management` | CMA for reading content type field definitions |

## Source Layout

```
src/
├── App.tsx
├── locations/       # ConfigScreen, Field
├── components/
├── hooks/
└── utils/
```

## Sharp Edges & Invariants

- **Field location only** — this app runs as a custom field editor (`LOCATION_ENTRY_FIELD`). It completely replaces the standard field editor; the prefix is baked in, not appended by a sidebar.
- **`@contentful/field-editor-single-line`** is reused for the underlying input UI — do not replace it with a plain `<input>` or F36 `TextInput` without testing field value save behavior carefully.
- Prefix configuration is stored in **installation parameters** (global per content type/field mapping). Changes in ConfigScreen affect all entries using that field.
- `sdk.field.setValue()` fires on every keystroke in a debounced manner — do not add additional debouncing that could cause value drift.

## Never / Always

- **Never** modify `sdk.field.value` directly outside of the established hooks — use the existing hook pattern in `hooks/`.
- **Always** use `useAutoResizer()` in the Field location.
