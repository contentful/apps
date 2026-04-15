# Contentful Link Checker

A [Contentful app](https://www.contentful.com/developers/docs/extensibility/app-framework/) that runs in the **entry sidebar**. It extracts URLs from the current entry’s Symbol and Text fields, checks each URL (via a server-side App Function), and shows which links are valid or broken.

## What this app does

- **URL extraction**: Reads `sdk.entry.fields` and, for each **Symbol** and **Text** field, gets the value per locale and extracts URLs with a standard URL regex. `www.` links are normalized to `https://...` before checking so they are handled as external web URLs rather than relative paths.
- **Link checking**: Runs **only** via a Contentful **App Function** (Premium/Partners), invoked as an **App Action**. There is no CORS proxy and no browser `fetch` fallback—checking is server-side only to avoid CORS and to comply with static-app hosting.
- **Allow List**: Optional installation parameter **“Allow list”** (comma-separated hostnames). When configured, any resolved URL whose hostname does not exactly match or fall under one of those hostnames is flagged as invalid before Link Checker makes a request.
- **Deny List**: Optional installation parameter **“Deny list”** (comma-separated hostnames). Any extracted URL whose hostname exactly matches or falls under one of these is marked invalid / on the deny list (no HTTP check).
- **UI**: “Check links” button, progress, and a results list (invalid/broken links; optional “show all”). Results distinguish between allow-list failures, deny-list failures, and HTTP/network issues. If the App Action is not available, the sidebar shows a message and disables link checking.

## Design (no hosting, static only)

- **No hosting**: No backend or API route in the app bundle. The UI is static and runs in the browser.
- **Static site**: The app is client-side only (no custom backend). The Vite-built bundle is uploaded and hosted by Contentful.
- **Server-side when needed**: Checking arbitrary URLs uses an **App Function** invoked via an **App Action**. The function runs on Contentful’s infrastructure; the app bundle stays static.

## Requirements

- **Link checking**: Requires a space on a **Premium/Partners** plan with an **App Action** that invokes the “Check Link” function. If the action is missing or the plan doesn’t support it, the sidebar shows a message and does not run checks.
- **Function egress policy**: The manifest currently allows outbound checks to a broad set of public web hostnames via wildcard TLD entries such as `*.com`, `*.org`, and `*.io`. Before shipping a manifest change, smoke-test the function against at least one non-Contentful host such as `https://example.com`.

## Available Scripts

In the project directory, you can run:

#### `npm run dev`

Runs the app in development mode. Open your app to view it in the browser. The page will reload if you make edits.

#### `npm run build`

Builds the app for production to the `build` folder.

#### `npm run build:all`

Builds the static app and the App Function into `build/`. Use this before uploading so the bundle includes the Check Link function.

#### `npm run upsert-actions`

Creates or updates App Actions from `contentful-app-manifest.json` (see [Upsert App Actions](https://github.com/contentful/create-contentful-app/blob/main/packages/contentful--app-scripts/README.md#upsert-app-actions)). Run after uploading so the “Check Link” action exists; the sidebar discovers it by the function id `checkLink`.

## Libraries

To make your app look and feel like Contentful:

- [Forma 36](https://f36.contentful.com/) – Contentful's design system
- [Contentful Field Editors](https://www.contentful.com/developers/docs/extensibility/field-editors/) – Contentful's field editor React components
- [React Apps Toolkit](https://www.contentful.com/developers/docs/extensibility/app-framework/react-apps-toolkit/) – Library to simplify building Contentful apps with React

## Pushing to Contentful for testing

To build and upload the app so Contentful hosts it (and you can test it in a space):

### 1. One-time setup

- **Create an app definition** (if you haven’t already):
  ```bash
  npm run create-app-definition
  ```
  Follow the prompts and sign in with Contentful. This creates the app in your organization and can store org/app IDs for later commands.

- **Add the app to the entry sidebar** (so it appears when editing entries):
  ```bash
  npm run add-locations
  ```
  When prompted, add the **entry-sidebar** location so the Link Checker shows in the sidebar.

### 2. Build and upload

Link checking runs **only** via the server-side App Function (Premium/Partners). The upload bundle must include both the static app and the built function.

- **Build everything** (static app and function in `./build`):
  ```bash
  npm run build:all
  ```
  This runs `npm run build`, then `npm run build:functions`, so the upload bundle includes the `build/functions/` output.

- **Upload** the build to Contentful (creates a new app bundle and activates it):
  ```bash
  npm run upload
  ```
  When prompted, choose your organization and app definition. You’ll need a [Contentful personal access token](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/personal-access-tokens) (create one under your profile → API keys).

  For CI or scripting you can pass options directly:
  ```bash
  npx contentful-app-scripts upload --ci \
    --bundle-dir ./build \
    --organization-id YOUR_ORG_ID \
    --definition-id YOUR_APP_DEF_ID \
    --token YOUR_CONTENTFUL_ACCESS_TOKEN
  ```

### 3. Create the App Action (required for link checking)

The sidebar only checks links when an **App Action** that invokes the `checkLink` function exists (Premium/Partners). You can create or update that action from the manifest using [Upsert App Actions](https://github.com/contentful/create-contentful-app/blob/main/packages/contentful--app-scripts/README.md#upsert-app-actions):

```bash
npm run upsert-actions
```

When prompted, choose your organization and app definition and provide your [Contentful personal access token](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/personal-access-tokens). The script reads `contentful-app-manifest.json` (which defines a “Check Link” action that invokes the `checkLink` function), creates or updates the action in Contentful, and syncs any assigned action IDs back into the manifest.

For CI or scripting:

```bash
npx contentful-app-scripts upsert-actions --ci \
  --manifest-file contentful-app-manifest.json \
  --organization-id YOUR_ORG_ID \
  --definition-id YOUR_APP_DEF_ID \
  --token YOUR_CONTENTFUL_ACCESS_TOKEN
```

Run this after uploading a bundle (or whenever you want to ensure the App Action exists). If the action is missing, the sidebar shows a message and disables link checking.

### 4. Install in a space

In the Contentful web app: **Organization settings → Apps →** your app → **Install** (or **Install to space**), then pick a space. Open any entry and add the app to the sidebar (or it may appear automatically if you added the entry-sidebar location).

---

## Marketplace submission checklist

This app is intended to meet the **Field Team Guide – Requirements for building and submitting apps**:

| Requirement | Status |
|-------------|--------|
| **Code ownership** | No ongoing ownership expected after submission; Marketplace team maintains. |
| **TypeScript** | Project uses TypeScript (`.ts`/`.tsx`). |
| **Linting** | `npm run lint` performs a TypeScript no-emit validation pass. |
| **Boilerplate** | No placeholder or unnecessary boilerplate; config and sidebar are app-specific. |
| **Tests** | `npm run test` and `npm run test:ci`; tests run without `--passWithNoTests`. |
| **Build and start** | `npm run build`, `npm run start` in `package.json`. |
| **OWASP / security** | No hardcoded secrets; tokens via env/CLI. App Function validates URL input (type, http/https). |
| **NPM updates** | Dependencies kept up to date; `npm audit` addressed (overrides for transitive vulns). |
| **Documentation** | This README describes what the app does, setup, and usage. |
| **Accessibility** | Sidebar and Config use Forma 36; region and labels; `aria-live` for result updates; buttons and controls labeled. |
| **PR / app name** | Submit final version via PR to MPA repo; use app name in PR title; `package.json` name: `contentful-link-checker`. |
| **Secrets** | `.env` and `.env.*` in `.gitignore`; no API keys or tokens committed. |
| **Bundle size** | Build output (`build/`) kept under 10 MB (current build ~1.3 MB). |
| **Static site** | Client-side only; no SSR, no API routes; server-side logic via App Function + App Action. |

---

## Learn more

[Create Contentful App](https://www.contentful.com/developers/docs/extensibility/app-framework/create-contentful-app/) – CLI and app framework docs.
