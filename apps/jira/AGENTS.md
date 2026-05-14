# Agent Guide — jira

## What This App Does
Integrates Jira with Contentful. Lets editors link Contentful entries to Jira issues, view linked issue status, and create new Jira issues from within Contentful. Published as `@contentful/jira`.

## Archetype
Complex multi-package app. Has both a React frontend and a serverless `functions/` backend, plus a standalone `jira-app/` sub-package.

## Structure

```
apps/jira/
├── jira-app/               # Main Vite app (frontend)
│   └── src/
│       ├── index.tsx
│       ├── App.tsx
│       ├── locations/      # ConfigScreen, Sidebar, Dialog, Page
│       ├── components/
│       ├── configs/
│       ├── constants/
│       ├── context/
│       ├── helpers/
│       ├── hooks/
│       └── utils/
├── functions/              # Serverless Jira API proxy
│   └── src/
│       ├── index.ts
│       └── lib/            # Jira REST API client
├── scripts/                # Deploy and setup scripts
└── package.json            # Root orchestration
```

## Locations (jira-app)

| Location | Purpose |
|----------|---------|
| `ConfigScreen` | Configure Jira Cloud instance URL, OAuth credentials, and project mappings |
| `Sidebar` | Show linked Jira issues for current entry; link/unlink issues |
| `Dialog` | Jira issue search and creation |
| `Page` | Full-page Jira project overview |

## Key Dependencies

| Package | Role |
|---------|------|
| `contentful-management` | CMA for reading entry and content type data |
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |

## Sharp Edges & Invariants

- **OAuth**: Jira uses Atlassian OAuth 2.0 (3-legged). The OAuth token is stored in installation parameters after the OAuth flow. Token refresh must be handled — check `functions/src/lib/` for refresh logic.
- **`functions/`**: The Jira API proxy runs as a serverless function (check `serverless.yml` for provider). All Jira API calls are proxied through this backend to keep credentials server-side.
- **Two separate `package.json` files**: `jira-app/package.json` and `functions/package.json`. Bootstrap and build both independently when making changes across the stack.
- **`jira-app/` and root `package.json`** both have scripts — the root orchestrates both frontend and functions builds via `npm run start`, `npm run dev`.
- Jira issue data is stored as a JSON array in a Contentful JSON field — changes to the stored schema require a migration of existing data.

## Never / Always

- **Never** make Jira API calls from the frontend — all Jira API calls must go through `functions/`.
- **Never** store Atlassian OAuth tokens in Contentful entry fields — use installation parameters.
- **Always** handle expired OAuth tokens — the proxy must attempt token refresh before returning a 401 to the frontend.
