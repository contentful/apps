# Asana App

Contentful Marketplace app scaffold for an automation-first Asana integration.

## Current scope

This first version provides:

- an app configuration screen with an Asana OAuth 2.0 connect flow,
- installation parameters holding only a long-lived OAuth refresh token (never an access token),
- connection validation through a Contentful app action,
- workspace and project lookup so default destinations can be stored for later actions,
- create/comment/update task actions (see [Available app actions](#available-app-actions)).

Planned next steps:

- UX polish, better defaults and error states, Marketplace-readiness review (MAPS-251).

## Available app actions

| Action                                                | Use it when...                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createAsanaTaskAction`                               | You need a **new** Asana task — e.g. linking a Contentful entry to a fresh task for the first time. Accepts a title/notes and optional workspace/project overrides; can also link the created task back to a Contentful entry.                                                                                                                                                |
| `addAsanaCommentAction`                               | The task already exists and you want to **append a note to its activity feed** without changing any of its fields — e.g. posting a Contentful publish/status update as a comment on a task that's already linked. Do not use this to create a task; it only operates on an existing `taskId`.                                                                                 |
| `updateAsanaTaskAction`                               | The task already exists and you need to **change its own fields**. Currently supports: `title` (task name), `notes`, and `completed`. Assignee, due date, and section/project placement are **not supported yet** — passing them has no effect. At least one of the three supported fields must be provided, and the task must be identified by GID or a full Asana task URL. |
| `getAsanaTaskAction` / `getAsanaTasksAction`          | Look up a single task's current state, or search a workspace/project for tasks by name — read-only, no side effects.                                                                                                                                                                                                                                                          |
| `getAsanaWorkspacesAction` / `getAsanaProjectsAction` | List/search the workspaces and projects visible to the connected Asana account — mainly used by the config screen to populate defaults.                                                                                                                                                                                                                                       |
| `validateAsanaCredentialsAction`                      | Confirm the stored OAuth connection is still valid.                                                                                                                                                                                                                                                                                                                           |
| `exchangeAsanaOAuthCodeAction`                        | Internal to the config screen's Connect-to-Asana popup flow — not meant to be called from an Automation.                                                                                                                                                                                                                                                                      |

All actions return a structured `{ success, message, ... }` result (see each action's `resultSchema` in `contentful-app-manifest.json`); `updateAsanaTaskAction` and `getAsanaTaskAction` additionally return the task's post-action state under `task`.

## Local development

```bash
cd apps/asana
npm install
npm run start
```

Build functions before upload:

```bash
npm run build
```

Upsert actions after the app definition exists:

```bash
npm run upsert-actions
```

## Current auth flow

This app authenticates to Asana via OAuth 2.0:

1. An installer registers an OAuth app in the Asana developer console and enters its client ID and
   client secret in the config screen.
2. Clicking "Connect to Asana" opens Asana's authorize screen in a popup (with PKCE and a CSRF
   `state` check). The popup redirects back to this app's own hosted URL
   (`?oauthCallback=1`), which hands the code back to the config screen via `postMessage`
   (`src/oauth/OAuthCallback.tsx`).
3. The config screen exchanges that code for tokens via the `exchangeAsanaOAuthCodeAction` app
   action (`functions/exchangeAsanaOAuthCode.ts`) — the only place the client secret is used.
4. Only the long-lived refresh token is persisted, in installation parameters. Access tokens are
   never stored: every Asana-calling function mints one on demand from the refresh token via
   `getAsanaAccessToken`/`getAsanaAccessTokenFromParameters` in `functions/asanaClient.ts`.
