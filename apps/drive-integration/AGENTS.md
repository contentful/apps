# Agent Guide — drive-integration

## What This App Does
Connects Google Docs to Contentful. Lets editors import a Google Doc's content directly into a Contentful rich-text field, handling the conversion from Google Docs format to Contentful's rich-text document model.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Google OAuth credentials and mappings |
| `LOCATION_PAGE` | `src/locations/Page/` | Main import UI — browse/select Google Docs |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/field-editor-json` | JSON field editor (for raw doc preview) |
| `@contentful/node-apps-toolkit` | Shared utilities |
| `contentful-management` | CMA for writing imported content |

## Source Layout

```
src/
├── App.tsx
├── locations/         # ConfigScreen, Page (+ LocalhostWarning.tsx — dev-only component, not an sdk location)
├── hooks/
├── services/          # Google Docs API client and doc conversion logic
├── fixtures/          # Test fixtures for doc conversion
└── types/
```

## Sharp Edges & Invariants

- **Google OAuth**: uses Google's OAuth 2.0 flow. The redirect URI must match the app's installed URL — in local dev, OAuth redirects won't work without a tunneled URL (e.g. ngrok). The `LocalhostWarning` location surfaces this to developers.
- **Doc conversion in `services/`**: converting Google Docs format to Contentful rich-text Document nodes is complex — it handles headings, lists, tables, inline styles, and embedded images. Do not rewrite this without thorough testing against diverse document structures.
- **Images in Google Docs** are handled specially — they must be uploaded as Contentful assets before being referenced in the rich-text document. The conversion pipeline handles this asynchronously.
- Google API credentials are in installation parameters.

## Never / Always

- **Never** write a Google Doc's raw JSON directly to a Contentful field — always convert via the `services/` conversion layer.
- **Always** handle Google API rate limits (100 requests/100 seconds per user).
