# Agent Guide — wistia-videos

## What This App Does
Integrates Wistia (video hosting platform) as a Digital Asset Management (DAM) source. Lets editors select Wistia videos from their Wistia account for use in Contentful fields.

## Archetype
**DAM base app** — wraps `@contentful/dam-app-base`. Also uses Forma 36 components for custom UI.

## Structure

```
apps/wistia-videos/
└── src/
    ├── index.tsx          # Mounts dam-app-base with Wistia config
    ├── components/        # Custom Wistia video thumbnail/preview components
    ├── functions/         # Wistia API helper functions
    └── test/
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/dam-app-base` | Provides the DAM integration UI framework |
| `@contentful/f36-components` | Forma 36 UI (used for custom thumbnail renderer) |
| `@contentful/f36-layout` | Layout components |
| `react` | UI |

## Sharp Edges & Invariants

- **DAM base app with extra UI**: unlike simpler DAM apps (brandfolder, dropbox), this one uses `@contentful/f36-components` for custom components. The `components/` directory renders Wistia video thumbnails with metadata.
- **Wistia API token** is in installation parameters — never log it.
- **Wistia's picker**: check `src/functions/` for how the Wistia asset list is fetched. Wistia does not have an embeddable picker UI (unlike Dropbox/Frontify) — the video list is likely fetched via Wistia's REST API and displayed in a custom list.
- Stored value format: check `dam-app-base` documentation for the expected asset object shape. Wistia videos have a `hashedId` as the unique identifier.

## Never / Always

- **Never** bypass `dam-app-base` extension points for the core picker flow.
- **Always** return video assets in `dam-app-base`'s expected format (with at least `id`, `url`, `filename`).
