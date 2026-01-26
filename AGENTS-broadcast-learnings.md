# Proposed AGENTS.md Changes: Reasoning & Evidence

This document explains the reasoning behind each proposed change to AGENTS.md, with evidence sourced from the broadcast app development experience and patterns observed across other apps in this repository.

---

## Summary of Changes

| Section | Type | Reasoning Source |
|---------|------|------------------|
| §9 React Apps Toolkit Integration | **New** | broadcast, braze, google-docs |
| §10 Contentful Functions Organization | **New** | broadcast, braze, google-docs |
| §11 Multi-Locale Field Resolution | **New** | broadcast |
| §12 Browser-Side Heavy Computation | **New** | broadcast |
| §13 SDK Notifier Pattern | **New** | broadcast, braze |
| §14 App Manifest Configuration | **New** | broadcast, klaviyo |
| §15 README Documentation Standards | **New** | broadcast |
| §16 Code Suggestions Scope | Renamed from §9 | - |

---

## Detailed Reasoning

### §9 React Apps Toolkit Integration

**Why this matters:**

Every React-based Contentful app in this repo uses `@contentful/react-apps-toolkit`, yet the original AGENTS.md never mentions it. During broadcast development, the proper typing of `useSDK<LocationSDK>()` was critical for TypeScript safety and IDE autocompletion.

**Evidence from broadcast:**

```tsx
// apps/broadcast/src/locations/Agent.tsx:63-64
const sdk = useSDK<AgentAppSDK>();
useAutoResizer();
```

```tsx
// apps/broadcast/src/locations/Sidebar.tsx:94-95
const sdk = useSDK<SidebarAppSDK>();
useAutoResizer();
```

```tsx
// apps/broadcast/src/locations/ConfigScreen.tsx:46
const sdk = useSDK<ConfigAppSDK>();
```

**Evidence from other apps:**

```tsx
// apps/braze/src/locations/Sidebar.tsx
const sdk = useSDK<SidebarExtensionSDK>();
```

```tsx
// apps/hubspot/src/locations/ConfigScreen.tsx
const sdk = useSDK<ConfigAppSDK>();
```

**Impact:** Without this guidance, agents may:
- Use the wrong SDK type, losing type safety
- Forget `useAutoResizer()`, causing layout issues
- Miss the `useCMA()` convenience hook

---

### §10 Contentful Functions Organization

**Why this matters:**

As functions grow in complexity, maintaining a single large file becomes difficult. The broadcast app evolved from a single `generate-audio.ts` to a modular structure, demonstrating the value of separation of concerns.

**Evidence from broadcast git history:**

The initial "big bang" commit (0cc5b7085) had a simple function structure. By the "mvp" commit (2f7e1c240), the function had grown significantly. Later commits show the emergence of the modular structure:

```
apps/broadcast/functions/
├── generate-audio.ts              # Main handler (497 lines)
└── generate-audio/
    ├── constants.ts               # 5 lines - field IDs
    ├── contentful.ts              # 247 lines - CMA operations
    ├── elevenlabs.ts              # 24 lines - API integration
    ├── logging.ts                 # 217 lines - analytics
    └── types.ts                   # 50 lines - type definitions
```

**Evidence from other apps:**

The google-docs app has an even more sophisticated modular structure:

```
apps/google-docs/functions/
├── service/
│   ├── contentTypeService.ts
│   ├── assetService.ts
│   ├── googleDriveService.ts
│   └── initCMAClient.ts
├── security/
│   ├── googleDocsValidator.ts
│   └── contentValidator.ts
├── oauth/
│   ├── initiateOauth.ts
│   ├── completeOauth.ts
│   └── ...
├── handlers/
│   └── createPreview/
└── agents/
    ├── documentParserAgent/
    └── contentTypeParserAgent/
```

The braze app uses a `common.ts` file for shared CMA utilities:

```ts
// apps/braze/functions/common.ts:17-30
export function initContentfulManagementClient(context: FunctionEventContext): PlainClientAPI {
  if (!context.cmaClientOptions) {
    throw new Error('CMA client options not available...');
  }
  return createClient(context.cmaClientOptions, {
    type: 'plain',
    defaults: { spaceId: context.spaceId, environmentId: context.environmentId },
  });
}
```

