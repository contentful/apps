# Development

## Local env setup

1. From root directory: `npm install`
1. From root directory: `npm run bootstrap` (if this fails because of something related to `typeform-frontend` then `rm -rf apps/typeform`)
1. Go to this project: `cd apps/mux` (no need to npm install again, because bootstrap already did that via lerna)
1. `npm start` - now the mux app is running on http://localhost:3000

**Notes**: `@contentful/dam-app-base` gets installed by lerna when running `npm run bootstrap` from the root directory. If you're getting errors related to this you should probably `rm -rf node_modules` from this project, cd back into the root and run `npm i && npm run bootstrap` again.

## Contentful app setup

- Use the Mux (dev) contentful app and make sure it is pointed to http://localhost:3000 for development
- Create a development app in Contentful. Try to only select the resources needed.
- You will have to go into your browser settings and disable mixed content warnings for this to work
- Contentful uses Conventional Commits.
- Squash commit history.
- Use the Node version in the repo root `.nvmrc` (currently `lts/hydrogen`, i.e. 18).
- Use Prettier for formatting.

## Existing Videos and Captions

Captions and subtitles (using the terms interchangeably here) are bundled and delivered with the video during playback, and is ultimately the source of truth. For other UI uses, the captions are included in the data object so the video manifest does not have to be downloaded. For existing videos, workflows may have already added captions on some videos, and will continue to work in players even if they are not reflected in data stored in Contentful. To update the Contentful data on the video, press the "resync" button to sync to the latest state of the video.

## Deploy

- This gets deployed and hosted by Contentful

## Object Version

Updates to the stored field data should increase the version.
Parameters that come directly from the Mux API response are snake-case.

The version is **derived from what the value holds**, not asserted — see
`util/muxFieldVersion.ts`. An existing version is carried forward and only raised when the value
actually contains the newer data. That is deliberate: hard-coding the latest version would make
the rebuilt value differ from what is on disk for every existing entry, so merely opening one
would trigger a `setValue`, which flips a published entry to *Changed* with no cause an editor
can see.

### v4 — `robotsJobs`

Every Robots job the tab reads for the video, whoever started it: this entry, another entry, a
directive, or the Mux dashboard. Recorded in flight and updated as it progresses, and kept after
Mux stops returning it, so the entry's history outlives Mux's 30-day purge. A job reaches the entry
only when the value's `assetId` is the asset it was listed for. See ADR-0005.

Each status change is a write, and so a published entry shows *Changed*. The cost is bounded: a
job passes through at most `pending → processing → completed`, and a poll tick that learns nothing
writes nothing.

```json
{
  "version": 4,
  "robotsJobs": [
    {
      "id": string,
      "workflow": string,
      "status": "pending" | "processing" | "completed" | "errored" | "cancelled",
      "created_at": number,
      "updated_at": number,
      "units_consumed": number,
      "error": string
    }
  ]
}
```

### v4 — `robotsOutputs`

The newest completed summarize and moderation output on the video, whoever started the job. A job
supplies an output only when its own record names this asset (`parameters.asset_id` on the
single-job GET). See ADR-0005 and ADR-0008.

All four Robots keys — `robotsJobs`, `robotsOutputs`, `robotsDirectiveRuns` and
`robotsPendingCreates` — sit at **v4**, not at successive versions. They ship in one release, so
no build ever writes one without knowing about the others; each extra number would be one more
place the browser's copy of the rule and the function's can drift.

```json
{
  "version": 4,
  "robotsOutputs": {
    "summarize": {
      "jobId": string,
      "completedAt": number,
      "title": string,
      "description": string,
      "tags": [string]
    },
    "moderate": {
      "jobId": string,
      "completedAt": number,
      "exceedsThreshold": boolean,
      "maxScores": { "sexual": number, "violence": number }
    }
  }
}
```

Keyed by **workflow, not by job**, so there is at most one summary and one moderation result per
locale and the newest completed run wins, wherever it ran. Running summarize again to get a better
title overwrites the previous one on the entry, which is not reversible from Contentful. The
history is not lost: the job stays in `robotsJobs`, and the superseded output itself is readable
from `GET /robots/v0/jobs/{workflow}/{id}` for the 30 days Mux keeps the job. The surviving output
carries its own `jobId` and `completedAt`, so it is always traceable to the run that produced it.
See `docs/ADRs/0008`.

Retrievable through the Delivery API with the entry, but **not queryable**: the CDA cannot
filter, search or order on values inside a JSON object field. To query by a generated title or
tag, use *Apply to entry* in the Robots tab to write it onto a real entry field.

### v4 — `robotsDirectiveRuns`

The directive runs started from this entry: the run id, the directive, its status and the job ids
it dispatched. It is the entry's history of automation started here, and it keeps the tab polling
that directive whether or not it is still configured. See ADR-0009.

A run is added only when its create is confirmed, or when a read resolves its placeholder. Polling
updates runs the entry already holds and never introduces one, so opening an entry whose asset
happens to have a directive run in the API's window cannot add a key to it.

