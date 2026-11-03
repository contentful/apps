/**
 * Types for the Mux Robots API surface the app talks to.
 *
 * Field names mirror the Mux payloads verbatim (snake_case) wherever the value comes off the
 * wire, following the convention the rest of the stored field JSON already uses. The two
 * exceptions are the *persisted* shapes at the bottom of this file (`RobotsJobRecord`,
 * `RobotsOutputs`), which are ours and use the app's camelCase.
 */

/**
 * The Robots API versions this app speaks. A job or directive keeps the version that created it
 * and is read, cancelled and run on that version only: the other one answers 404. See ADR-0017.
 */
export type RobotsApiVersion = 'v0' | 'v1';

/** The version new jobs and directive runs are created on. */
export const ROBOTS_API_VERSION: RobotsApiVersion = 'v1';

/**
 * Every workflow a listed job can name, as it appears in `POST /robots/{version}/jobs/{workflow}`.
 * `find-scenes` exists on v0 only; its jobs are still listed and read until Mux purges them.
 */
export const ROBOTS_WORKFLOWS = [
  'generate-premium-captions',
  'edit-captions',
  'translate-captions',
  'translate-audio',
  'summarize',
  'ask-questions',
  'find-key-moments',
  'find-best-thumbnails',
  'generate-engagement-insights',
  'generate-chapters',
  'analyze-structure',
  'find-scenes',
  'moderate',
] as const;

export type RobotsWorkflow = (typeof ROBOTS_WORKFLOWS)[number];

/** Workflows v1 dropped. Their old jobs are shown, never started. */
export const ROBOTS_RETIRED_WORKFLOWS = ['find-scenes'] as const;

/** What the run form offers and `POST /robots/v1/jobs/{workflow}` accepts. */
export type RobotsRunnableWorkflow = Exclude<
  RobotsWorkflow,
  (typeof ROBOTS_RETIRED_WORKFLOWS)[number]
>;

/** `_links` as the list endpoints return it, naming the route of the version that owns the item. */
export interface RobotsLinks {
  self?: { href?: string };
}

/**
 * The version that owns a listed job or directive, read from its `_links.self` route. `undefined`
 * without one: create and detail responses carry no `_links`.
 */
export function robotsApiVersionOf(
  resource: { _links?: RobotsLinks } | undefined
): RobotsApiVersion | undefined {
  const match = /^\/robots\/(v0|v1)\//.exec(resource?._links?.self?.href ?? '');
  return match ? (match[1] as RobotsApiVersion) : undefined;
}

export type RobotsJobStatus = 'pending' | 'processing' | 'completed' | 'errored' | 'cancelled';

/** Statuses a job will never leave, so polling can stop and a stored record is final. */
export const ROBOTS_TERMINAL_STATUSES = ['completed', 'errored', 'cancelled'] as const;
export type RobotsTerminalStatus = (typeof ROBOTS_TERMINAL_STATUSES)[number];

export function isTerminalStatus(status?: string): status is RobotsTerminalStatus {
  return !!status && (ROBOTS_TERMINAL_STATUSES as readonly string[]).includes(status);
}

/**
 * A job as the Robots API returns it. `errors` is typed loosely on purpose: the API documents it
 * only as "present when errored", so it is normalised through `robotsJobErrorMessage` rather than
 * read directly.
 */
export interface RobotsJob {
  id: string;
  workflow: RobotsWorkflow;
  status: RobotsJobStatus;
  created_at?: number;
  updated_at?: number;
  units_consumed?: number;
  /** Not on the list summary. `asset_id` is the asset the job ran on — see `mergeRobotsOutputs`. */
  parameters?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  errors?: unknown;
  resources?: unknown;
  /** Single-job GET only, like `parameters`. Absent for a job created by a direct POST. */
  directive?: RobotsJobDirective;
  /** On list summaries, and stamped on created jobs. Read it through `robotsApiVersionOf`. */
  _links?: RobotsLinks;
}

/**
 * The directive run that dispatched a job, as the single-job GET names it: the two ids the
 * directive's run GET takes. A dispatched job has its directive's version.
 */
export interface RobotsJobDirective {
  id: string;
  run_id: string;
}

/** A directive as the v1 list summarises it, for both versions. The configuration is not in it. */
export interface RobotsDirective {
  id: string;
  name?: string;
  created_at?: number;
  updated_at?: number;
  _links?: RobotsLinks;
}

