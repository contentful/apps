# Agent Guide — color-picker

## What This App Does
Custom field editor that replaces the plain text input for color fields with a color picker UI. Stores the selected color value as a hex/rgba string in the Contentful field.

## Archetype
Standard Vite app. Published as `contentful-color-picker`.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure which fields use the color picker and default format (hex/rgba) |
| `LOCATION_ENTRY_FIELD` | `src/locations/Field.tsx` | Custom field editor rendering the color picker UI |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | Field value read/write |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useAutoResizer()` |
| `contentful-management` | CMA for reading field metadata |

## Source Layout

```
src/
├── App.tsx
├── locations/       # ConfigScreen, Field
├── components/      # Color picker UI components
└── types.ts         # Color value types
```

## Sharp Edges & Invariants

- **Field location**: this app completely replaces the standard field editor. The field value is written as a string (hex `#rrggbb` or rgba `rgba(r,g,b,a)`) — the format depends on installation configuration.
- **Field type must be `Symbol`** — the app only works on short-text fields. Installing on a different field type will cause `sdk.field.setValue()` to reject the value.
- Color picker libraries may manage their own internal state separate from `sdk.field.value` — keep them in sync on every color change event, not just on blur/submit.

## Never / Always

- **Never** write a non-string value to the field (e.g. an object like `{ r, g, b }`) — it must be a string.
- **Always** use `useAutoResizer()` in the Field location.