### v4 — `robotsPendingCreates`

A Robots create this entry asked for whose outcome is not known yet. Saved on the entry before the
create is sent, removed when the job or run it asked for is found, and read by every open tab: Run
stays blocked while one exists. See ADR-0003.

```json
{
  "version": 4,
  "robotsPendingCreates": [
    { "requestId": string, "kind": "job", "workflow": string, "requestedAt": number },
    { "requestId": string, "kind": "directive-run", "directiveId": string, "requestedAt": number }
  ]
}
```

`requestId` is 16 hex characters. `requestedAt` is Unix seconds from the browser's clock, the unit
of Mux's `created_at`. The key is deleted with its last entry rather than left as `[]`.

### v3

Everything the app writes today. The keys below were missing from earlier revisions of this
table even though the app has written them for some time.

```json
{
  "version": 3,
  "uploadId": string,
  "assetId": string,
  "playbackId": string,
  "signedPlaybackId": string, // If signed playback enabled.
  "drmPlaybackId": string,    // If DRM enabled.
  "ready": boolean,
  "ratio": string,
  "error": string,
  "max_stored_resolution": string,
  "max_stored_frame_rate": number,
  "duration": number,
  "audioOnly": boolean,
  "created_at": number,
  "live_stream_id": string,
  "is_live": boolean,
  "passthrough": string,
  "meta": {
    "title": string,
    "creator_id": string,
    "external_id": string
  },
  "static_renditions": [
    {
      "id": string,
      "name": string,
      "type": string,
      "ext": string,
      "status": "ready" | "preparing" | "error" | "skipped",
      "resolution": "highest" | "audio-only",
      "resolution_tier": string,
      "width": number,
      "height": number,
      "bitrate": number,
      "filesize": string,
      "url": string
    }
  ],
  "audioTracks": [
    {
      "type": "audio",
      "id": string,
      "status": string,
      "name": string,
      "language_code": string,
      "primary": boolean,
      "duration": number
    }
  ],
  "captions": [
    {
      "type": string,
      "text_type": string,
      "text_source": string,
      "status": string,
      "name": string,
      "language_code": string,
      "id": string,
      "closed_captions": boolean
    }
  ],
  // The asset's single chapters track (text_type "chapters"), when it has one — for example
  // written by generate-chapters with update_asset_chapters.
  "chaptersTrack": {
    "type": "text",
    "text_type": "chapters",
    "text_source": string,
    "status": string,
    "name": string,
    "language_code": string,
    "id": string
  },
  "pendingActions": {
    // Destructive changes queue here and execute server-side in the onPublish function.
    "delete": [{ "type": string, "id": string, "retry": number }],
    "create": [{ "type": string, "data": object, "retry": number }],
    "update": [{ "type": string, "data": object, "retry": number }]
  }
}
```

### v2

```json
{
  "version": 2,
  "uploadId": string,
  "assetId": string,
  "signedPlaybackId": string, // If signed playback enabled.
  "playbackId": string,
  "ready": boolean,
  "ratio": string,
  "max_stored_resolution": string,
  "max_stored_frame_rate": number,
  "duration": number,
  "audioOnly": boolean
}
```

### v1

```json
{
  "uploadId": string,
  "assetId": string,
  "signedPlaybackId": string, // If signed playback enabled.
  "playbackId": string,
  "ready": boolean,
  "ratio": string,
}
```

## Robots

The **Robots** tab runs Mux AI workflows on the current video and reads the results back.

### Requirements

- Robots must be enabled on the Mux account, which Mux does once its terms are accepted in the
  dashboard. Until then the tab, and the directive list on the configuration screen, say so and
  link the page Mux names.
- The Mux access token needs the **`robots:*` scope**. This scope cannot be added to a token that
  already exists, so an account upgrading to Robots has to generate a *new* token and paste it
  into the app configuration. The tab detects this and says so.
- Free-plan accounts get 100,000 Mux AI units a month. Past that, Mux refuses a run that would not
  fit (`robots_units_limit_exceeded`): the run fails, and the tab keeps working under a warning
  with the free-plan context, which clears on the next run Mux accepts. A workflow a plan does not
  include — `translate-audio` on the free plan (`robots_workflow_not_available`) — is a failed run
  too, and says nothing about the rest of the tab. See ADR-0006.
- The field grows monotonically: job and directive-run records are appended and updated, never
  removed, so history outlives Mux's 30-day purge of the jobs themselves. Contentful put this at
  ~50 KB at 200 jobs and under 250 KB at 1,000, against the CMA request-size limit — a single
  video would need thousands of jobs to be a problem. Note that every write resends the whole
  field, because the field API has no partial update, so what scales is the write *frequency* as
  much as the size. See ADR-0005.

### What it does

- Runs any of the twelve public workflows, with a per-workflow parameter form
  (`util/robotsCatalog.ts`) and a confirm step that names the workflow and links pricing.