export type RobotsDirectiveRunStatus =
  | 'pending'
  | 'dispatching'
  | 'running'
  | 'waiting'
  | 'completed'
  | 'partial'
  | 'errored';

/** Run statuses a directive will never leave, so polling can stop. */
export const ROBOTS_TERMINAL_RUN_STATUSES = ['completed', 'partial', 'errored'] as const;

export function isTerminalRunStatus(status?: string): boolean {
  return !!status && (ROBOTS_TERMINAL_RUN_STATUSES as readonly string[]).includes(status);
}

export type RobotsNodeStatus =
  | 'dispatched'
  | 'failed'
  | 'waiting_for_resources'
  | 'waiting_for_source_workflow'
  | 'waiting_for_source_bindings';

/** One step of a run. The names a node uses depend on its directive's version, so both are here. */
export interface RobotsNodeState {
  reference_id?: string;
  status?: RobotsNodeStatus;
  /** v0. */
  workflow_name?: RobotsWorkflow | string;
  /** v1. */
  workflow?: RobotsWorkflow | string;
  job_id?: string;
  /** Present when `status` is `failed`. */
  reason?: string;
  /** v0, while `waiting_for_source_workflow`: workflow names. */
  source_workflows?: string[];
  /** v1, while `waiting_for_source_bindings`: binding reference ids. */
  source_bindings?: string[];
}

/**
 * A directive run as the REST API returns it, from both `GET .../runs` and `GET .../runs/{id}`.
 *
 * The field names are the ones to be careful about, because Mux serialises a run two different
 * ways. The v0 **webhook** payload nests `{ id, directive_id, asset_id, … }`; the v0 **REST**
 * responses use `run_id` and `subject_id`. Modelling the webhook shape here is what made the runs
 * table permanently empty: filtering on `asset_id` matched nothing, ever. v1 uses `id` everywhere,
 * and `readDirectiveRun` renames it so the rest of the app keys runs one way.
 *
 * `subject_id` rather than `asset_id` because a directive's subject is what it runs against, and
 * today that is always an asset.
 */
export interface RobotsDirectiveRun {
  run_id: string;
  subject_id?: string;
  status?: RobotsDirectiveRunStatus;
  /** Returned in the order of the directive's bindings. */
  node_states?: RobotsNodeState[];
  started_at?: number;
  completed_at?: number | null;
  /**
   * v1 sends it. For a v0 run the caller attaches it from the directive whose runs it asked for,
   * the only place that association exists.
   */
  directive_id?: string;
}

/** A run as either version sends it: v1 names it `id`. */
export type RobotsDirectiveRunResponse = Omit<RobotsDirectiveRun, 'run_id'> & {
  run_id?: string;
  id?: string;
};

export function readDirectiveRun(run: RobotsDirectiveRunResponse): RobotsDirectiveRun {
  const { id, run_id: runId, ...rest } = run;
  return { ...rest, run_id: runId ?? id ?? '' };
}

/**
 * Whether this installation can use Robots at all. Anything but `enabled` replaces the tab with
 * an explainer, because nothing in it could work — so only the job list read decides it, never a
 * refused run. See ADR-0006's 2026-09-23 amendment.
 */
export type RobotsCapabilityState = 'enabled' | RobotsUnavailableState;

/** The token cannot reach Robots, or Robots is not turned on for the account. */
export type RobotsUnavailableState = 'not-enabled' | 'scope-missing';

export interface RobotsCapability {
  state: RobotsCapabilityState;
  /** Where the terms that turn Robots on are accepted, when Mux's answer named the page. */
  termsUrl?: string;
}

/**
 * Robots works, but something limits it right now. A warning over a working tab, never instead
 * of it, and never cached for the session: it is about the runs Mux refused, not about the tab.
 */
export type RobotsAdvisory = 'units-exhausted';

// --- Persisted shapes (ours, camelCase) ---

/**
 * The record mirrored onto the entry field for every Robots job the tab reads for the asset,
 * whoever started it. See ADR-0005.
 *
 * Recorded while in flight as well as once finished. Each status change is a write, and so a
 * "Changed" entry: a job passes through at most `pending → processing → completed`, and
 * `updateField` skips any poll tick that learns nothing. Records are append-and-update, so they
 * outlive Mux's 30-day purge.
 */
export interface RobotsJobRecord {
  id: string;
  workflow: RobotsWorkflow;
  status: RobotsJobStatus;
  created_at?: number;
  updated_at?: number;
  units_consumed?: number;
  /** First error message, when the job errored. */
  error?: string;
}

