## Overview

Phosphor Icon is a Contentful field app that lets editors search the Phosphor icon library and store a presentation-light JSON payload with the selected icon name, React component name, weight, and position.

## What this version adds

- A Marketplace-style configuration screen in the shared `contentful/apps` repo.
- Content type assignment that automatically creates and assigns a `Phosphor icon` JSON field.
- Configurable weight options, now including `duotone`.
- Configurable position options with defaults of `start` and `end`.
- An install-time choice between exposing all icons or a curated list of specific icons.
- A dialog header preview so the currently selected icon stays visible while changing weight or position.

## App locations

- Config screen: controls content type assignment, enabled weights, position options, and allowed icons.
- Field: shows the saved icon summary and opens the dialog.
- Dialog: searchable icon picker used both for field selection and for curating allowed icons in config.

## Search behavior

Search uses Fuse.js in [`src/hooks/useIconSearch.ts`](./src/hooks/useIconSearch.ts) to fuzzy-match against icon catalog data loaded from `@phosphor-icons/core` via [`src/hooks/useIconCatalog.ts`](./src/hooks/useIconCatalog.ts).

- `name` has the highest weight.
- `componentName` is also indexed.
- `tags` support semantic matches like `food`, `travel`, or `notification`.

## Running locally

```bash
npm ci
npm start -- --host localhost --port 3001
```

Open `http://localhost:3001/`, then point the Contentful app definition to that local URL for testing.

## Validation

```bash
npm run test:ci
npm run build
```

## Hosted build and deploy

To create a shareable hosted build instead of running locally:

```bash
npm run build
npm run deploy
```

The deploy script uploads the built app to the existing Phosphor Icon app definition:

- app definition id: `21NU7HfPZfpcDRF1WeJJte`
- required env vars: `DEFINITIONS_ORG_ID`, `CONTENTFUL_CMA_TOKEN`

If you want to deploy to a staging/test definition instead, set `DEV_TESTING_ORG_ID`, `TEST_CMA_TOKEN`, and `STAGING_APP_ID`, then run:

```bash
npm run deploy:test
```
