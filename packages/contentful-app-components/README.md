# contentful-app-components

Shared React components and hooks for Contentful Apps built with the App Framework.

This is a **source-only** package. It has no build step and no dependencies of its own.
Consuming apps import the TypeScript source files directly via a Vite alias, and all
dependencies are resolved from the consuming app's `node_modules`.

## Exports

| Export                      | Type      | Description                                                                    |
| --------------------------- | --------- | ------------------------------------------------------------------------------ |
| `Splitter`                  | Component | Horizontal rule styled with Forma 36 tokens                                    |
| `ContentTypeMultiSelect`    | Component | Multi-select dropdown for choosing content types, with search and pill display |
| `useContentTypes`           | Hook      | Fetches content types via the CMA (all or by ID list)                          |
| `useInstallationParameters` | Hook      | Reads and refreshes app installation parameters from the CMA                   |

---

### Components

#### `Splitter`

Horizontal divider (renders as `<hr>`) styled with Forma 36 tokens. Use it to separate sections in config screens, sidebars, or dialogs.

**Props** (extends Forma 36 `CommonProps`, `MarginProps`, `PaddingProps`):

| Prop        | Type               | Default | Description                           |
| ----------- | ------------------ | ------- | ------------------------------------- |
| `className` | `string`           | —       | Additional CSS class                  |
| `margin*`   | F36 spacing tokens | —       | e.g. `marginTop`, `marginBottom`      |
| `padding*`  | F36 spacing tokens | —       | e.g. `paddingTop`, `paddingBottom`    |
| …           | —                  | —       | Any other valid `Box` (as `hr`) props |

**Example**

```tsx
import { Splitter } from 'contentful-app-components';

<Box>
  <Subheading>Section one</Subheading>
  <Splitter marginTop="spacingS" marginBottom="spacingM" />
  <Subheading>Section two</Subheading>
</Box>;
```

---

#### `ContentTypeMultiSelect`

Multi-select dropdown that loads content types from the CMA, supports search, and shows selected items as removable pills. Renders a skeleton while loading. Ideal for config screens where users choose which content types an app applies to.

**Props**

| Prop                         | Type                      | Default | Description                                                                 |
| ---------------------------- | ------------------------- | ------- | --------------------------------------------------------------------------- |
| `selectedContentTypesIds`    | `string[]`                | —       | **Required.** Currently selected content type IDs.                          |
| `setSelectedContentTypesIds` | `(ids: string[]) => void` | —       | **Required.** Called when the user changes the selection.                   |
| `availableContentTypesIds`   | `string[]`                | —       | If provided, only these content types are shown; otherwise all are fetched. |
| `maxSelected`                | `number`                  | —       | Max number of content types the user can select.                            |
| `disablePills`               | `boolean`                 | `false` | If `true`, selected items are not shown as pills below the dropdown.        |

**Example**

```tsx
import { useState } from 'react';
import { ContentTypeMultiSelect } from 'contentful-app-components';

function ConfigScreen() {
  const [selectedContentTypesIds, setSelectedContentTypesIds] = useState<string[]>([]);

  return (
    <>
      <Subheading>Assign content types</Subheading>
      <ContentTypeMultiSelect
        selectedContentTypesIds={selectedContentTypesIds}
        setSelectedContentTypesIds={setSelectedContentTypesIds}
        maxSelected={5}
      />
    </>
  );
}
```

To limit the list to specific content types:

```tsx
<ContentTypeMultiSelect
  availableContentTypesIds={['page', 'article', 'landingPage']}
  selectedContentTypesIds={selectedContentTypesIds}
  setSelectedContentTypesIds={setSelectedContentTypesIds}
/>
```

---

### Custom hooks

#### `useContentTypes`

Fetches content types from the CMA. Uses `useSDK()` from `@contentful/react-apps-toolkit`, so it must run inside an App Framework context (e.g. Config Screen, Page, Sidebar).

**Parameters**

| Parameter        | Type       | Description                                                                     |
| ---------------- | ---------- | ------------------------------------------------------------------------------- |
| `contentTypeIds` | `string[]` | Optional. If provided, fetches only these content types; otherwise fetches all. |

**Returns**

