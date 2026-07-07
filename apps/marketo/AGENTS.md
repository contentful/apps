# Agent Guide — marketo

## What This App Does
Integrates Adobe Marketo with Contentful. Lets editors embed Marketo forms in Contentful pages by selecting from available forms via a custom field editor. Published as `adobe-marketo-form-selector`.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Marketo Munchkin ID, client ID/secret |
| `LOCATION_ENTRY_FIELD` | `src/locations/Field.tsx` | Custom field editor — select a Marketo form from a dropdown |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | Field value read/write |
| `@contentful/f36-components` | Forma 36 UI |
| `contentful-management` | CMA for field metadata |

## Source Layout

```
src/
├── App.tsx
├── locations/       # ConfigScreen, Field
├── components/
├── hooks/
├── const.ts         # Marketo API endpoint constants
└── utils.ts
```

## Sharp Edges & Invariants

- **Field location** — replaces the standard text field with a Marketo form selector dropdown. The stored value is the Marketo form ID (a number or string identifier).
- **Marketo REST API**: form listings are fetched from the Marketo REST API using installation parameter credentials. The Marketo API requires OAuth 2.0 (client credentials grant) — check `src/hooks/` for the token fetch implementation.
- **Marketo Munchkin ID** and **client credentials** are in installation parameters — never log or expose them.
- `src/const.ts` contains Marketo API base URLs — these vary by Marketo instance (each Marketo account has a unique subdomain).

## Never / Always

- **Never** store Marketo OAuth access tokens in field values — they are short-lived and should be fetched fresh per session.
- **Always** use `useAutoResizer()` in the Field location.
