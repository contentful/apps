# Agent Guide — ai-image-tagging

## What This App Does
Automatically tags Contentful assets using AI image recognition. Writes tags back to asset fields or Contentful's native tagging system.

## Archetype
**Legacy Lambda + Frontend**. Frontend is a React app under `frontend/`; backend logic runs as AWS Lambda functions under `lambda/`.

## Structure

```
apps/ai-image-tagging/
├── frontend/          # React app (@contentful/ai-image-tagging-frontend)
│   └── src/
│       ├── components/
│       └── index.jsx  # JSX, not TSX
├── lambda/            # AWS Lambda handlers
└── LICENSE
```

## Key Dependencies (frontend)

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@emotion/css` | CSS-in-JS (used alongside F36 tokens) |
| `react` | UI |

## Sharp Edges & Invariants

- **Lambda, not App Actions** — backend calls go to an AWS Lambda URL stored in installation parameters. There is no `app-actions/` directory. Do not attempt to convert to App Actions without understanding the full Lambda deployment setup.
- **JSX, not TSX** — the frontend uses `.jsx` files. TypeScript strictness does not apply here. Do not add `.tsx` extensions without a migration plan.
- **Lambda URL** is in installation parameters — never hardcode it.
- The Lambda handles the actual AI API calls; the frontend only triggers the Lambda and displays results.

## Never / Always

- **Never** call AI APIs directly from the frontend — all AI logic must go through the Lambda.
- **Always** read Lambda URL from `sdk.parameters.installation` at runtime.