- Shows job status, survives reload, and cancels a running job.
- Runs *directives* — several workflows in order — either ad hoc from the tab, or automatically
  on every new upload via **Robots** in the app configuration.
- Keeps the video's newest summary and moderation output on the field JSON (v4), whoever ran the
  job, and can apply generated title/description/tags onto the editor's own entry fields with a
  preview.

### Notes

- **Polling, not webhooks.** Contentful cannot receive Mux webhooks — no App Function type
  exposes an HTTP endpoint Mux could call — so job status is polled while the tab is open, and
  reconciled from the API on the next open. A job that finishes with nobody watching is picked up
  the next time someone opens the Robots tab, or the entry itself while it records the job as still
  running (ADR-0013).
- **Outputs reach the Delivery API on the next publish**, the same contract captions already
  have. Unlike captions, the field JSON is the *only* delivery path for `robotsOutputs`, so until
  someone publishes the entry, the data does not exist for the consumer.
- **Admins run Robots; everyone else once an admin says so.** The controls that start, cancel or
  choose a run — Run a workflow, Run directive, Cancel, and the directive choice on upload — render
  for space admins (`sdk.user.spaceMembership.admin`, never a role name), and for everyone else
  only while **Let everyone run Robots** is on in the app configuration. It stays off until an
  admin saves it. Everyone still sees the results and can apply them, and the admin's default
  directives still run on every upload, listed read-only for anyone who cannot change them. This
  hides controls; it is not a permission. `muxProxy` forwards any Video or Robots call and the Mux secret
  reaches the browser in the installation parameters, so a determined user can still spend units —
  a real boundary needs the secret moved server-side first. See ADR-0016.
- **Every job on the video is recorded.** The tab records every job it reads for the asset,
  whoever started it, and keeps a record once stored: Robots purges jobs after 30 days, and the
  record simply stops updating. So the first time someone opens the Robots tab on an entry whose
  video has any Robots job, the entry gains `robotsJobs` (and v4) and shows *Changed*, with nothing
  run from Contentful. Installs without Robots list no jobs and stay untouched. See ADR-0005.
- **A run is guarded by a placeholder on the entry, and shown as a row until it becomes the job.**
  The create is billable, neither create API takes an idempotency key, and an App Function can
  lose its caller after its request reached Mux. So each create saves a placeholder
  (`robotsPendingCreates`) *before* anything is sent, and Run stays blocked while one exists, in
  every tab and after a reload. The job table (or the directive runs table) shows it as a row —
  *Waiting for publish*, *Starting…* or *Not confirmed* — that turns into the job or run in place.
  A create Mux answers is exact: a 202 records the job, a refusal removes the placeholder, and an
  identical job already pending or processing gets Mux's 409. A create whose answer never arrives
  keeps its placeholder, and the next list read that shows a new job of that workflow within two
  minutes of the request resolves it. Nothing is retried, and nothing time-based re-enables Run:
  the note above the table explains an unconfirmed run and offers **Nothing is running — let me
  try again**. See `docs/ADRs/0003`.
- **A run confirmed right after a publish with pending actions waits for that publish.** The
  publish function rewrites the field, so the placeholder save waits behind it, for up to 90
  seconds. The modal closes, the row says *Waiting for publish*, and **Don't start** withdraws the
  run while nothing has been sent. Closing the entry during the wait drops the save and sends
  nothing. See ADR-0010.
- **Per-locale.** `robotsJobs`, `robotsOutputs`, `robotsDirectiveRuns` and `robotsPendingCreates`
  live on the field JSON, so on a localized Mux field they are per-locale even though the Mux asset
  is shared. The job
  list itself is always read per asset, so the tab shows every job regardless of which locale
  started it.
- **The job list is a summary.** `GET /robots/v0/jobs` gives status and timing but no `outputs`,
  `parameters`, `units_consumed` or `errors`, so the tab fills those in from the single job
  (`GET /robots/v0/jobs/{workflow}/{id}`). Reading a job costs nothing and charges nobody, and a
  row with a permanently blank Units column reads as a bug. The read is bounded — terminal jobs
  only, the newest 20 on the asset, a handful per pass — and a
  detail read that fails is remembered as failed, so a 404 on a purged job does not get
  re-requested on every poll tick for as long as the entry stays open. Outputs come from this same
  read, so a summary more than 20 jobs back is kept only once someone opens its row.
- **No client analytics.** The app has no telemetry of any kind. Mux counts the Robots jobs CMS
  integrations create on its own side, by the `x-source-platform: contentful` header every proxied
  call carries, job and directive-run creates included. Until Mux confirms it counts by that
  header, a job create also sends `passthrough: 'mux:cms:contentful:'`, and nothing in the app
  reads it. Nothing else the app creates is marked: an asset's, a track's and a static rendition's
  `passthrough` belong to the customer, and this app mirrors them onto the entry. See ADR-0003.
