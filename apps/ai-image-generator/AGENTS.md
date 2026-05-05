# Agent Guide — ai-image-generator

## What This App Does
Generates images using an AI image model and inserts them as Contentful assets. Published as `@contentful/ai-image-generator`.

## Archetype
Minimal Vite app — only `@contentful/app-scripts` is listed as a dependency in the root `package.json`, suggesting most logic lives in the frontend subpackage or this app is lightly scaffolded. Inspect `src/` before adding code.

## Source Layout

```
apps/ai-image-generator/
├── src/               # App source (inspect before editing)
├── package.json       # @contentful/ai-image-generator
└── README.md
```

> No `src/locations/` directory was found at audit time. Verify current structure with `ls src/` before making changes.

## Sharp Edges & Invariants

- **Inspect `src/` before any change** — this app may have a non-standard structure compared to the rest of the repo.
- When inserting AI-generated images as Contentful assets: use the CMA upload flow (`space.createAssetFromFiles` or `space.createAsset` + `asset.processForAllLocales()`), not a raw URL reference.
- Asset processing is async — always poll `asset.processForAllLocales()` and `asset.publish()` rather than assuming immediate availability.

## Never / Always

- **Never** write image data to a `Text` or `Symbol` field — use a `Link<Asset>` field.
- **Always** check `sdk.parameters.installation` for API key / model config before hardcoding.
