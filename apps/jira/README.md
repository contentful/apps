# Jira App

Contentful app that links entries to Jira issues. Requires the [Contentful Jira companion app](https://marketplace.atlassian.com/apps/1221865/contentful) installed in Jira and this app installed in a Contentful space.

---

## Quick start (first time or after long break)

**Interactive setup** (recommended):

```bash
cd apps/jira
npm run setup
```

The setup script checks dependencies and `.env`, prints the Atlassian checklist, and can start the dev server. Use it whenever you’re unsure what’s configured.

**Manual one-time setup** is below; for “I just want to run it” see [Running locally](#running-locally).

---

## One-time setup (runbook)

Do this once per machine (or when `.env` / Atlassian app are missing).

### 1. Install dependencies

```bash
cd apps/jira
npm install
cd functions && npm install && cd ..
```

### 2. Environment (`.env`)

```bash
cp .env.example .env
```

Edit `apps/jira/.env` and set:

| Variable | Where to get it |
|----------|------------------|
| `NGROK_AUTHTOKEN` | [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken) (free signup: [signup](https://dashboard.ngrok.com/signup)) |
| `ATLASSIAN_APP_CLIENT_ID` | [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/) → your app → Settings / Credentials |
| `ATLASSIAN_APP_CLIENT_SECRET` | Same place as client ID |

### 3. Atlassian app (OAuth)

1. Go to [developer.atlassian.com/console/myapps](https://developer.atlassian.com/console/myapps/) and open (or create) your app.
2. **Authorization** → **Callback URLs**  
   Add (replace with your ngrok URL once dev is running):
   - `https://YOUR_NGROK_URL/test/auth`  
   The dev server prints the exact URL when you run `npm run dev` (“In Atlassian OAuth callback URL use: …”).
3. **Permissions** → **Jira API** → add these scopes:
   - `read:jira-user`
   - `read:jira-work`
   - `write:jira-work`
4. **Save changes.**

---

## Running locally

From `apps/jira`:

```bash
PORT=1234 npm run dev
```

- **Frontend:** http://localhost:1234  
- **Lambda (serverless-offline):** http://localhost:3000  
- **Auth callback:** `https://YOUR_NGROK_URL/test/auth` (printed in the terminal)

If the ngrok URL changed since last time, update the **Callback URL** in the Atlassian app to match the printed URL.

---

## Troubleshooting

| Symptom | Cause | Fix |
|--------|--------|-----|
| **502 from ngrok** | Lambda handler failed (e.g. unsupported runtime). | Runtime is set to `nodejs22.x` for serverless-offline. Restart dev. |
| **“Unsupported runtime”** in Lambda logs | serverless-offline may not support the chosen runtime. | Ensure `functions/serverless.yml` uses a runtime supported by your serverless-offline version (e.g. `nodejs22.x` for v13.x). |
| **“redirect_uri is not registered”** | Atlassian received a different callback URL than the one you added. | In Atlassian, set Callback URL to exactly what the dev server prints: `https://YOUR_NGROK_URL/test/auth` (must be `/test/auth`, not `/dev/auth`). |
| **“scopes have not been added”** | Jira API scopes missing in Atlassian app. | In Atlassian app → Permissions → Jira API, add `read:jira-user`, `read:jira-work`, `write:jira-work`. |
| **ngrok failed** (no token) | `NGROK_AUTHTOKEN` not set. | Add it to `.env` from [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken). Or run ngrok manually: `ngrok http 3000`, then `NGROK_URL=https://xxx.ngrok-free.app npm run dev`. |
| **rimraf: command not found** (Lambda) | Dependencies not installed in `functions`. | Run `cd apps/jira/functions && npm install`. |
| **Frontend on wrong port** | Vite was using default 3000. | Use `PORT=1234 npm run dev` so the app is on 1234 and Lambda on 3000. |

---

## Repo layout

- **`jira-app/`** – Contentful UI (Vite + React). Runs in Contentful; talks to Jira REST API and to the Lambda for OAuth.
- **`functions/`** – Lambda (serverless): OAuth callback and token exchange, `connect.json` for the Jira companion app. Run locally with serverless-offline.
- **`scripts/dev.js`** – Starts ngrok (if `NGROK_AUTHTOKEN` set), patches serverless.yml for serverless-offline, runs Lambda + app.
- **`scripts/setup.js`** – Interactive setup: checks deps and `.env`, prints Atlassian checklist, optionally starts dev.

---

## Maintenance notes

- **Runtime:** Local and production use `nodejs22.x`; serverless-offline 13.x supports it.
- **Callback URL:** Always use `/test/auth` (not `/dev/auth`) in serverless config for the test stage; serverless-offline mounts routes under the stage name.
- **OAuth credentials:** Stored in `.env` (gitignored). For production, the app uses AWS Secrets Manager; the deploy pipeline and roles are outside this repo.
