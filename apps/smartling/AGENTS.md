# Agent Guide — smartling

## What This App Does
Integrates Smartling (translation management platform) with Contentful. Lets editors send Contentful entries to Smartling for professional translation and receive translated content back.

## Archetype
**Legacy Lambda + Frontend** app. Published as `@contentful/smartling-frontend`.

## Structure

```
apps/smartling/
├── frontend/          # React app
│   └── src/
│       ├── App.tsx
│       ├── AppConfig.tsx    # Config screen
│       ├── Sidebar.tsx      # Entry sidebar
│       ├── smartlingClient.ts  # Smartling API client
│       └── index.tsx
├── lambda/            # AWS Lambda (Smartling API proxy + callback handler)
└── docs/              # Integration documentation
```

## Key Dependencies (frontend)

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Current Forma 36 |
| `lodash.get` | Safe property access |

## Sharp Edges & Invariants

- **Translation workflow**: entries are serialized from Contentful fields, sent to Smartling as translation jobs, and returned via a callback to the Lambda when translation is complete. The round-trip can take hours or days.
- **Smartling credentials** (user ID, user secret, project ID) are in installation parameters — never log them.
- **Content serialization**: Contentful rich-text and other field types must be converted to a format Smartling understands (typically XLIFF or HTML). The serialization/deserialization logic is critical — bugs here corrupt translated content.
- **Lambda handles callbacks**: when Smartling completes a translation, it calls back to the Lambda URL. The Lambda then writes translated content back to Contentful via CMA. If the Lambda is unreachable, translations will be lost.
- **`docs/`** directory: read this before making architectural changes — it likely explains the translation workflow and Smartling's specific integration requirements.

## Never / Always

- **Never** modify the content serialization format without testing with an actual Smartling job — deserialization errors will corrupt translated entries.
- **Never** log Smartling API credentials.
- **Always** ensure the Lambda callback URL is configured correctly in Smartling's project settings when deploying.
