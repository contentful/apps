# Agent Guide — operating-hours

## What This App Does
Custom field editor for managing business hours of operation. Lets editors define open/close times per day of the week with support for multiple time ranges per day and timezone configuration.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure default timezone and display options |
| `LOCATION_ENTRY_FIELD` | `src/locations/Field.tsx` | Custom field editor — weekly hours grid |
| `LOCATION_DIALOG` | `src/locations/Dialog.tsx` | Time range picker dialog |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | Field value read/write |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useAutoResizer()` |

## Source Layout

```
src/
├── App.tsx
├── locations/       # ConfigScreen, Field, Dialog
├── components/      # Day row, time range inputs
├── types.ts         # Hours data structure definition
└── utils/           # Time formatting and validation
```

## Sharp Edges & Invariants

- **Stored value schema** (`src/types.ts`): operating hours are stored as a JSON object in a Contentful JSON field. The schema defines days, time ranges, and timezone. Any change to this schema requires migrating existing data.
- **Timezone handling**: stored times should be in a consistent format (likely 24h HH:MM strings without timezone offset). The timezone is stored separately and applied at render/display time. Do not store timezone-offset timestamps — they become wrong when DST changes.
- **Field type must be `Object` (JSON)** — this app only works on JSON fields.
- Multiple time ranges per day are allowed (e.g. lunch break split hours).

## Never / Always

- **Never** change the stored value schema without a migration strategy for existing field data.
- **Never** store timezone-aware timestamps — store naive time strings plus a timezone identifier separately.
- **Always** use `useAutoResizer()` in the Field location.