**Impact:** This pattern:
- Improves maintainability by separating concerns
- Makes testing easier (mock specific modules)
- Enables code reuse across functions

---

### §11 Multi-Locale Field Resolution

**Why this matters:**

Multi-locale handling is one of the most complex aspects of Contentful app development. The broadcast app needed sophisticated locale resolution with fallback chains, which is a pattern other apps will need too.

**Evidence from broadcast:**

The `apps/broadcast/functions/generate-audio/contentful.ts` file contains 247 lines dedicated to field resolution:

```ts
// apps/broadcast/functions/generate-audio/contentful.ts:40-61
export const buildFallbackChain = (
  locales: LocaleProps[],
  targetLocale: string,
  defaultLocale: string
): string[] => {
  const localeMap = new Map(locales.map((locale) => [locale.code, locale]));
  const chain: string[] = [];
  const visited = new Set<string>();

  let current: string | undefined = targetLocale;
  while (current && !visited.has(current)) {
    chain.push(current);
    visited.add(current);
    current = localeMap.get(current)?.fallbackCode ?? undefined;
  }

  if (!chain.includes(defaultLocale)) {
    chain.push(defaultLocale);
  }

  return chain;
};
```

The `resolveFieldLocalization` function determines if a field is localized:

```ts
// apps/broadcast/functions/generate-audio/contentful.ts:90-103
export const resolveFieldLocalization = (
  contentType: ContentTypeProps,
  fieldId: string
): { isLocalized: boolean; fieldName: string } | null => {
  const field = contentType.fields.find((contentField) => contentField.id === fieldId);
  if (!field) return null;
  return {
    isLocalized: Boolean(field.localized),
    fieldName: field.name ?? fieldId,
  };
};
```

**Impact:** Without this guidance, agents may:
- Assume all fields are localized (or non-localized)
- Miss the fallback chain logic, breaking multi-locale apps
- Produce incorrect field value resolution

---

### §12 Browser-Side Heavy Computation

**Why this matters:**

Contentful Functions have timeout limits (typically 10-15 seconds). Video processing, large file operations, or complex computations can exceed these limits. The broadcast app solved this by running ffmpeg.wasm in the browser.

**Evidence from broadcast:**

The entire `useVideoGenerator.ts` hook (216 lines) runs in the browser:

```ts
// apps/broadcast/src/hooks/useVideoGenerator.ts:1-8
import { useCallback, useRef, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import coreURL from '@ffmpeg/core?url';

// Single-threaded core avoids SharedArrayBuffer requirements in Contentful iframes.
const FFMPEG_CORE_BASE_URL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
```

The README documents this architectural decision:

```markdown
// apps/broadcast/README.md:26-27
- **Video Rendering**: ffmpeg.wasm runs in the browser to avoid serverless timeouts
- **Agent UI**: Forma 36 AI components + Vercel AI SDK `useChat`
```

The Agent location uses client-side tool execution:

```ts
// apps/broadcast/src/locations/Agent.tsx:82-84
// Handle tool calls from the agent (client-side execution)
const handleToolCall = useCallback(
  async (toolInvocation: AgentToolCall): Promise<string> => {
```

While the server only defines tool schemas without execution:

```ts
// apps/broadcast/server/src/server.ts:9-24
// Tool definitions for client-side execution
// These tools are defined on the server but executed by the client using sdk.cma
const tools = {
  find_entry: tool({
    description: 'Search for entries by text/title to get their ID.',
    inputSchema: z.object({
      query: z.string().describe('The search query to find entries'),
    }),
    // No execute - client handles this
  }),
```

**Impact:** This pattern enables:
- Long-running operations without function timeouts
- Access to browser APIs (Canvas, WebAudio, File System Access)
- Lower serverless costs for compute-intensive operations

---

### §13 SDK Notifier Pattern

**Why this matters:**

Consistent user-facing error messages improve UX. The `sdk.notifier` API is the standard way to show feedback in Contentful apps, but it wasn't mentioned in the original AGENTS.md.

**Evidence from broadcast:**

The Sidebar component uses notifier consistently:

