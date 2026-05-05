# Agent Guide — ai-content-generator

## What This App Does
Generates text content using OpenAI's API (GPT models). Runs in the Entry Sidebar — users trigger generation from the sidebar, then choose to insert AI-generated text into rich-text or short-text fields via a Dialog.

## Archetype
Standard Vite app. See repo-level [ARCHITECTURE.md](../../ARCHITECTURE.md) for the full pattern.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure OpenAI API key, model, and per-content-type prompts |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Trigger generation; shows field selection UI |
| `LOCATION_DIALOG` | `src/locations/Dialog.tsx` | Streams AI output; lets user accept/reject before inserting |

## Key Dependencies

| Package | Version | Role |
|---------|---------|------|
| `openai` | ^4.x | OpenAI SDK — streaming text generation |
| `@contentful/app-sdk` | 4.23.0 | Location routing, field access |
| `@contentful/react-apps-toolkit` | 1.2.16 | `useSDK()`, `useCMA()` |
| `@contentful/rich-text-plain-text-renderer` | ^16 | Converts rich-text nodes to plain text for AI context |
| `@segment/analytics-next` | ^1.55 | Usage analytics |
| `contentful-management` | 11.14.0 | Direct CMA calls for content type field metadata |

## Source Layout

```
src/
├── App.tsx               # Location router
├── locations/            # ConfigScreen, Sidebar, Dialog
├── components/           # Shared UI components
├── configs/              # Content type / field configuration logic
├── hooks/                # Custom React hooks
├── providers/            # SegmentAnalyticsContext
├── prompts.ts            # Default prompt templates
├── richTextModel.ts      # Rich-text node helpers
└── utils/                # Misc utilities
```

## Sharp Edges & Invariants

- **OpenAI key is stored in installation parameters** — never log or expose `sdk.parameters.installation.apiKey`.
- **Streaming responses**: the Dialog uses OpenAI's streaming API. Do not refactor to non-streaming without testing perceived latency — streaming is intentional UX.
- **Rich-text insertion**: uses `sdk.field.setValue()` with a Contentful Document node, not a plain string. Always validate the node structure against `@contentful/rich-text-types`.
- **Segment analytics context** must be initialized before the Sidebar renders — it wraps the entire app tree in `providers/`.
- **`prompts.ts`** contains the default per-field-type prompts. Changes here affect all users who haven't configured custom prompts.

## Never / Always

- **Never** hardcode an OpenAI model name outside `configs/` — model selection is user-configurable.
- **Always** use `useAutoResizer()` in the Sidebar location.
- **Always** call `sdk.app.setReady()` at the end of ConfigScreen initialization.
