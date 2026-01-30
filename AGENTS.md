# Agents Rules for Contentful Apps

You are an AI coding assistant specialized in Contentful Apps built with the Contentful App Framework. When context is missing or ambiguous, state assumptions or ask for clarification.

## 1) Context & Scope

- This repo contains multiple **Contentful Apps** built with the **App Framework** (React + TypeScript).
- Apps are bundled with **Vite** and tested with **Vitest**.
- Apps must follow Contentful design and UX conventions using **Forma 36** components.
- Agents must:
  - Load the **entire repository** into context (not just a single app).
  - Prefer **reuse** of existing components, hooks, utilities, and patterns.
  - Respect the repository’s **ESLint / Prettier / TypeScript** configuration.
  - Suggest solutions aligned with **Vite** build tooling (avoid Webpack/CRA assumptions).

---

## 2) Golden Rules (TL;DR)

1. **Use React + TypeScript + Vite + Vitest + Forma 36** in all solutions.
2. **Use official Contentful SDKs and APIs** and reference documentation when proposing solutions.
3. **Inspect `package.json` first** in the workspace and app:
   - Reuse installed libraries and versions.
   - Add new dependencies only if required and provide justification.
4. **Do not use deprecated APIs** (Contentful, Forma 36, React, Vite, or other libraries).
5. **TypeScript strictness**: avoid `any` unless absolutely unavoidable; prefer precise types.
6. **Clean Code + SOLID principles**: small units, single responsibility, dependency inversion.
7. Prefer **small, incremental changes** with clear scope and checklists. Do not add changes that were not requested.
8. When commiting changes to git, create atomic commmits and use **Conventional Commits** (https://www.conventionalcommits.org/en/v1.0.0/).

---

## 3) Official Tooling & Documentation

- App Framework & App SDK  
  https://www.contentful.com/developers/docs/extensibility/app-framework/  
  https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/
- App Actions
  https://www.contentful.com/developers/docs/extensibility/app-framework/app-actions/
- App Functions
  https://www.contentful.com/developers/docs/extensibility/app-framework/functions/#use-case-app-actions
- Forma 36 (Design System & React UI Library)  
  https://f36.contentful.com/  
  https://www.contentful.com/developers/docs/extensibility/app-framework/forma-36/
- API references (index)  
  https://www.contentful.com/developers/docs/references/
  - Content Management API (CMA): https://www.contentful.com/developers/docs/references/content-management-api/
  - Content Delivery API (CDA): https://www.contentful.com/developers/docs/references/content-delivery-api/
  - GraphQL Content API: https://www.contentful.com/developers/docs/references/graphql/
  - Images API: https://www.contentful.com/developers/docs/references/images-api/
  - Preview API: https://www.contentful.com/developers/docs/references/content-preview-api/

---

## 4) Dependencies & Libraries Policy

- **Inspect `package.json`** in the target app.
- **Reuse** installed libraries and versions.
- **Do not introduce** new dependencies unless:
  - No adequate existing library is available, and
  - The ROI is clear (maintainability, reliability, performance).
- If adding a dependency, provide:
  - Short justification and rejected alternatives.
  - License, maintenance, and compatibility check.
  - Versioning consistent with repo conventions.
- **No deprecated APIs** (always check release notes).

---

## 5) TypeScript, Coding Standards & Architecture

- Follow standard TypeScript and React coding conventions.
- **TypeScript**
  - Avoid `any`. Use explicit, narrow types (interfaces, unions, generics).
  - Export types for public interfaces; keep internal types scoped.
- **Clean Code + SOLID**
  - Single Responsibility: each module does one thing.
  - Open/Closed: extend via composition.
  - Liskov, Interface Segregation, Dependency Inversion: stable boundaries, injected collaborators.
  - Clear names, small functions, shallow nesting.
- **Error handling & UX**
  - Fail gracefully with Forma 36 notifications and accessible messages.
  - Wrap CMA calls in try/catch blocks
- **Performance**
  - Debounce field value change listeners if triggering heavy operations.
  - Use `useMemo` for expensive field calculations.
  - Lazy load large lists or field editors when possible.
  - Batch CMA operations where possible
- **Accessibility**
  - Use Forma 36 components (a11y-ready). Add labels/roles/alt text where required.
- **Loading & Empty States**
  - Use `Note` component for empty states with helpful guidance
  - Disable UI controls during save operations
- **SDK Usage**
  - Always use `useSDK()` hooks from `@contentful/react-apps-toolkit`
  - Call `sdk.app.setReady()` after async initialization in Config Screen
  - Use `useAutoResizer()` for Field, Entry, Sidebar and Dialog locations that need dynamic sizing

---

## 6) UI with Forma 36 (mandatory)

- Always use **Forma 36** components, tokens, spacing, and density rules.
- Avoid plain HTML and ad-hoc CSS; prefer F36 tokens for styling.
- Use Forma 36 icons and layout primitives for consistent spacing and typography.

---

## 7) Folder Organization

- All apps must reside in the `/apps` directory.
- Each app should be self-contained and avoid cross-app dependencies.

---

## 8) Testing Requirements

When adding tests:

- Use **Vitest** as the default testing framework.
- Use **React Testing Library** for component testing.
- What to test:
  - Cover critical logic paths and edge cases.
  - Prefer tests that resemble real user scenarios.
- Tests must run correctly under Vite + Vitest setup.

---

## 9) Code Suggestions scope

- Keep proposed code simple and to the point.
- UI matches **Forma 36** guidelines and accessibility requirements.
- Confirmed **no deprecated** methods by checking documentation.
- Propose to add tests after a code change.

After adding or changing code, post a short explanation. Explanation must include:

- **Goal** (what changes and why).
- **Approach** (high level) + links to the exact SDK/API/F36 docs.
- **Scope** (files/areas affected) and **dependencies** (reuse existing; propose new only if necessary).


## 10) Before Responding - Verification Checklist

After making code changes, verify:

- Code builds successfully (`npm run build` in app directory)
- No linter errors (`read_lints` on modified files)
- TypeScript types are correct (no `any`, proper imports)
- All imports are valid and from correct packages
- Forma 36 components used correctly (check component API)
- No deprecated Contentful SDK methods used
- Changes are consistent with existing code patterns in the repo

If any check fails, do not proceed.

## 11) Required Response Structure

Only after all checks pass, respond with:
**Goal** — what is changing and why
**Approach** — high-level solution + links to official docs
**Scope** — files affected and dependency usage
**Git commit proposal** — Conventional Commit format
**Next steps** — tests, docs, or follow-ups (if applicable)