/**
 * The record mirrored onto the entry field for a directive run started from this entry: written
 * when its create is confirmed, or when a read resolves its placeholder, and updated after. It is
 * the entry's history of automation started here, and it keeps the tab polling that directive
 * whether or not it is still configured. See ADR-0009.
 */
export interface RobotsDirectiveRunRecord {
  runId: string;
  directiveId: string;
  status?: RobotsDirectiveRunStatus;
  startedAt?: number;
  completedAt?: number;
  /**
   * Ids of the jobs this run dispatched, as `node_states` reveals them. Append-only history;
   * nothing in the app reads it.
   */
  jobIds?: string[];
}

/**
 * A Robots create this entry asked for whose outcome is not known yet: written, and saved, before
 * the create is sent, and removed once the job or run it asked for is found. See ADR-0003.
 *
 * `requestedAt` is Unix seconds from the browser clock, the unit of Mux's `created_at`.
 */
export interface RobotsPendingJobCreate {
  requestId: string;
  kind: 'job';
  workflow: RobotsWorkflow;
  requestedAt: number;
}

export interface RobotsPendingDirectiveRunCreate {
  requestId: string;
  kind: 'directive-run';
  directiveId: string;
  requestedAt: number;
}

export type RobotsPendingCreate = RobotsPendingJobCreate | RobotsPendingDirectiveRunCreate;

export interface RobotsSummarizeOutput {
  /** Provenance lives inside the output so it survives independently of `robotsJobs`. */
  jobId: string;
  completedAt?: number;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface RobotsModerateOutput {
  jobId: string;
  completedAt?: number;
  exceedsThreshold?: boolean;
  maxScores?: { sexual?: number; violence?: number };
}

/** Analyze Structure's title, summary and tags, under Mux's names. */
export interface RobotsAnalyzeStructureOutput {
  jobId: string;
  completedAt?: number;
  title?: string;
  summary?: string;
  tags?: string[];
}

/**
 * Outputs written onto the field JSON so the Delivery API returns them with the entry: the newest
 * completed run of each workflow on this asset, whoever started it (ADR-0005, ADR-0008).
 *
 * Only summarize, moderation and Analyze Structure's text live here. The other workflows' results
 * live on the Mux asset: captions and dubs as tracks, chapters as its chapters track
 * (`update_asset_chapters`), and the best thumbnail as `thumbnail_time`. That also keeps this
 * object small — scenes and key moments, the two outputs that could realistically approach
 * Contentful's JSON-field size limit, are never persisted, Analyze Structure's included.
 */
export interface RobotsOutputs {
  summarize?: RobotsSummarizeOutput;
  moderate?: RobotsModerateOutput;
  analyzeStructure?: RobotsAnalyzeStructureOutput;
}

/** Workflows whose outputs are persisted onto the field JSON. */
export const PERSISTED_OUTPUT_WORKFLOWS: RobotsWorkflow[] = [
  'summarize',
  'moderate',
  'analyze-structure',
];

// There used to be a `TRACK_PRODUCING_WORKFLOWS` list here, gating the post-completion asset
// resync on the four workflows that attach a track. It was deleted rather than left in place,
// because nothing reads it any more and a constant that describes a rule the code no longer
// follows is worse than no constant. The gate was wrong: `summarize` with `update_asset_meta`,
// `find-best-thumbnails` with `update_asset_thumbnail` and `moderate` with
// `on_flagged: delete_playback_ids` all change the Mux asset too, and none of them attach a
// track. The tab now resyncs once per newly-completed job whatever the workflow — one GET,
// deduped per job per session.

/** Pulls a human-readable message out of the API's loosely-documented `errors`. */
export function robotsJobErrorMessage(job: Pick<RobotsJob, 'errors'>): string | undefined {
  const { errors } = job;
  if (!errors) return undefined;

  if (typeof errors === 'string') return errors;

  if (Array.isArray(errors)) {
    const first = errors[0] as Record<string, unknown> | string | undefined;
    if (!first) return undefined;
    if (typeof first === 'string') return first;
    const messages = first.messages;
    if (Array.isArray(messages) && typeof messages[0] === 'string') return messages[0];
    if (typeof first.message === 'string') return first.message;
    return undefined;
  }

  const asObject = errors as Record<string, unknown>;
  if (Array.isArray(asObject.messages) && typeof asObject.messages[0] === 'string') {
    return asObject.messages[0] as string;
  }
  if (typeof asObject.message === 'string') return asObject.message;
  return undefined;
}
