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

### v4 — `robotsOutputs`

The newest summarize and moderation output on the video, **whoever started the job**: this entry,
another entry, a directive, or the Mux dashboard. An output describes the video, like the asset
mirror; which jobs this entry ran is `robotsJobs`' question, and that one still follows ownership.
A job supplies an output only when its own record names this asset (`parameters.asset_id` on the
single-job GET). See ADR-0005's 2026-09-25 amendment.

All three Robots keys — `robotsJobs`, `robotsOutputs` and `robotsDirectiveRuns` — sit at **v4**,
not at three successive versions. They ship in one release, so no build ever writes one without
knowing about the others; there is no shape for a second or third number to tell apart, and each
extra number is one more place the browser's copy of the rule and the function's can drift.

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
history is not lost: every job run from this entry stays in `robotsJobs`, so *which* runs happened
here and when is answerable from the entry indefinitely, and the superseded output itself is
readable from `GET /robots/v0/jobs/{workflow}/{id}` for the 30 days Mux keeps the job. The
surviving output carries its own `jobId` and `completedAt`, so it is always traceable to the run
that produced it; a `jobId` that `robotsJobs` does not hold is a run started elsewhere. See
`docs/ADRs/0008`.

Retrievable through the Delivery API with the entry, but **not queryable**: the CDA cannot
filter, search or order on values inside a JSON object field. To query by a generated title or
tag, use *Apply to entry* in the Robots tab to write it onto a real entry field.

### v4 — `robotsDirectiveRuns`

The directive runs this plugin started on the video, recorded at creation with the run id, the
directive, its status and the job ids it dispatched.

Recorded for the same reason jobs are, and for one more: `GET /robots/v0/directives/{id}/runs`
cannot filter by asset and is read one page at a time here, so ownership of everything a run dispatches
would otherwise depend on that run still being inside the newest 25 for its directive. A busy
directive pushes it out within hours. See ADR-0009.

A run is only ever *added* at creation. Polling updates runs the entry already holds and never
introduces one, so opening an entry whose asset happens to have a directive run in the API's
window cannot add a key to it.

### v4 — `robotsJobs`

The Robots jobs this plugin started on the video, recorded from the moment each one is created
and updated as it progresses.

Recording at creation rather than at completion is deliberate, and it is what makes the feature
work at all: `GET /robots/v0/jobs` returns a *summary* of each job with no `passthrough`, so once
the page reloads there is nothing left to distinguish a job started here from one someone ran in
the Mux dashboard. The entry is the durable record of "we started this". It also means the editor
sees the run on the entry immediately, which is what they expect after confirming a paid action.

