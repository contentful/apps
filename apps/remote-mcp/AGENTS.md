# Agent Guide — remote-mcp

## What This App Does
Provides a configuration UI for connecting Contentful to a remote MCP (Model Context Protocol) server. Lets space admins configure the MCP server URL and authentication so that Contentful's AI features can use it as a tool source.

## Archetype
Standard Vite app. Config-screen-only app (single location).

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure remote MCP server URL and credentials |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()` |
| `contentful-management` | CMA |

## Source Layout

```
src/
├── App.tsx
├── locations/       # ConfigScreen only
├── components/
├── hooks/
└── utils/
```

## Sharp Edges & Invariants

- **MCP server URL and credentials** are stored in installation parameters. These are sensitive — the MCP server may have broad access to tools/resources. Never log or expose them.
- This is a newer app — the MCP protocol spec is still evolving. Be cautious about hardcoding protocol version assumptions.
- The app only manages configuration — it does not execute MCP calls itself. MCP communication happens at the Contentful platform level.

## Never / Always

- **Never** log the MCP server credentials.
- **Always** call `sdk.app.setReady()` after initialization in ConfigScreen.
