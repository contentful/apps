# Agent Guide — mux

## What This App Does
Integrates Mux (video hosting and streaming platform) with Contentful. Lets editors upload videos to Mux directly from Contentful and embed Mux playback in entries. Published as `@contentful/mux-app`.

## Archetype
**App Actions + Frontend** app with an additional `functions/` directory for serverless logic.

## Structure

```
apps/mux/
├── frontend/                  # React app
│   └── src/                   # Standard Vite app structure with locations/
├── app-actions/               # App Action handlers (video processing events)
├── functions/                 # Additional serverless functions (check serverless.yml)
├── contentful-app-manifest.json
├── build-actions.js
└── package.json
```

## Sharp Edges & Invariants

- **Video upload flow**: Mux uses a direct upload URL pattern — the App Action creates a Mux upload URL, the frontend uploads the video directly to Mux's servers (not through Contentful), and App Actions listen for Mux's webhook to update the asset status.
- **Mux webhooks**: App Actions process Mux's `video.asset.ready` and `video.asset.errored` webhooks. If webhook processing is broken, uploaded videos will be stuck in a "processing" state.
- **Mux API credentials** (token ID + secret) are in installation parameters — never log them.
- **`functions/`**: check the `serverless.yml` in this directory — it may define Lambda functions for webhook handling in addition to (or instead of) App Actions.
- `contentful-app-manifest.json` defines the App Action event signatures — update it when adding new App Actions.
- **Asset stored as JSON**: Mux asset data (playback ID, asset ID, status) is stored as a JSON object in a Contentful JSON field — the schema is defined in the frontend's type definitions.

## Never / Always

- **Never** make Mux API calls from the frontend — use App Actions for all Mux API interactions.
- **Never** store raw Mux API credentials in entry fields.
- **Always** handle the `video.asset.errored` webhook — surface upload failures to the user.