The cost is bounded — a job passes through at most `pending → processing → completed`, and a poll
tick that learns nothing writes nothing.

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
      "passthrough": string,
      "error": string
    }
  ]
}
```

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
  too, and says nothing about the rest of the tab. See ADR-0006's 2026-09-23 amendment.
- The field grows monotonically: job and directive-run records are appended and updated, never
  removed, so history outlives Mux's 30-day purge of the jobs themselves. Contentful put this at
  ~50 KB at 200 jobs and under 250 KB at 1,000, against the CMA request-size limit — a single
  video would need thousands of jobs to be a problem. Note that every write resends the whole
  field, because the field API has no partial update, so what scales is the write *frequency* as
  much as the size. See ADR-0005's 2026-09-16 amendment.

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
  hides controls; it is not a permission. `muxProxy` is a generic passthrough and the Mux secret
  reaches the browser in the installation parameters, so a determined user can still spend units —
  a real boundary needs the secret moved server-side first. See ADR-0016.
- **Only what ran through Contentful is recorded as a job.** A job is recognised as this plugin's if
  it is already recorded on the entry (the durable test — see the v4 note above), or carries a
  `passthrough` naming this space, environment and entry, or was dispatched by a run of a
  directive configured at install, recorded on the entry, or started from the tab. A job someone
  ran from the Mux dashboard against the same video, or one a directive run started elsewhere
  dispatched, is *listed* in the tab — the list reads the API, so it shows everything, and marks
  it *Started elsewhere* — but never recorded. And once a record is stored it stays: Robots purges
  jobs after 30 days, and a finished run is a fact about this entry's history, so it is not removed
  when the API stops returning it. It simply stops updating.
- **Outputs are the exception.** A summary or moderation result is kept whoever started the job,
  because it describes the video rather than this entry's activity. So the first time someone
  opens the Robots tab on an entry whose video was summarized or moderated elsewhere, the entry
  gains `robotsOutputs` (and v4) and shows *Changed*, with nothing run from Contentful. See
  ADR-0005's 2026-09-25 amendment.
- **Storing is narrower than showing, and a bare prefix proves nothing.** Because the tab reads
  detail for jobs it does not own, it also sees *their* `passthrough` — and the prefix identifies
  the integration, not the install, so a second Contentful install pointed at the same Mux account
  writes an identical-looking tag. The passthrough therefore carries an install scope:
  `mux:cms:contentful:<version>|<space>:<environment>:<entry>|<16 hex>`, and `isOwnPassthrough`
  trusts it only when all three ids match `sdk.ids`. Jobs stamped before 2026-09-27 open with
  `contentful@` instead, and are read the same way, so one of ours is still recognised. Anything
  that does not parse, and the older two-segment format, are never trusted — ownership then falls
  back to the two durable signals, already on the entry or dispatched by a directive run on this
  asset. `findJobByPassthrough` is unaffected: it compares the whole string against one this
  session generated, which is an identity check rather than an ownership check. See
  `docs/ADRs/0003`.
- **A run Mux never confirmed blocks the button until it is resolved, not until a timer runs
  out.** App Functions cold-start, and one can lose its caller *after* its request reached Mux — so
  the job may be running and billing while the browser saw a failure. Nothing is ever retried
  automatically. The `passthrough` stamped on the attempt is kept and matched against the job list
  on every refresh; Run only re-enables when the job turns up, or when the editor explicitly says
  nothing is running. See `docs/ADRs/0003`.
- **Per-locale.** `robotsJobs`, `robotsOutputs` and `robotsDirectiveRuns` live on the field JSON,
  so on a localized Mux field they are per-locale even though the Mux asset is shared. The job
  list itself is always read per asset, so the tab shows every job regardless of which locale
  started it.
- **The job list is a summary.** `GET /robots/v0/jobs` gives status and timing but no `outputs`,
  `units_consumed`, `errors` or `passthrough`, so the tab fills those in from the single job
  (`GET /robots/v0/jobs/{workflow}/{id}`). That read is deliberately *not* gated on ownership:
  the tab lists every job on the asset, and a row with a permanently blank Units column and an
  empty output modal reads as a bug, while reading a job costs nothing and charges nobody. It is
  bounded instead — terminal jobs only, the newest 20 on the asset, a handful per pass — and a
  detail read that fails is remembered as failed, so a 404 on a purged job does not get
  re-requested on every poll tick for as long as the entry stays open. Outputs come from this same
  read, so a summary more than 20 jobs back is kept only once someone opens its row.
- **No client analytics.** The app has no telemetry of any kind. Job attribution is done Mux-side
  instead: every proxied call carries `x-source-platform: contentful`, and every job created here
  carries `mux:cms:contentful:<version>|<space>:<environment>:<entry>|<16 hex>` in its
  `passthrough` — the prefix is the one Mux counts its CMS integrations' Robots jobs by. Nothing
  else the app creates is marked: an asset's, a track's and a static rendition's `passthrough`
  belong to the customer, and this app mirrors them onto the entry. Jobs a directive dispatches
  are created by Mux and carry no passthrough of ours. See ADR-0003's 2026-09-27 amendment.
