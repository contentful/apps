# Agent Guide — image-focal-point

## What This App Does
Adds a focal point selector to Contentful image assets. Lets editors mark the "focus area" of an image so that image cropping (via the Contentful Images API) centers on the selected point rather than defaulting to center crop.

## Archetype
Standard Vite app (legacy). Published as `@contentful/image-focal-point`.

> This app uses **JSX, not TSX**. TypeScript is not enforced.

## Structure

```
src/
├── index.jsx          # App entry + location router
├── index.spec.jsx     # Snapshot tests
├── components/        # Focal point UI (drag-to-set point on image)
├── utils.js
└── test/
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI (current version) |
| `@contentful/f36-tokens` | Design tokens |
| `react` | UI |

## Sharp Edges & Invariants

- **JSX, not TSX** — TypeScript is not enforced. Do not add TS types without a full migration.
- **Focal point is stored as a JSON object** `{ x: 0.5, y: 0.5 }` (normalized 0–1 coordinates) in the asset's metadata or a custom field — verify the exact storage mechanism in `src/utils.js` before modifying.
- The focal point UI renders an image with a draggable overlay — coordinates are calculated relative to the rendered image dimensions, which change on resize. The drag handler must account for the image's bounding rect.
- **Snapshot tests**: `src/index.spec.jsx` and `src/components/` snapshots will fail if you change UI output. Update snapshots intentionally with `vitest --update-snapshots`.

## Never / Always

- **Never** store focal point as pixel coordinates — store as normalized 0–1 values so they are resolution-independent.
- **Always** clamp focal point values to `[0, 1]` — values outside this range are invalid for the Images API.
