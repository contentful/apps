## Overview

Contentful app that lets editors pick Phosphor icons with weight filtering. Configuration is saved as installation parameters; field values store the chosen icon name/component and weight.

## App locations

- Config screen: checkbox list of enabled icon weights. Saved as a serialized array (`enabledWeights`) in installation parameters. Default is `regular` if nothing stored.
- Field: shows current icon (if any) and opens the dialog. Stores an `IconFieldValue` with `name`, `componentName`, and `weight`.
- Dialog: searchable, weight-filtered icon picker. Primary action labeled “Select”.

## Search behavior

Search uses Fuse.js in `useIconSearch` (src/hooks/useIconSearch.ts) to fuzzy-match against icon catalog data loaded from `@phosphor-icons/core` via `useIconCatalog` (src/hooks/useIconCatalog.ts). The search indexes three fields of each `IconCatalogEntry`:

- **name** (weight 2): kebab-case icon name, e.g. `airplane-tilt`, `heart-handshake`. Highest priority.
- **componentName** (weight 1.5): PascalCase React component name, e.g. `AirplaneTilt`, `HeartHandshake`.
- **tags** (weight 1): semantic search tags from Phosphor, e.g. `airplane` has tags `["plane", "travel", "flight"]`. Lowest priority.

Query matching:

- Minimum 2 characters before search activates; shorter queries show the full catalog.
- Threshold 0.3 enforces stricter matching (fewer false positives).
- `ignoreLocation` enabled so matches anywhere in a field are scored equally.

Examples: searching `"heart"` matches `heart-handshake`, `heart-straight`, etc. Searching `"fly"` matches icons tagged `["flight", "plane"]`.

## Running and building

- `npm start` — run the app and update the app definition for local dev.
- `npm run build` — production build in `build/`.
- `npm run upload` — build upload helper for Contentful (prompts for required arguments).
- `npm run upload-ci` — upload using env vars (`CONTENTFUL_ORG_ID`, `CONTENTFUL_APP_DEF_ID`, `CONTENTFUL_ACCESS_TOKEN`).

## Updating the Phosphor icons

Icons are bundled from the npm packages `@phosphor-icons/core` and `@phosphor-icons/react`:

1. Update the versions in `package.json` (e.g. `npm install @phosphor-icons/core@latest @phosphor-icons/react@latest`).
2. Rebuild and redeploy (`npm run build`, then `npm run upload` or your CI upload). The app ships the icon catalog at build time; no runtime fetch is needed.
3. If a new icon weight is added upstream, expose it in `ICON_WEIGHTS`/`ICON_WEIGHT_LABELS` and the config screen before building.
