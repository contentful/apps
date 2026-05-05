# Agent Guide — bedrock-content-generator

## What This App Does
Generates text content using AWS Bedrock (Claude/Titan models). Functionally mirrors `ai-content-generator` but calls AWS Bedrock instead of OpenAI. Runs in the Entry Sidebar with a Dialog for reviewing and inserting generated content.

## Archetype
Standard Vite app. Nearly identical structure to `ai-content-generator`.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure AWS credentials, region, model ID, and per-content-type prompts |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Trigger generation; field selection UI |
| `LOCATION_DIALOG` | `src/locations/Dialog.tsx` | Stream AI output; accept/reject before inserting |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | 4.23.0 — location routing, field access |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useCMA()` |
| `@contentful/rich-text-plain-text-renderer` | Converts rich-text to plain text for AI prompts |
| `contentful-management` | CMA for content type metadata |

> AWS SDK is NOT in the standard `dependencies` — Bedrock calls likely go through a backend endpoint or use fetch directly. Check `src/` for the actual HTTP client implementation.

## Source Layout

```
src/
├── App.tsx
├── locations/       # ConfigScreen, Sidebar, Dialog
├── components/
├── configs/         # Content type / prompt configuration
├── hooks/
├── providers/
└── utils/
```

## Sharp Edges & Invariants

- **LavaMoat (`allow-scripts`)**: this is the only app in the repo using LavaMoat. After `npm install`, run `npm run allow-scripts` before building. CI handles this automatically but local dev requires it.
- **AWS credentials** are in installation parameters — never log `accessKeyId`, `secretAccessKey`, or `sessionToken`.
- **Rich-text insertion** uses the same Contentful Document node pattern as `ai-content-generator` — validate against `@contentful/rich-text-types`.
- Structurally mirrors `ai-content-generator` — when fixing a bug in one, check if the same issue exists in the other.

## Never / Always

- **Never** skip `npm run allow-scripts` after bootstrap — the build will fail silently on lifecycle scripts.
- **Always** use `useAutoResizer()` in the Sidebar.
- **Always** call `sdk.app.setReady()` at the end of ConfigScreen initialization.
