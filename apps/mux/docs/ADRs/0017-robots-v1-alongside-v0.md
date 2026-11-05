# ADR-0017: Robots v1 alongside v0

**Date:** 2026-10-29
**Status:** Accepted

## Context

Robots v1 is the GA API, released on 2026-10-27. v0 is deprecated and stays available for six
months. v1 renames request fields, moves media times from milliseconds to seconds, changes how a
caption track is chosen and drops Find Scenes. Changing the URL is not enough.

Every job and directive keeps the version that created it. A detail read, a cancel or a directive
run through the other version is a `404 not_found`; nothing is converted on read. Creating a v1 copy
of a v0 directive in Mux gives it a new id, and the old id keeps running on v0 wherever it is
attached, uploads included.

This app is hosted: one deploy moves every install at once, with v0 work in flight — jobs running,
v0 directive ids in the configuration, records on entries. None of it can be migrated for the
customer, and none of it may break.

Checked against the running API on 2026-10-29, with a test asset:

- `GET /robots/v1/jobs` and `GET /robots/v0/jobs` both list the jobs of both versions, Find Scenes
  included, and each summary's `_links.self.href` names the version that owns it.
- `GET /robots/v1/directives` lists the directives of both versions as summaries with `_links`.
- Create and detail responses carry no `_links`.
- A duplicate v1 create is `409 conflict`. v1 also answers 409 `asset_not_ready` and
  `track_not_ready`, which mean "wait", not "already running".
- `edit-captions` with `upload_to_mux: false` runs with neither `replace_existing_tracks` nor
  `track_name` sent.
- The browser CORS exception answers `/robots/v1/*` as it does `/robots/v0/*`.

## Decision

**New jobs and directive runs go to v1.** The run form only builds v1 requests, under v1's
parameter names (`output_language_code`, `target_duration` in seconds, `replace_existing_tracks`,
`track_name`). There is no version switch.

**Everything that exists is read on the version that created it.**

- One job list, `GET /robots/v1/jobs`, which covers both versions. A job's detail read and cancel
  follow its `_links`. The create response has none, so `MuxApiService` stamps the v1 route on the
  jobs it creates; a job without links was created on v0.
- Directives are listed through v1, which covers both. A directive's runs go to its version: the
  one a listing gave, or else v1 and, after a 404 only, v0 — Mux's rule for an id stored without
  its version, which is what configured and recorded directive ids are. The answer is remembered
  for the session. v1 calls a run `id`; it is read as `run_id`, the key the app already uses.

**Nothing stored changes shape.** No version is written onto an entry. Stored records are history
and are never used to call Mux by job id, and directive ids resolve as above. A record that gained a
key on the next read would flip every published entry with Robots history to "Changed" (ADR-0006),
and `deriveFieldVersion` stays as it is. The one addition is Analyze Structure's slot in
`robotsOutputs`, below, which only a completed Analyze Structure job on the asset writes.

**v0 directives keep working, and say so.** They run on v0 from the Robots tab and on uploads. The
config screen marks each one, and asks for a v1 copy of any it attaches to uploads; the Robots tab
shows the same note over the directive picker and marks v0 options. Both link Mux's migration
guide. The upload dialog marks each v0 directive and says an admin can replace it, without the
note: the editor there cannot act on it, and the directive still runs.

**Outputs are read in both units, by key.** `start_time` / `end_time` / `time` are seconds,
`start_ms` / `end_ms` / `timestamp_ms` are milliseconds, so a view never converts by version and
never converts twice. The chapters write outcome is `asset_updates.chapters`, or v0's
`asset_update`. Summarize and moderate outputs did not change, so `robotsOutputs` did not either.

**Find Scenes leaves the run form; Analyze Structure takes its place and is a workflow of its
own.** Old Find Scenes jobs are still listed, labelled and shown. Analyze Structure returns a title,
summary, tags, chapters, scenes and key moments in one job, and its view shows all of them, reusing
the Summarize, chapters, scenes and key-moments views. It runs on audio-only assets too, from the
captions, with no scenes; there the form needs a caption track, as Mux's guide does. Its form offers `update_asset_meta` and `update_asset_chapters`, both off,
and the run form says it costs more units than Find Scenes and can generate Mux Shots, without a
figure: Robots has no estimate.

**Analyze Structure's title, summary and tags are stored as `robotsOutputs.analyzeStructure`**,
under Mux's names (`summary`, not `description`), by the same newest-wins rule as Summarize
(ADR-0008). Its chapters, scenes and key moments are not, for the reason scenes and key moments
never were: the field's size. "Apply summary" uses the newer of Summarize and Analyze Structure and
names which. Adding the key needs no field version: `robotsOutputs` already raises an entry to v4,
and every earlier build spreads the map it reads, so the key survives a rollback.

**Smaller v1 behaviours the form absorbs.**

- "Captions to read" is a choice among the asset's ready caption languages: v1 takes the first
  ready track when it is left out, with no preference for English, and matches a language exactly.
- Edit Captions replaces the source track and keeps its name, v1's default. Keeping the source
  needs a new `track_name`, checked before Continue.
- Edit Captions refuses a `track_name` another caption track already has, whichever happens to the
  original: Mux does.
- v1's new track options are offered. Premium Captions and Translate Captions can delete only
  Mux's auto-generated tracks in the way (`replace_generated`); Translate Captions and Translate
  Audio take a `track_name` and a `replace_existing_tracks`, both only with an upload, and Audio
  without `replace_generated`, which Mux documents as `fail` for audio. Edit Captions renames
  speaker labels (`speaker_replacements`), which on its own is enough for a run.
- A 409 `asset_not_ready` or `track_not_ready` is a warning with Mux's message. Every other 409
  still reads as the same run already going.
- Mux refuses a duplicate only within one version, so a v1 run next to a v0 job of the same workflow
  bills twice. The confirm step warns when the job list shows one still running.

## Consequences

### Positive
- One deploy moves every install to v1 for new work without breaking a v0 job in flight, a v0
  directive on uploads, or a record on an entry.
- One poll for jobs, as before.

### Negative
- A v0 directive no listing has named costs one extra 404 per session before its runs are read.
- The run form cannot start a v0 job any more.
- Analyze Structure costs more units than Find Scenes did, and generates Mux Shots on a video,
  billed separately. The run form says both, without a figure.
- An entry whose asset already has a completed Analyze Structure job, from the dashboard or a
  directive, gains `robotsOutputs.analyzeStructure` the next time the Robots tab reads it, and a
  published one shows as "Changed", as a Summarize from elsewhere already does (ADR-0005).

### Neutral
- After the v0 sunset, the v0 paths go: the `v0` defaults in `MuxApiService`, the fallback in
  `onDirectiveVersion`, the Find Scenes label and view, the millisecond readers and `asset_update`.
