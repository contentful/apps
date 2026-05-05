# Agent Guide — slack

## What This App Does
Sends notifications to Slack channels when Contentful entries are published, unpublished, or updated. Configures Slack webhook URLs per content type and environment.

## Archetype
**Legacy Lambda + Frontend** app.

## Structure

```
apps/slack/
├── frontend/                  # React app (ConfigScreen)
│   └── src/
├── lambda/                    # AWS Lambda (Slack notification dispatch)
└── contentful-app-manifest.json
```

## Sharp Edges & Invariants

- **Lambda dispatches Slack notifications** — Contentful triggers the Lambda via webhook or App Event. The frontend only manages configuration (Slack webhook URLs).
- **Slack webhook URLs** are incoming webhooks (pre-authenticated). They are stored in installation parameters — never log or expose them. A leaked webhook URL lets anyone post to that Slack channel.
- **Slack message format**: check the Lambda for the Block Kit or `text` payload format. Slack's Block Kit schema is version-sensitive — test message rendering after any payload changes.
- `contentful-app-manifest.json` may define App Event bindings — update if adding new trigger events.
- This app uses Lambda (not App Actions) — if it needs to be modernized, that is a significant architectural change.

## Never / Always

- **Never** log or expose Slack incoming webhook URLs.
- **Never** call Slack webhooks from the frontend — all Slack calls must go through the Lambda.
