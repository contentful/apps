# Contributing to contentful/apps

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 16.0.0 (CI runs on **22**) |
| npm | ≥ 8.0.0 |

Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to manage Node versions. The CI image is `cimg/node:22.15`.

---

## Initial Setup

```bash
# Clone the repo
git clone https://github.com/contentful/apps.git
cd apps

# Install root dependencies
npm ci

# Bootstrap the specific app(s) you want to work on
# (links cross-package deps, installs app node_modules)
SINCE=master npm run bootstrap
```

> **Why `SINCE=master`?** Lerna uses `--since` to only operate on packages changed relative to a base ref. Setting `SINCE=master` bootstraps all packages that differ from master, plus their dependencies. On a fresh clone this typically covers everything you need.

To bootstrap a single app unconditionally:
```bash
cd apps/<app-name>
npm install
```

---

## Running an App Locally

```bash
cd apps/<app-name>

# Start the dev server (also creates/updates the App Definition in Contentful)
npm start
# or
npm run dev
```

This runs Vite in watch mode and opens the app at `http://localhost:3000`. The app must be configured in a Contentful organization — use a personal dev space.

For apps with App Actions (`mux`, `vercel`, `microsoft-teams`, `sap-commerce-cloud`):
```bash
# Terminal 1 — frontend
cd apps/<app-name>/frontend && npm start

# Terminal 2 — app actions (if applicable)
cd apps/<app-name> && npm run start:functions
```

For legacy lambda apps (`netlify`, `typeform`, `slack`, etc.):
```bash
cd apps/<app-name>/frontend && npm start
# Lambda runs in AWS — local dev typically uses the deployed staging lambda
```

---

## Running Tests

```bash
# All changed apps (from repo root)
npm test

# Single app
cd apps/<app-name>
npm run test        # watch mode
npm run test:ci     # single run (used in CI)
```

Tests use **Vitest** + **React Testing Library**. Test files live alongside source (`*.spec.tsx`) or in a `test/` directory.

---

## Building

```bash
# All changed apps (from repo root)
npm run build

# Single app
cd apps/<app-name>
npm run build
```

Output goes to `apps/<app-name>/build/` or `apps/<app-name>/dist/`.

---

## Linting & Formatting

```bash
# Lint changed apps (from root)
npm run lint

# Prettier check
npm run prettier:check

# Prettier fix
npm run prettier:write '**/*.{js,jsx,ts,tsx}'
```

Prettier runs automatically on staged files via `lint-staged` (triggered by the `husky` pre-commit hook). Don't skip it.

---

## Code Conventions

- **TypeScript + React + Vite + Vitest + Forma 36** in all apps.
- **`useSDK()`** from `@contentful/react-apps-toolkit` — never access `window.contentfulExtension` directly.
- **`useAutoResizer()`** in Field, Sidebar, EntryEditor, and Dialog locations.
- **`sdk.app.setReady()`** after async initialization in ConfigScreen.
- **Forma 36 components only** — no plain HTML divs for layout, no ad-hoc CSS. Use F36 tokens for spacing/color.
- **No `any`** in TypeScript — use explicit types or `unknown`.
- **Conventional Commits** for all commit messages (`feat:`, `fix:`, `chore:`, `docs:`, etc.).
- **Atomic commits** — one logical change per commit.

---

## Adding a New App

1. Use `create-contentful-app` to scaffold:
   ```bash
   npx create-contentful-app@latest my-new-app
   mv my-new-app apps/
   ```
2. Ensure `package.json` has a `name`, `build`, `test:ci`, `lint`, and `deploy` script.
3. Add an `AGENTS.md` to the app root (see any existing app for the template).
4. Bootstrap from root: `SINCE=master npm run bootstrap`

---

## Deploying

Deployments are managed by CircleCI. Manual deploys:

```bash
cd apps/<app-name>

# Deploy to production
npm run deploy

# Deploy to test/staging
npm run deploy:test
```

Requires valid Contentful credentials and the correct organization context (`CONTENTFUL_ORG_ID`, `CONTENTFUL_APP_DEF_ID`).

> Never deploy from a feature branch to production. Use the CI pipeline.

---

## Branching & PR Strategy

- **Base branch**: `master`
- **Staging**: `staging` branch deploys to the staging environment
- **Feature branches**: `<type>/<description>` (e.g. `feat/bulk-edit-locale-filter`)
- PRs require review from a code owner before merge
- CI must pass (lint, test, build) before merge
- Use **Conventional Commits** in PR titles — this drives semantic versioning for packages

---

## Releasing Packages

Packages under `packages/` (e.g. `dam-app-base`, `ecommerce-app-base`) are published to the GitHub npm registry. Releases are automated via:

```bash
npm run publish-packages
```

This runs `lerna version --conventional-commits` (bumps versions based on commit history) then `lerna publish from-git` (publishes to `https://npm.pkg.github.com/`). Only run from CI with the correct `GITHUB_PACKAGES_WRITE_TOKEN`.

---

## Troubleshooting

**`lerna bootstrap` fails on a specific app**
Run `npm install` directly in that app's directory to see the raw npm error.

**App doesn't load in Contentful**
Ensure `npm start` is running and the App Definition's frontend URL points to `http://localhost:3000`.

**Type errors after pulling**
Re-run bootstrap — a dependency may have been added: `SINCE=master npm run bootstrap`

**Prettier pre-commit hook fails**
Run `npm run prettier:write '**/*.{js,jsx,ts,tsx}'` and re-stage.

**`bedrock-content-generator` build fails**
This app uses LavaMoat. After bootstrap, run `cd apps/bedrock-content-generator && npm run allow-scripts`.
