# Vite as the Standard App Build Tool

## Status

Accepted

## Context

Apps in this monorepo were originally built with Create React App (`react-scripts`). The 2021
commits that established the pattern say so directly — brandfolder, bynder and cloudinary were each
"built with react-scripts" (`f2e379f4e` PR #287, `f9abdd31a` PR #288, `59e4979b1` PR #289).

CRA became a poor fit for this repository specifically:

- **Build times scale badly across many packages.** This repo holds dozens of independently built
  apps, and CI builds every app affected by a change. Webpack-based CRA builds dominated that cost.
- **CRA's configuration is closed.** Adjusting the build requires ejecting or patching, which is
  unattractive across dozens of apps that should stay near-identical.
- **CRA 5 stopped tracking modern Node.** It relies on hashing that fails on Node 17+, so builds
  need `--openssl-legacy-provider` to run at all. CI here runs Node 22 (`cimg/node:22.15`).
- **Test runner coupling.** CRA bundles its own Jest setup, so build tooling and test tooling could
  not be changed independently.

A single repo-wide migration was not practical: each app is separately versioned and released, has
its own owners, and carries its own release risk. Converting all of them in one change would have
produced an enormous, untestable diff touching every app at once.

## Decision

Vite (with Vitest for tests) is the standard build tool for apps in this repository, adopted
**incrementally, one app per change** rather than as a single repo-wide migration.

The pattern entered the repo as a reference example: `397fb32bd` (PR #1455, 2022-07-08) added
`examples/vite-react/` — a complete Vite + Vitest app covering every App Framework location, with
colocated `*.spec.tsx` files.

Adoption then proceeded in two phases:

1. **New apps default to Vite.** From 2023 onward apps were created on Vite directly — for example
   `19eb66c07` (PR #4354) "Initialize AI Image Generator with Vite", plus `cddb1b4b8` and
   `e641ab4ab` (PR #5260).
2. **Existing CRA apps convert opportunistically**, usually bundled with other maintenance in the
   same app: `1fbe4a5e4` (PR #8968, Smartling), `9bffbbdc6` (PR #9048, mux), `bc9389d94`
   (PR #9077, Optimizely).

No flag day, no freeze, no coordinated cutover.

## Consequences

**What this enables**

- Each conversion is reviewable and revertable in isolation, by the people who own that app.
- Faster local and CI builds for every app that has converted, and Vitest can be upgraded
  independently of the bundler.
- New apps get the modern toolchain by default, so the CRA population only ever shrinks.

**Trade-offs accepted**

- **Two toolchains coexist indefinitely.** There is no deadline forcing the tail to convert, so it
  persists. As of this ADR: **54 apps have a Vite config, 2 still depend on `react-scripts`** —
  `apps/commercetools-without-search` and `apps/google-analytics`, both pinned to `react-scripts@5.0.1`.
- **The holdouts carry a build workaround.** Both build via
  `react-scripts --openssl-legacy-provider build`. That flag exists solely to keep CRA 5 working on
  modern Node, and it is a standing reminder that these two apps are on unmaintained tooling.
- **Contributors must check per app which toolchain they are in.** Commands, config file names and
  environment-variable prefixes (`VITE_*`) differ, so instructions cannot be given repo-wide.
- **Test coverage is uneven at the boundary.** Neither remaining CRA app declares a `test` script,
  so neither participates in the repo's Vitest-based `test:ci` run.

**Follow-up work created**

- Convert `apps/commercetools-without-search` and `apps/google-analytics`, which would remove the
  last `--openssl-legacy-provider` usage and the last `react-scripts` dependency from the repo.
- Once those land, drop CRA from contributor documentation so there is one described way to build
  an app.
