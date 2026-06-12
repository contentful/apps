# Experience Toolbar example

A minimal starter for an app that renders in the **Experience Editor toolbar** —
the new `experience-toolbar` location introduced in
[`@contentful/app-sdk@4.58.0`](https://www.npmjs.com/package/@contentful/app-sdk).
Toolbar apps run alongside the Experience Orchestration (ExO) editor and use the
`sdk.exo` namespace to read and react to the experience the user is editing.

This example is intentionally small. It demonstrates the core building blocks of
a toolbar app:

- **Location detection** via `sdk.location.is(locations.LOCATION_EXPERIENCE_TOOLBAR)`
- **Context awareness** — reading `sdk.exo.context` to tell whether the user is
  editing an `experience` or a `fragment`
- **UI mode** — reacting to `sdk.exo.onUiModeChanged()` (`form` vs. `visual`)
- **Selection** — subscribing to `sdk.exo.experience.selection.onChange()`
- **Node inspection** — resolving the selected node with
  `sdk.exo.experience.getNode(nodeId)` and reading its properties

It is fully typed with `ExperienceEditorToolbarAppSDK`.

> **Out of scope (by design).** This starter does not mutate the experience.
> Data Assembly, `save()`/`publish()`, and property writes are deliberately left
> out to keep the template focused. See the SDK reference for the full `sdk.exo`
> surface.

## How to use

Execute create-contentful-app with npm, npx or yarn to bootstrap the example:

```bash
# npx
npx create-contentful-app --example experience-toolbar

# npm
npm init contentful-app -- --example experience-toolbar

# Yarn
yarn create contentful-app --example experience-toolbar
```

Install it and run:

```bash
npm install
npm start
# or
yarn
yarn start
```

## Registering the toolbar location

Unlike sidebar or field apps, the toolbar location is **not** assigned per
content type through the configuration screen — there is no `EditorInterface`
target state for it. The app is shown whenever the `experience-toolbar` location
is registered on your app definition.

To create an app definition that includes it, run:

```bash
npm run create-app-definition
```

and select the **App configuration screen** and **Experience toolbar** locations
when prompted, pointing the app at `http://localhost:3000`. (You can also add the
location later with `npm run add-locations`.)

## How it works

`src/App.tsx` routes by location using the standard pattern:

```ts
const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_EXPERIENCE_TOOLBAR]: ExperienceToolbar,
};
```

`src/locations/ExperienceToolbar.tsx` is the toolbar app itself. It mounts once
when the editor opens and stays mounted for the session — selection changes do
**not** remount it, so all live data flows through `on*` subscriptions, each of
which returns an unsubscribe function called on cleanup.

The toolbar can also **drive the canvas**, not just read from it. The "Highlight
on canvas" button calls `sdk.exo.experience.selection.highlight(nodeId, { flash:
true, scrollIntoView: true })` to flash and scroll to the selected component —
the outbound counterpart to the `selection.onChange` subscription the panel reads
from. Canvas affordances like highlighting are no-ops in `form` mode, so the
button is disabled there and enabled only in `visual` mode.

## A note on verification

This example is built against the published `@contentful/app-sdk@4.58.0` types,
which are the contract for the toolbar location. At the time of writing, the host
renderer that serves `sdk.exo` at runtime is still rolling out, so the example is
**type-verified and unit-tested against a mocked SDK**, but not yet verified
end-to-end inside a live ExO editor. The API shapes used here match the published
types exactly.

## Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the app in development mode. Open it in the Experience Editor toolbar to use
it. The page reloads on edits, and lint errors appear in the console.

#### `npm run build`

Builds the app for production to the `build` folder. The build is minified and
ready to be deployed.

#### `npm run upload`

Uploads the build folder to Contentful and creates an automatically activated
bundle. The command guides you through the deployment process.

#### `npm run upload-ci`

Like `npm run upload`, but reads all required arguments from environment
variables (for CI pipelines):

- `CONTENTFUL_ORG_ID`
- `CONTENTFUL_APP_DEF_ID`
- `CONTENTFUL_ACCESS_TOKEN`

## Libraries to use

To make your app look and feel like Contentful, use:

- [Forma 36](https://f36.contentful.com/) – Contentful's design system
- [App SDK](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/) – the `sdk.exo` reference

## Learn More

[Read more](https://www.contentful.com/developers/docs/extensibility/app-framework/create-contentful-app/)
about the Create Contentful App CLI.