| Property       | Type                 | Description                                           |
| -------------- | -------------------- | ----------------------------------------------------- |
| `contentTypes` | `ContentTypeProps[]` | List of content types (from `contentful-management`). |
| `isLoading`    | `boolean`            | `true` while the request is in progress.              |

**Example**

```tsx
import { useContentTypes } from 'contentful-app-components';

function MyConfigSection() {
  const { contentTypes, isLoading } = useContentTypes();

  if (isLoading) return <SkeletonContainer />;

  return (
    <Select>
      {contentTypes.map((ct) => (
        <Option key={ct.sys.id} value={ct.sys.id}>
          {ct.name}
        </Option>
      ))}
    </Select>
  );
}
```

Fetch only specific content types:

```tsx
const { contentTypes, isLoading } = useContentTypes(['page', 'article']);
```

---

#### `useInstallationParameters`

Reads the app’s installation parameters and can refresh them from the CMA. Use it in locations that need current installation config (e.g. Config Screen, Sidebar, Page).

**Parameters**

| Parameter | Type         | Description                                            |
| --------- | ------------ | ------------------------------------------------------ |
| `sdk`     | `BaseAppSDK` | **Required.** App SDK instance (e.g. from `useSDK()`). |

**Returns**

| Property                        | Type                  | Description                                                                  |
| ------------------------------- | --------------------- | ---------------------------------------------------------------------------- |
| `parameters`                    | `KeyValueMap`         | Current installation parameters (from `sdk.parameters.installation` or CMA). |
| `refetchInstallationParameters` | `() => Promise<void>` | Refreshes parameters from the CMA and updates `parameters`.                  |

**Example**

```tsx
import { useSDK } from '@contentful/react-apps-toolkit';
import { useInstallationParameters } from 'contentful-app-components';

function ConfigScreen() {
  const sdk = useSDK();
  const { parameters, refetchInstallationParameters } = useInstallationParameters(sdk);

  const apiKey = parameters.apiKey as string | undefined;

  const handleSave = async () => {
    // After saving installation parameters in your app, refresh local state:
    await refetchInstallationParameters();
  };

  return (
    <Form>
      <TextInput value={apiKey ?? ''} … />
      <Button onClick={handleSave}>Save</Button>
    </Form>
  );
}
```

---

## Required dependencies

The consuming app must have the following packages installed. These are the libraries
imported by the shared source files -- since this package has no `node_modules`, they
are resolved from the app at build time.

| Package                          | Minimum version | Used by                                                |
| -------------------------------- | --------------- | ------------------------------------------------------ |
| `react`                          | `^18.0.0`       | All components and hooks                               |
| `react-dom`                      | `^18.0.0`       | Peer of React                                          |
| `@contentful/f36-components`     | `^5.1.0`        | `Splitter`, `ContentTypeMultiSelect`                   |
| `@contentful/f36-tokens`         | `^5.0.0`        | `Splitter`                                             |
| `@contentful/app-sdk`            | `^4.20.0`       | `useInstallationParameters` (`BaseAppSDK` type)        |
| `@contentful/react-apps-toolkit` | `^1.2.16`       | `useContentTypes` (`useSDK` hook)                      |
| `@emotion/css`                   | `^11.0.0`       | `Splitter` (`css`, `cx`)                               |
| `contentful-management`          | `^11.0.0`       | `useContentTypes`, `useInstallationParameters` (types) |

### Forma 36 v5.1+

`ContentTypeMultiSelect` imports `Multiselect` from `@contentful/f36-components`, which
was added in v5.1.0. Apps on Forma 36 v4 must upgrade before using this component.

### `@types/react`

`@types/react` must be **18.3.0 or later**. Earlier 18.x type definitions have a
`ReactNode` incompatibility with Forma 36 components that causes build errors.

### Emotion

The `Splitter` component uses `css` and `cx` from `@emotion/css`. Consuming apps must
install `@emotion/css@10.0.27` (emotion 10). v11 is not required.

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

## Adding a new app as consumer

To use this package from a new app:

1. Add the Vite alias and `resolveSharedDeps()` plugin to the app's Vite config.
2. Add the TypeScript `paths` mapping to the app's `tsconfig.json`.
3. Ensure all required dependencies listed above are installed in the app.
