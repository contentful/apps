# Agent Guide — locale-field-populator

## What This App Does
Copies field values from one locale to another for a Contentful entry. Useful for initializing localized fields with a default-locale value as a starting point for translation.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure which locales and content types are supported |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Trigger locale copy operations |
| `LOCATION_DIALOG` | `src/locations/Dialog.tsx` | Confirm and preview the copy operation |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-multiselect` | Locale multi-select |
| `@contentful/rich-text-react-renderer` | Renders rich-text preview in Dialog |
| `@contentful/rich-text-types` | Rich-text Document type definitions |
| `contentful-management` | CMA for reading and writing localized field values |

## Source Layout

```
src/
├── App.tsx
├── locations/       # ConfigScreen, Sidebar, Dialog
├── components/
└── utils/
```

## Sharp Edges & Invariants

- **Rich-text fields**: copying rich-text between locales requires deep-cloning the Document node, not just assigning the reference. Shared references between locales will cause unexpected mutations.
- **Field validation**: target locale fields may have different validation rules than the source locale. The copy operation should check for validation failures and surface them before writing.
- **`sdk.entry.fields[fieldId].setValue(value, localeCode)`**: the locale parameter is required — omitting it writes to the default locale regardless of which locale was selected.
- Locale data is copied at the time of the operation — it does not create a sync relationship between locales.

## Never / Always

- **Never** assign rich-text Document nodes by reference across locales — always deep-clone.
- **Always** confirm with the user before overwriting existing locale values (the Dialog handles this).
