# Agent Guide — typeform

## What This App Does
Integrates Typeform with Contentful. Lets editors embed Typeform surveys/forms in Contentful entries by selecting from their Typeform account's available forms.

## Archetype
**Legacy Lambda + Frontend** app.

## Structure

```
apps/typeform/
├── frontend/          # React app
│   └── src/           # Standard location pattern
├── lambda/            # AWS Lambda (Typeform API proxy)
└── LICENSE
```

## Sharp Edges & Invariants

- **Lambda proxies Typeform API** — Typeform OAuth tokens are kept server-side in the Lambda. The frontend does not hold Typeform credentials directly.
- **Typeform OAuth 2.0**: uses authorization code flow. The OAuth callback likely points to the Lambda, which exchanges the code for tokens and stores them.
- **Stored value**: the field stores a Typeform form ID (string). The frontend fetches form metadata at render time using the Lambda.
- Lambda URL is in installation parameters.

## Never / Always

- **Never** store Typeform OAuth tokens in installation parameters or entry fields — keep them in the Lambda's environment/secrets store.
- **Never** call the Typeform API from the frontend.
