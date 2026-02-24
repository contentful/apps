# contentful-app-components

Shared React components and hooks for Contentful Apps built with the App Framework.

## Exports

| Export | Type | Description |
| --- | --- | --- |
| `Splitter` | Component | Horizontal rule styled with Forma 36 tokens |
| `ContentTypeMultiSelect` | Component | Multi-select dropdown for choosing content types, with search and pill display |
| `useContentTypes` | Hook | Fetches content types via the CMA (all or by ID list) |
| `useInstallationParameters` | Hook | Reads and refreshes app installation parameters from the CMA |

## Requirements

### Peer dependencies

All peer dependencies must be installed by the consuming app:

| Package | Required version | Notes |
| --- | --- | --- |
| `react` | `^18.0.0 \|\| ^19.0.0` | `@types/react` >= 18.3.0 required (see below) |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` | |
| `@contentful/f36-components` | **`^5.1.0`** | Forma 36 **v5.1+** only; v4 is not supported (see below) |
| `@contentful/f36-tokens` | `^5.1.0` | |
| `@contentful/app-sdk` | `^4.20.0` | 4.20.0 introduced `BaseAppSDK.cma`, used by the hooks |
| `@contentful/react-apps-toolkit` | `^1.2.16` | |
| `@emotion/css` | `^11.0.0` | The legacy `emotion` v10 package is **not** supported |
| `contentful-management` | `^11.0.0` | Types (`ContentTypeProps`, `KeyValueMap`, etc.) are used in the public API |

### Forma 36 v5.1+

This package requires Forma 36 v5.1 or later. The `ContentTypeMultiSelect` component imports
`@contentful/f36-multiselect`, which was added to `@contentful/f36-components` in v5.1.0.
Apps still on Forma 36 v4 must upgrade before using this package.

### TypeScript and `@types/react`

The package is compiled with TypeScript ~5.1. Consuming apps should use TypeScript **5.1 or
later** to avoid issues parsing the emitted declaration files.

`@types/react` must be **18.3.0 or later**. Earlier 18.x type definitions have a `ReactNode`
incompatibility with Forma 36 components that causes "cannot be used as a JSX component" build
errors.

### Emotion

The `Splitter` component uses `css` and `cx` from `@emotion/css` v11. The deprecated `emotion`
v10 package is not compatible. If your app still uses `emotion` v10 for its own code, both
packages can coexist — they are independent npm packages with separate style caches.

## Build

The package entry point is `lib/index.js` (compiled output). The `lib/` directory is **not
committed to version control**, so you must build the package before consuming apps can resolve
their imports:

```bash
cd packages/contentful-app-components
npm install
npm run build
```

After modifying source files, re-run `npm run build` to update `lib/`.

## Dependency version policy

The `devDependencies` are intentionally pinned to the **minimum supported versions** of each
peer dependency (where possible) so that the build and test suite verify compatibility with the
oldest version a consuming app is allowed to use. Notable exceptions:

- **`react` / `react-dom`**: pinned to `18.3.1` (not 18.0.0) because React requires a single
  runtime instance in a monorepo, and all consuming apps currently use 18.3.1. Testing against
  18.0.0 would cause "multiple copies of React" errors due to workspace hoisting.
- **`@types/react`**: pinned to `18.3.0` — the earliest version compatible with Forma 36 v5
  type declarations.

When adding a new peer dependency or raising a floor version, update the corresponding
`devDependency` to match the new floor and verify that both `npm run build` and
`npm run test:ci` pass.

## Usage assumptions

- **SDK context required**: `useContentTypes` calls `useSDK()` internally, so the consuming app
  must render an `SDKProvider` ancestor (from `@contentful/react-apps-toolkit`) before using this
  hook or the `ContentTypeMultiSelect` component.

- **CMA access**: Both `useContentTypes` and `useInstallationParameters` make CMA calls
  (`contentType.get`, `contentType.getMany`, `appInstallation.getForOrganization`). The SDK
  instance must have the necessary permissions.

- **Monorepo consumption**: Apps in this repository reference the package via
  `"contentful-app-components": "file:../../packages/contentful-app-components"`. Ensure the
  package is built before running or building the consuming app.
