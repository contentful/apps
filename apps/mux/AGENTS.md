# Agent Guide — mux

## What This App Does
Integrates Mux (video hosting and streaming platform) with Contentful. Lets editors upload videos to Mux directly from Contentful, run Mux Robots AI workflows against them, and embed Mux playback in entries. Published as `@contentful/mux-app`.

## Archetype
**App Actions + Frontend** app with a `functions/` directory for server-side logic.

## Structure

```
apps/mux/
├── frontend/                  # React app (Vite)
│   └── src/
│       ├── locations/         # config, Sidebar
│       ├── components/        # Robots/, AssetConfiguration/, TrackForm/, ...
│       └── util/              # muxApi, robots*, types
├── functions/                 # Contentful App Functions (its own package + build)
│   └── src/
│       ├── muxProxy.ts        # appaction.call — Mux REST proxy for /video/v1/ and /robots/v0/
│       ├── getSignedUrlTokens.ts  # appaction.call — signs playback JWTs
│       └── onPublish.ts       # appevent.handler — runs queued pendingActions
├── docs/ADRs/
├── contentful-app-manifest.json
└── package.json
```

## Sharp Edges & Invariants

- **No webhooks.** Contentful cannot receive Mux webhooks — no App Function type exposes an HTTP endpoint Mux could call — so *everything* asynchronous is polled from the browser while a tab is open, and reconciled from the Mux API on the next open. Asset ingest, track generation and Robots jobs all work this way. If something looks stuck, the browser tab was closed.
- **One write path for the field value.** `App.updateField(mutator, options)` in `frontend/src/index.tsx` is the only place the entry field is written (bar three deliberate full-resets: `resetField`, pasting an asset ID, and the upload-id handoff). It reads the current value through `sdk.field.getValue()` — never React state — chains concurrent calls, and skips writes that would change nothing. Two poll loops write this value; bypassing it reintroduces a lost-update race. `save` persists the entry at once; `onParked` tells the caller its write is waiting behind the publish gate; `flushOnUnmount: false` drops a still-parked write when the editor closes instead of flushing it — the Robots placeholder uses it, because a closing editor sends no create for it to guard (ADR-0010).
- **Every write marks the entry "Changed".** A `setValue` bumps the entry version, so a poll tick that learns nothing must not write — `updateField` drops those. This is why the field version is derived (`util/muxFieldVersion.ts`) rather than hard-coded. Robots records are the deliberate exception: every job the tab reads for the asset is recorded, in flight as well as finished, and a placeholder is saved before every create is sent, because the click spends money and the guard has to survive a reload. See ADR-0003, ADR-0005 and ADR-0009.
- **`onPublish` merges, never replaces.** `functions/src/helpers/muxField.ts` overlays the Mux asset mirror onto the existing locale value. It used to build a fresh object from a fixed key list and assign it over every locale, which destroyed any key it did not know about. `robotsJobs`, `robotsOutputs`, `robotsDirectiveRuns` and `robotsPendingCreates` are browser-owned and must survive a publish. The keys the function *does* own are `MUX_ASSET_MIRROR_KEYS`, which `buildAssetMirror` iterates — a key listed there and missing from the mirror is a compile error, not a key that silently never clears.
- **Destructive changes are deferred.** Deletes and playback-policy swaps queue as `pendingActions` on the field and execute server-side in `onPublish` when the entry is published. The browser holds a publish gate while that runs.
- **Video upload flow**: `muxProxy` creates a Mux direct-upload URL, the browser uploads straight to Mux (not through Contentful), and `pollForUploadDetails` waits for the asset id.
- **Mux API credentials** (token ID + secret) live in installation parameters — never log them.
- **Who can run Robots is a UI guardrail, not a permission.** `canRunRobots` in `frontend/src/util/robotsAccess.ts`: space admins (`sdk.user.spaceMembership.admin`, never role names), or everyone while `muxRobotsAllowEveryone` is `true` — unset means admins only. Any new control that starts, cancels or chooses a run reads it; nothing server-side enforces it (ADR-0016).
- **Robots needs the `robots:*` scope**, which cannot be added to an existing Mux token. `muxProxy` forwards Mux's `error.type` so the Robots tab can tell Mux refusing one run (`robots_*`: a workflow not on the plan, units) from Robots being off for the account (`forbidden`). Only the job list read decides capability; a refused run is a failed run (ADR-0006).
- **The config screen calls `api.mux.com` from the browser** (`util/apiClient.tsx`) under a CORS exception Mux granted Contentful. That is not an oversight: the screen has to work *before* the app is installed, and it validates credentials as *typed* rather than as saved. Everything else goes through `muxProxy`. Its errors still go through the tab's classifier — `muxApiErrorFromResponse` then `capabilityFromError` — never a status check of its own.
- **`functions/`** is a standalone package with its own `package.json`, `vite.config.mts` and `vitest.config.mts`. Bootstrap, test and build it independently.
- `contentful-app-manifest.json` (both the root one and `functions/`) defines the function signatures — update it when adding a function.
- **Asset stored as JSON**: Mux asset data lives in a Contentful JSON object field. The schema and its version history are documented in `frontend/README.md`.

## Never / Always

- **Never** call `sdk.field.setValue` directly for a partial update — use `updateField`.
- **Never** read `this.state.value` inside a mutator; the mutator is handed the authoritative value.
- **Never** make Mux API calls from the field editor directly — use app actions. The config screen is the documented exception.
- **Never** store raw Mux API credentials in entry fields.
- **Always** surface upload and job failures to the editor rather than logging them.
- **Always** put a confirm step in front of anything that spends Mux AI units.
