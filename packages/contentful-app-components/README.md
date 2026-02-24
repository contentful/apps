# contentful-app-components

Shared React components and hooks for Contentful Apps built with the App Framework.

This is a **source-only** package. It has no build step and no dependencies of its own.
Consuming apps import the TypeScript source files directly via a Vite alias, and all
dependencies are resolved from the consuming app's `node_modules`.

## Exports

| Export | Type | Description |
| --- | --- | --- |
| `Splitter` | Component | Horizontal rule styled with Forma 36 tokens |
| `ContentTypeMultiSelect` | Component | Multi-select dropdown for choosing content types, with search and pill display |
| `useContentTypes` | Hook | Fetches content types via the CMA (all or by ID list) |
| `useInstallationParameters` | Hook | Reads and refreshes app installation parameters from the CMA |

## Required dependencies

The consuming app must have the following packages installed. These are the libraries
imported by the shared source files -- since this package has no `node_modules`, they
are resolved from the app at build time.

| Package | Minimum version | Used by |
| --- | --- | --- |
| `react` | `^18.0.0` | All components and hooks |
| `react-dom` | `^18.0.0` | Peer of React |
| `@contentful/f36-components` | `^5.1.0` | `Splitter`, `ContentTypeMultiSelect` |
| `@contentful/f36-tokens` | `^5.0.0` | `Splitter` |
| `@contentful/app-sdk` | `^4.20.0` | `useInstallationParameters` (`BaseAppSDK` type) |
| `@contentful/react-apps-toolkit` | `^1.2.16` | `useContentTypes` (`useSDK` hook) |
| `@emotion/css` | `^11.0.0` | `Splitter` (`css`, `cx`) |
| `contentful-management` | `^11.0.0` | `useContentTypes`, `useInstallationParameters` (types) |

### Forma 36 v5.1+

`ContentTypeMultiSelect` imports `Multiselect` from `@contentful/f36-components`, which
was added in v5.1.0. Apps on Forma 36 v4 must upgrade before using this component.

### `@types/react`

`@types/react` must be **18.3.0 or later**. Earlier 18.x type definitions have a
`ReactNode` incompatibility with Forma 36 components that causes build errors.

### Emotion

The `Splitter` component uses `css` and `cx` from `@emotion/css` v11. The deprecated
`emotion` v10 package is not compatible.

## How it works

### Vite alias

Each consuming app maps the `contentful-app-components` import to the source entry point
in its `vite.config`:

```typescript
resolve: {
  alias: {
    'contentful-app-components': fileURLToPath(
      new URL('../../packages/contentful-app-components/index.ts', import.meta.url)
    ),
  },
},
```

### Dependency resolution plugin

Because the source files live outside the app's directory tree, Vite cannot resolve their
bare module imports (`react`, `@contentful/f36-components`, etc.) through the standard
Node algorithm. A small Vite plugin redirects those resolutions to the consuming app's
`node_modules`:

```typescript
function resolveSharedDeps(): Plugin {
  return {
    name: 'resolve-shared-deps',
    async resolveId(source, importer, options) {
      if (
        importer?.includes('packages/contentful-app-components/') &&
        !source.startsWith('.') &&
        !source.startsWith('/')
      ) {
        return this.resolve(source, localImporter, { ...options, skipSelf: true });
      }
    },
  };
}
```

### TypeScript paths

Each consuming app adds a `paths` mapping in its `tsconfig.json` so the IDE can resolve
types:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "contentful-app-components": ["../../packages/contentful-app-components/index.ts"]
    }
  }
}
```

## Tests

Tests for this package live in a separate project at
`packages/contentful-app-components-tests/`. That project has its own `package.json` with
the necessary test dependencies and uses the same Vite alias + plugin setup to import
the shared source files.

```bash
cd packages/contentful-app-components-tests
npm install
npm run test:ci
```

## Usage assumptions

- **SDK context required**: `useContentTypes` calls `useSDK()` internally, so the
  consuming app must render an `SDKProvider` ancestor (from `@contentful/react-apps-toolkit`)
  before using this hook or the `ContentTypeMultiSelect` component.

- **CMA access**: Both `useContentTypes` and `useInstallationParameters` make CMA calls
  (`contentType.get`, `contentType.getMany`, `appInstallation.getForOrganization`). The
  SDK instance must have the necessary permissions.

- **No build step**: Source files are consumed directly. Changes to the shared code are
  picked up immediately by the consuming app on the next Vite build or HMR refresh.

## Adding a new app as consumer

To use this package from a new app:

1. Add the Vite alias and `resolveSharedDeps()` plugin to the app's Vite config.
2. Add the TypeScript `paths` mapping to the app's `tsconfig.json`.
3. Ensure all required dependencies listed above are installed in the app.
