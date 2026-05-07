# Agent Guide — contentful/apps

## Table of Contents

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Repo overview and external links |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Monorepo structure, app archetypes, data flows, build pipeline |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Dev setup, test/build commands, branching, release process |
| `apps/<name>/AGENTS.md` | Per-app sharp edges, locations, and invariants |
| `packages/dam-app-base/` | Shared DAM integration library |
| `packages/ecommerce-app-base/` | Shared ecommerce integration library |

---

## Context & Scope

- This repo contains **56 first-party Contentful Marketplace apps** plus shared libraries.
- Apps are built with **React + TypeScript + Vite + Vitest + Forma 36**.
- When working on a specific app, **read that app's `AGENTS.md` first** — it documents locations, key dependencies, and sharp edges specific to that app.
- Always load the **entire repository** into context, not just a single app — cross-app patterns and shared packages matter.

---

## Golden Rules

1. **Use React + TypeScript + Vite + Vitest + Forma 36** in all new code.
2. **`useSDK()`** from `@contentful/react-apps-toolkit` — never access `window.contentfulExtension` directly.
3. **`useAutoResizer()`** in Field, Sidebar, EntryEditor, and Dialog locations.
4. **`sdk.app.setReady()`** after async initialization in ConfigScreen.
5. **Inspect `package.json` first** — reuse installed libraries; add new dependencies only with justification.
6. **No deprecated APIs** — check Forma 36, App SDK, and contentful-management changelogs.
7. **No `any` in TypeScript** — use explicit, narrow types.
8. **Conventional Commits** for every commit (`feat:`, `fix:`, `chore:`, `docs:`).
9. **Small, incremental changes** — do not add unrequested changes.
10. **Official Contentful SDKs and APIs only** — see documentation links below.

---

## App Archetypes (read before editing any app)

See [ARCHITECTURE.md](ARCHITECTURE.md) for full details. Quick reference:

| Archetype | Marker | Examples |
|-----------|--------|---------|
| Standard Vite | `src/locations/` dir | Most apps |
| App Actions + Frontend | `app-actions/` + `contentful-app-manifest.json` | `mux`, `vercel`, `microsoft-teams`, `sap-commerce-cloud` |
| Legacy Lambda + Frontend | `lambda/` dir | `netlify`, `typeform`, `slack`, `google-analytics-4`, `ai-image-tagging`, `smartling` |
| DAM base | depends on `@contentful/dam-app-base` | `brandfolder`, `dropbox`, `frontify`, `wistia-videos` |
| Ecommerce base | depends on `@contentful/ecommerce-app-base` | `commercetools`, `commercetools-without-search`, `saleor` |

---

## Never Do / Always Do

**Never:**
- Mix Forma 36 v4 (`@contentful/f36-*`) components with legacy Forma 36 (`forma-36-react-components`). The two design systems are not compatible.
- Run `lerna run build` or `lerna run test` without `--since` or `SINCE` set — it will attempt to build/test all 56 apps.
- Deploy from a feature branch to production — always go through CI.
- Commit API keys, `CONTENTFUL_MANAGEMENT_TOKEN`, or org/space IDs.
- Add cross-app `import` dependencies — each app must be self-contained.
- Skip `sdk.app.setReady()` in a ConfigScreen — the app will appear stuck loading.

**Always:**
- Read the target app's `AGENTS.md` before proposing changes.
- Run `npm run build` in the app directory to verify your change compiles.
- Use Forma 36 `Note` component for empty states, `Notification` for user-facing errors.
- Wrap all CMA calls in try/catch and surface errors via Forma 36 notifications.
- Check `apps/<name>/package.json` for the specific versions in use before referencing SDK APIs.

---

## Official Documentation

- App Framework: https://www.contentful.com/developers/docs/extensibility/app-framework/
- App SDK reference: https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/
- App Actions: https://www.contentful.com/developers/docs/extensibility/app-framework/app-actions/
- App Functions: https://www.contentful.com/developers/docs/extensibility/app-framework/functions/
- Forma 36 components: https://f36.contentful.com/
- CMA reference: https://www.contentful.com/developers/docs/references/content-management-api/
- CDA reference: https://www.contentful.com/developers/docs/references/content-delivery-api/
- Images API: https://www.contentful.com/developers/docs/references/images-api/

---

## Required Response Structure

After code changes, always include:

- **Goal** — what is changing and why
- **Approach** — high-level solution + links to official docs used
- **Scope** — files affected and dependency usage
- **Git commit proposal** — Conventional Commit format
- **Next steps** — tests, docs, or follow-ups (if applicable)

Before responding, verify:
- [ ] `npm run build` succeeds in the app directory
- [ ] No linter errors on modified files
- [ ] TypeScript types are correct (no `any`, proper imports)
- [ ] All imports are valid and from correct packages
- [ ] Forma 36 components used correctly
- [ ] No deprecated Contentful SDK methods
- [ ] Changes are consistent with existing patterns in the repo