```ts
// apps/broadcast/src/locations/Sidebar.tsx:167-168
if (!audioField) {
  sdk.notifier.error(`Missing field: ${AUDIO_ASSET_FIELD_ID}`);
```

```ts
// apps/broadcast/src/locations/Sidebar.tsx:299-301
if (videoField) {
  // ...
} else {
  sdk.notifier.warning(`Video generated but missing field: ${VIDEO_ASSET_FIELD_ID}. Unable to link.`);
}
sdk.notifier.success('Video generated and uploaded.');
```

The ConfigScreen uses notifier for validation:

```ts
// apps/broadcast/src/locations/ConfigScreen.tsx:62-64
if (!parameters.useMockAi && !parameters.elevenLabsApiKey) {
  sdk.notifier.error('Please provide an ElevenLabs API key or enable mock mode.');
  return false;
}
```

**Evidence from other apps:**

Braze uses the same pattern:

```ts
// apps/braze/src/locations/Sidebar.tsx (similar pattern)
sdk.notifier.error('Failed to generate content blocks');
```

**Impact:** This ensures:
- Consistent error handling across all apps
- User-friendly messages (not raw error objects)
- Appropriate severity levels (error vs warning vs success)

---

### §14 App Manifest Configuration

**Why this matters:**

The `contentful-app-manifest.json` is crucial for app deployment but wasn't covered in the original AGENTS.md. Understanding manifest structure helps agents configure apps correctly.

**Evidence from broadcast:**

The broadcast manifest (240 lines) configures:

```json
// apps/broadcast/contentful-app-manifest.json (excerpt)
{
  "functions": [
    {
      "id": "generateAudio",
      "name": "Generate Audio",
      "path": "functions/generate-audio.ts",
      "entryFile": "./functions/generate-audio.ts",
      "accepts": ["appaction.call"],
      "allowNetworks": [
        "api.contentful.com",
        "upload.contentful.com",
        "api.elevenlabs.io",
        "raw.githubusercontent.com"
      ]
    }
  ],
  "actions": [
    {
      "id": "generateAudio",
      "name": "Generate Audio",
      "type": "function-invocation",
      "functionId": "generateAudio",
      "parameters": [...]
    }
  ]
}
```

**Impact:** Agents need to understand:
- How to add new locations
- How to configure function network access
- How to define App Action parameters

---

### §15 README Documentation Standards

**Why this matters:**

The broadcast README grew to 388 lines during development, demonstrating what comprehensive app documentation looks like. Other apps (like google-docs) have minimal boilerplate READMEs.

**Evidence from broadcast:**

The README includes:
- Architecture overview (frontend + backend + key libraries)
- Prerequisites
- Content model setup with field requirements
- Multiple usage sections (Audio, Video, Usage Metrics, Agent)
- Configuration parameters explained
- Full project structure tree
- Development workflow (including ngrok for local agent dev)
- Detailed flow diagrams for audio, video, and metrics generation

**Contrast with google-docs:**

```markdown
// apps/google-docs/README.md (only 99 lines, mostly boilerplate)
This project was bootstrapped with [Create Contentful App]...
```

**Impact:** Good README documentation:
- Helps new developers onboard quickly
- Documents architectural decisions
- Serves as reference for content model setup

---

## Changes Preserved from Original

The following sections were preserved unchanged:
- §1 Context & Scope
- §2 Golden Rules
- §3 Official Tooling & Documentation
- §4 Dependencies & Libraries Policy
- §5 TypeScript, Coding Standards & Architecture
- §6 UI with Forma 36
- §7 Folder Organization
- §8 Testing Requirements

These sections remain valuable and comprehensive. The new sections complement rather than replace them.

---

## Implementation Notes

### For PR Review

When reviewing these changes, consider:

1. **Specificity vs Flexibility**: The new sections provide specific patterns. Some teams may prefer more general guidance.

2. **Code Examples**: All code examples are drawn from actual app code. Consider whether to include inline or reference files.

3. **Scope**: These guidelines are specific to this repo's patterns. Other Contentful app repos may have different conventions.

### Future Considerations

Potential additions for future iterations:
- Testing patterns (mocking SDK, CMA)
- CI/CD deployment guidance
- App event handling patterns
- Field editor integration patterns
