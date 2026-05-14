# Agent Guide — microsoft-teams

## What This App Does
Sends notifications to Microsoft Teams channels when Contentful entries are published or updated. Configures webhook URLs per content type and environment.

## Archetype
**App Actions + Frontend** app. Published as `@contentful/microsoft-teams`.

## Structure

```
apps/microsoft-teams/
├── frontend/                  # React app
│   └── src/
│       ├── index.tsx
│       └── locations/         # ConfigScreen (Teams webhook config)
├── app-actions/               # App Action handlers (notification dispatch)
├── contentful-app-manifest.json
├── build-actions.js           # Builds app-actions for deployment
├── types.ts                   # Shared types (frontend + app-actions)
└── package.json
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-scripts` | Deploy tooling |
| `contentful-management` | CMA for reading content in app-actions |

## Sharp Edges & Invariants

- **App Actions handle all notification dispatch** — the frontend only manages configuration (webhook URLs). Notifications are triggered by App Actions responding to Contentful events (publish/unpublish), not by the frontend.
- **Microsoft Teams Incoming Webhook format**: Teams uses an Adaptive Card or `MessageCard` JSON payload. The App Action must format the payload correctly — Teams is strict about its card schema.
- **Webhook URLs** are stored in installation parameters — they contain auth tokens (Teams webhooks are pre-authenticated URLs). Never log them.
- **`types.ts` at root** is shared between frontend and app-actions — keep it as the single source of truth for shared interfaces.
- `contentful-app-manifest.json` defines the App Action event bindings — if you add a new trigger (e.g. `Asset.publish`), update the manifest.

## Never / Always

- **Never** send Teams notifications from the frontend — always use App Actions.
- **Never** log webhook URLs.
- **Always** update `contentful-app-manifest.json` when adding or removing App Action event bindings.
