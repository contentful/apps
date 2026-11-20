# Agent Guide — netlify

## What This App Does
Connects Contentful spaces to Netlify sites. Shows build status in the Entry Sidebar and lets editors trigger Netlify builds directly from Contentful. Published as `@contentful/netlify-build-and-preview`.

## Archetype
**Frontend + Contentful Functions** app.

## Structure

```
apps/netlify/
├── src/                          # React app (standard Vite app with locations/)
├── functions/                    # Contentful Functions, bundled into build/functions
│   ├── appEventHandler.js        # App event handler: fires build hooks on Entry/Asset publish/unpublish
│   └── lib/build-hook.js         # Shared logic (hook lookup and filtering, Netlify call)
├── contentful-app-manifest.json  # Declares the functions and the `netlifyBuild` action
└── images/                       # Logo assets
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Current Forma 36 |
| `@contentful/f36-icons` | Icons |
| `@contentful/f36-tokens` | Design tokens |
| `date-fns` | Date formatting for build timestamps |
| `@contentful/app-scripts` | Builds the functions (`build-functions`) and uploads the bundle |

## Sharp Edges & Invariants

- **Contentful Functions.** Installation parameters arrive in `context.appInstallationParameters`; there is no signature verification, token exchange or CMA call to maintain.
- **Functions only reach `api.netlify.com`** — it is the only entry in `allowNetworks` in `contentful-app-manifest.json`. Add hosts there before calling anything else.
- **Build hook IDs** live in installation parameters (`buildHookIds`, `siteNames`, `events`). `siteNames` and `buildHookIds` are comma-separated and ordered the same way.
- **`npm run build` builds both** the frontend (`vite build`) and the functions (`build-functions --ci`). `--ci` is required, otherwise the CLI prompts interactively.

## Never / Always

- **Never** log build hook IDs or URLs.
- **Always** throw an `Error` from a function when it cannot do its job; the platform reports it as a failed invocation.
- **Always** keep `functions/lib/build-hook.spec.js` and `functions/handlers.spec.js` in sync with behavior changes.
