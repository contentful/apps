import {
  PERSISTED_OUTPUT_WORKFLOWS,
  RobotsDirectiveRun,
  RobotsDirectiveRunRecord,
  RobotsJob,
  RobotsJobRecord,
  RobotsModerateOutput,
  RobotsOutputs,
  RobotsPendingCreate,
  RobotsPendingDirectiveRunCreate,
  RobotsPendingJobCreate,
  RobotsSummarizeOutput,
  RobotsWorkflow,
  isTerminalRunStatus,
  isTerminalStatus,
  robotsJobErrorMessage,
} from './robotsTypes';
import { deriveFieldVersion } from './muxFieldVersion';
import { MuxContentfulObject } from './types';
import { ROBOTS_STALE_JOB_MS } from './robotsRequests';

/**
 * Turning what the API says into what the entry stores.
 *
 * Every merge here returns the *same reference* when nothing changed, because `updateField` drops
 * writes that would change nothing and that is what keeps a poll tick from flipping a published
 * entry to "Changed" on every pass. Records are append-and-update only: Mux purges jobs after 30
 * days and the entry's history has to outlive that. See ADR-0005 and ADR-0010.
 */

function toJobRecord(job: RobotsJob): RobotsJobRecord | undefined {
  if (!job.id || !job.status) return undefined;
  const error = robotsJobErrorMessage(job);
  return compact({
    id: job.id,
    workflow: job.workflow,
    status: job.status,
    created_at: job.created_at,
    updated_at: job.updated_at,
    units_consumed: job.units_consumed,
    error,
  }) as RobotsJobRecord;
}

/**
 * Merges the jobs from an API read into the records already on the field.
 *
 * The API is authoritative when the two disagree — the records are a mirror of state Robots owns.
 */
export function mergeJobRecords(
  existing: RobotsJobRecord[] | undefined,
  jobs: RobotsJob[]
): RobotsJobRecord[] | undefined {
  const incoming = jobs.map(toJobRecord).filter((record): record is RobotsJobRecord => !!record);
  if (incoming.length === 0) return existing;

  const byId = new Map<string, RobotsJobRecord>();
  for (const record of existing ?? []) byId.set(record.id, record);

  let changed = false;
  for (const record of incoming) {
    const current = byId.get(record.id);
    if (!current) {
      byId.set(record.id, record);
      changed = true;
      continue;
    }
    // The list is a summary, so an incoming record can be *thinner* than the stored one — no
    // `units_consumed` or `error` even though detail supplied them. Merging keeps what only the
    // richer response knew.
    const merged: RobotsJobRecord = { ...current, ...compact(record) };
    if (JSON.stringify(current) !== JSON.stringify(merged)) {
      byId.set(record.id, merged);
      changed = true;
    }
  }

  if (!changed) return existing;

  // Newest first, so the table reads the way an editor expects without sorting in the component.
  return Array.from(byId.values()).sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
}

/**
 * Drops keys whose value is `undefined`.
 *
 * Load-bearing in two places. Merging: a spread of a thinner API record must not erase a field the
 * richer create response gave us. Storing: an explicit `undefined` key is a key, and a record that
 * carries one is not byte-identical to what is on disk — which is what re-drafts a published entry.
 */
function compact<T extends object>(value: T): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) result[key] = entry;
  }
  return result as Partial<T>;
}

function extractSummarizeOutput(job: RobotsJob): RobotsSummarizeOutput | undefined {
  const outputs = job.outputs;
  if (!outputs) return undefined;
  const tags = Array.isArray(outputs.tags)
    ? (outputs.tags as unknown[]).filter((tag): tag is string => typeof tag === 'string')
    : undefined;

  const output = compact({
    jobId: job.id,
    completedAt: job.updated_at,
    title: typeof outputs.title === 'string' ? outputs.title : undefined,
    description: typeof outputs.description === 'string' ? outputs.description : undefined,
    tags: tags?.length ? tags : undefined,
  }) as RobotsSummarizeOutput;

  return output.title || output.description || output.tags ? output : undefined;
}

function extractModerateOutput(job: RobotsJob): RobotsModerateOutput | undefined {
  const outputs = job.outputs;
  if (!outputs) return undefined;

  const maxScores = outputs.max_scores as Record<string, unknown> | undefined;
  const scores =
    maxScores && typeof maxScores === 'object'
      ? compact({
          sexual: typeof maxScores.sexual === 'number' ? maxScores.sexual : undefined,
          violence: typeof maxScores.violence === 'number' ? maxScores.violence : undefined,
        })
      : undefined;

  const output = compact({
    jobId: job.id,
    completedAt: job.updated_at,
    exceedsThreshold:
      typeof outputs.exceeds_threshold === 'boolean' ? outputs.exceeds_threshold : undefined,
    maxScores: scores && Object.keys(scores).length > 0 ? scores : undefined,
  }) as RobotsModerateOutput;

  return output.exceedsThreshold !== undefined || output.maxScores ? output : undefined;
}

/**
 * Folds the outputs of completed jobs into the persisted `robotsOutputs`.
 *
 * Only summarize and moderation: the rest either already land on the Mux asset (captions, dubs,
 * thumbnails) or are too large for a JSON field (scenes, key moments). Keyed by workflow, so
 * re-running supersedes rather than accumulating. See ADR-0008.
 *
 * Whoever started the job: an output describes the video, not this entry's activity. What it must
 * be is *this* video's, so each job is checked against `assetId` by its own record — not by the
 * list it came from — and one that names no asset writes nothing. See ADR-0005's 2026-09-25
 * amendment.
 */
export function mergeRobotsOutputs(
  existing: RobotsOutputs | undefined,
  jobs: RobotsJob[],
  assetId: string | undefined
): RobotsOutputs | undefined {
  const relevant = jobs.filter(
    (job) =>
      job.status === 'completed' &&
      PERSISTED_OUTPUT_WORKFLOWS.includes(job.workflow) &&
      ranOnAsset(job, assetId)
  );
  if (relevant.length === 0) return existing;

  const next: RobotsOutputs = { ...(existing ?? {}) };
  let changed = false;

  for (const job of relevant) {
    if (job.workflow === 'summarize') {
      const output = extractSummarizeOutput(job);
      if (!output) continue;
      if (isNewerOutput(next.summarize, output)) {
        next.summarize = output;
        changed = true;
      }
    }
    if (job.workflow === 'moderate') {
      const output = extractModerateOutput(job);
      if (!output) continue;
      if (isNewerOutput(next.moderate, output)) {
        next.moderate = output;
        changed = true;
      }
    }
  }

  return changed ? next : existing;
}

/** `parameters` is on the single-job GET only, so a list summary never qualifies. */
function ranOnAsset(job: RobotsJob, assetId: string | undefined): boolean {
  return !!assetId && job.parameters?.asset_id === assetId;
}

/**
 * A strict order, so every read order and every open session settles on the same output. Mux
 * timestamps are whole seconds, so ties are real; the job id breaks them. See ADR-0008's
 * 2026-09-25 amendment.
 */
function isNewerOutput(
  current: { jobId: string; completedAt?: number } | undefined,
  candidate: { jobId: string; completedAt?: number }
): boolean {
  if (!current) return true;
  if (current.jobId === candidate.jobId) {
    return JSON.stringify(current) !== JSON.stringify(candidate);
  }
  const currentAt = completionTime(current);
  const candidateAt = completionTime(candidate);
  return candidateAt > currentAt || (candidateAt === currentAt && candidate.jobId > current.jobId);
}

/**
 * Oldest when missing — or not a number, since the stored value is user-reachable JSON and a
 * string there would make every comparison false and pin that output for good.
 */
function completionTime(output: { completedAt?: unknown }): number {
  return typeof output.completedAt === 'number' ? output.completedAt : 0;
}

function toDirectiveRunRecord(run: RobotsDirectiveRun): RobotsDirectiveRunRecord | undefined {
  if (!run.run_id || !run.directive_id) return undefined;
  const jobIds = (run.node_states ?? [])
    .map((node) => node.job_id)
    .filter((id): id is string => !!id);

  return compact({
    runId: run.run_id,
    directiveId: run.directive_id,
    status: run.status,
    startedAt: run.started_at,
    // `null` is a value the API sends for a run that has not finished, and it is not `undefined`
    // — storing it would put a `completedAt: null` on the entry.
    completedAt: run.completed_at ?? undefined,
    jobIds: jobIds.length > 0 ? jobIds : undefined,
  }) as RobotsDirectiveRunRecord;
}

/**
 * Merges directive runs from an API read into the records already on the field.
 *
 * `append` is the whole difference between the callers. **A run started here** is appended — at
 * creation, or when a read resolves its placeholder. **Polling** never appends: if it did, merely
 * opening an entry whose asset has a run inside the API's newest-25 window would add a key, raise
 * the version and flip a published entry to "Changed" for a run nobody started here.
 *
 * `jobIds` is unioned, never replaced: a later read may show fewer nodes, and the record is
 * history. See ADR-0009.
 */
export function mergeDirectiveRunRecords(
  existing: RobotsDirectiveRunRecord[] | undefined,
  runs: RobotsDirectiveRun[],
  { append = false }: { append?: boolean } = {}
): RobotsDirectiveRunRecord[] | undefined {
  const incoming = runs
    .map(toDirectiveRunRecord)
    .filter((record): record is RobotsDirectiveRunRecord => !!record);
  if (incoming.length === 0) return existing;

  const byId = new Map<string, RobotsDirectiveRunRecord>();
  for (const record of existing ?? []) byId.set(record.runId, record);

  let changed = false;
  for (const record of incoming) {
    const current = byId.get(record.runId);
    if (!current) {
      if (!append) continue;
      byId.set(record.runId, record);
      changed = true;
      continue;
    }

    const jobIds = Array.from(new Set([...(current.jobIds ?? []), ...(record.jobIds ?? [])]));
    const merged: RobotsDirectiveRunRecord = {
      ...current,
      ...compact(record),
      ...(jobIds.length > 0 && { jobIds }),
    };
    if (JSON.stringify(current) !== JSON.stringify(merged)) {
      byId.set(record.runId, merged);
      changed = true;
    }
  }

  if (!changed) return existing;

  return Array.from(byId.values()).sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
}

/**
 * Records a directive run this app just started. The **only** place a run is added to the entry:
 * it is what makes the run, and every job it dispatches, survive a reload without depending on
 * the API's newest-25 list window. See ADR-0009.
 */
export function recordRobotsDirectiveRun(
  value: MuxContentfulObject | undefined,
  run: RobotsDirectiveRun
): MuxContentfulObject | undefined {
  return applyDirectiveRunRecords(value, [run], { append: true });
}

/**
 * Folds fresh directive-run data into runs the entry already records. Never adds one — see
 * `mergeDirectiveRunRecords`.
 */
export function applyRobotsDirectiveRunsToValue(
  value: MuxContentfulObject | undefined,
  runs: RobotsDirectiveRun[]
): MuxContentfulObject | undefined {
  return applyDirectiveRunRecords(value, runs, { append: false });
}

function applyDirectiveRunRecords(
  value: MuxContentfulObject | undefined,
  runs: RobotsDirectiveRun[],
  options: { append: boolean }
): MuxContentfulObject | undefined {
  if (!value) return value;

  const robotsDirectiveRuns = mergeDirectiveRunRecords(value.robotsDirectiveRuns, runs, options);
  if (robotsDirectiveRuns === value.robotsDirectiveRuns) return value;

  const next: MuxContentfulObject = {
    ...value,
    ...(robotsDirectiveRuns && { robotsDirectiveRuns }),
  };

  return { ...next, version: deriveFieldVersion(next) };
}

/**
 * The single mutator the Robots tab hands to `updateField`: record every job read for the asset,
 * and fold the newest summarize and moderate outputs in.
 *
 * Writes only onto a value whose `assetId` is the asset the jobs were listed for, so a mutator
 * queued for one asset and applied after the value was replaced with another writes nothing.
 */
export function applyRobotsJobsToValue(
  value: MuxContentfulObject | undefined,
  jobs: RobotsJob[],
  assetId: string
): MuxContentfulObject | undefined {
  if (!value || value.assetId !== assetId) return value;

  const robotsJobs = mergeJobRecords(value.robotsJobs, jobs);
  const robotsOutputs = mergeRobotsOutputs(value.robotsOutputs, jobs, value.assetId);

  if (robotsJobs === value.robotsJobs && robotsOutputs === value.robotsOutputs) return value;

  const next: MuxContentfulObject = {
    ...value,
    ...(robotsJobs && { robotsJobs }),
    ...(robotsOutputs && { robotsOutputs }),
  };

  // Derived, never asserted: a value with no Robots data keeps whatever version it had.
  return { ...next, version: deriveFieldVersion(next) };
}

/**
 * Jobs that still need `GET /robots/v0/jobs/{workflow}/{id}`, where `outputs`, `units_consumed`,
 * `errors` and `parameters` live. Reading one is a GET that charges nobody, and it is where every
 * summarize and moderate output comes from.
 *
 * Bounded in two directions because the candidate pool is every terminal job on the asset:
 * `window` caps how far back we look at all, `limit` caps one pass. The bound must not lie,
 * though — `unitsCell` says "Not loaded" for a row past it and offers the read that answers it.
 * See ADR-0005.
 */
export function jobsNeedingDetail(
  jobs: RobotsJob[],
  alreadyDetailed: Set<string>,
  { limit = 5, window = 20 }: { limit?: number; window?: number } = {}
): RobotsJob[] {
  return jobsAwaitingDetail(jobs, alreadyDetailed, { window }).slice(0, limit);
}

/**
 * Every job the background pass will still read, not just the next batch — what the table shows
 * as loading rather than as "Not loaded". One rule with `jobsNeedingDetail`, so a cell can never
 * say it is loading a read that will not happen.
 */
export function jobsAwaitingDetail(
  jobs: RobotsJob[],
  alreadyDetailed: Set<string>,
  { window = 20 }: { window?: number } = {}
): RobotsJob[] {
  return [...jobs]
    .sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))
    .slice(0, window)
    .filter((job) => isTerminalStatus(job.status) && !alreadyDetailed.has(job.id));
}

/** A directive run, by the two ids its single-run GET takes. */
export interface RobotsDirectiveRunRef {
  directiveId: string;
  runId: string;
}

/**
 * The directive runs these jobs name, once each.
 *
 * `directive` is on the single-job GET only, so this sees the jobs whose detail has been read —
 * which is what bounds reading their runs by the asset rather than by the account.
 */
export function directiveRunRefsFromJobs(jobs: RobotsJob[]): RobotsDirectiveRunRef[] {
  const byRunId = new Map<string, RobotsDirectiveRunRef>();
  for (const job of jobs) {
    const directiveId = job.directive?.id;
    const runId = job.directive?.run_id;
    if (directiveId && runId && !byRunId.has(runId)) byRunId.set(runId, { directiveId, runId });
  }
  return Array.from(byRunId.values());
}

/**
 * Directive runs still worth polling — what carries the loop across the gap a directive leaves
 * between one workflow finishing and the next being dispatched.
 *
 * Two terminal conditions, because a poll that never ends bills round trips for as long as the
 * entry stays open: a `completed`/`partial`/`errored` status, or a `started_at` further back than
 * `ROBOTS_STALE_JOB_MS`. The staleness cut-off is deliberately shorter than the 24 hours the
 * engine gives a binding waiting on a source workflow — Refresh is right there.
 */
export function activeDirectiveRuns(
  runs: RobotsDirectiveRun[],
  now = Date.now()
): RobotsDirectiveRun[] {
  return runs.filter((run) => {
    if (isTerminalRunStatus(run.status)) return false;
    const startedMs = (run.started_at ?? 0) * 1000;
    if (!startedMs) return true;
    return now - startedMs < ROBOTS_STALE_JOB_MS;
  });
}

/** What "still running" needs to know, shared by the API shape and the stored record. */
interface PollableJob {
  status?: string;
  created_at?: number;
}

/** Jobs that are still worth polling: non-terminal, and not so old that the API has lost them. */
export function activeJobs<T extends PollableJob>(jobs: T[], now = Date.now()): T[] {
  return jobs.filter((job) => {
    if (isTerminalStatus(job.status)) return false;
    const createdMs = (job.created_at ?? 0) * 1000;
    if (!createdMs) return true;
    return now - createdMs < ROBOTS_STALE_JOB_MS;
  });
}

/**
 * Jobs the **entry itself** records as still running.
 *
 * Read from the stored value, so it costs nothing and is available before the Robots tab has
 * fetched anything — which is the point. Two things key off it, both in ADR-0013:
 *
 * - the editor-wide notice that publishing now will publish a job's *unfinished* state;
 * - starting the poll for an entry reopened while a job is in flight, without waiting for
 *   somebody to click the Robots tab.
 *
 * Bounded by the same staleness cut-off as `activeJobs`, so a record stuck at `processing` —
 * a job Mux purged, or a session that died mid-run — stops driving either of them after six
 * hours rather than nagging and polling forever.
 */
export function unfinishedJobRecords(
  value: MuxContentfulObject | undefined,
  now = Date.now()
): RobotsJobRecord[] {
  return activeJobs(value?.robotsJobs ?? [], now);
}

// --- Pending creates ---

/**
 * How far from a placeholder's `requestedAt` a job's `created_at` (or a run's `started_at`) may
 * be to resolve it. Lopsided on purpose: a job created before the request cannot be its result,
 * and the 15 s only tolerate a browser clock running ahead of Mux's. A larger skew fails closed.
 */
export const ROBOTS_CREATE_MATCH_BEFORE_S = 15;
export const ROBOTS_CREATE_MATCH_AFTER_S = 120;

const REQUEST_ID_HEX_LENGTH = 16;

/** 64 random bits: unique within the handful of creates one entry can have pending. */
function randomRequestId(): string {
  const cryptoObj = typeof crypto !== 'undefined' ? crypto : undefined;
  if (cryptoObj?.getRandomValues) {
    const bytes = cryptoObj.getRandomValues(new Uint8Array(REQUEST_ID_HEX_LENGTH / 2));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // No `crypto` at all (an old embedded webview). Weaker, still the right length.
  const seed = `${Date.now().toString(16)}${Math.floor(Math.random() * 0xffffffff).toString(16)}`;
  return seed.padEnd(REQUEST_ID_HEX_LENGTH, '0').slice(-REQUEST_ID_HEX_LENGTH);
}

export function newPendingJobCreate(
  workflow: RobotsWorkflow,
  nowMs = Date.now()
): RobotsPendingJobCreate {
  return {
    requestId: randomRequestId(),
    kind: 'job',
    workflow,
    requestedAt: Math.floor(nowMs / 1000),
  };
}

export function newPendingDirectiveRunCreate(
  directiveId: string,
  nowMs = Date.now()
): RobotsPendingDirectiveRunCreate {
  return {
    requestId: randomRequestId(),
    kind: 'directive-run',
    directiveId,
    requestedAt: Math.floor(nowMs / 1000),
  };
}

function isPendingCreate(entry: unknown): entry is RobotsPendingCreate {
  if (!entry || typeof entry !== 'object') return false;
  const { requestId, kind, requestedAt, workflow, directiveId } = entry as Record<string, unknown>;
  if (typeof requestId !== 'string' || requestId === '') return false;
  if (typeof requestedAt !== 'number' || !Number.isFinite(requestedAt)) return false;
  if (kind === 'job') return typeof workflow === 'string' && workflow !== '';
  if (kind === 'directive-run') return typeof directiveId === 'string' && directiveId !== '';
  return false;
}

/** The stored array as it is, entries this build cannot read included, so a write keeps them. */
function storedPendingCreates(value: MuxContentfulObject): unknown[] {
  const stored: unknown = value.robotsPendingCreates;
  return Array.isArray(stored) ? stored : [];
}

/**
 * The placeholders on the value. The field is user-reachable JSON, so this never throws and skips
 * anything it cannot read: a missing `requestId`, an unknown `kind`, a non-numeric `requestedAt`.
 */
export function pendingCreatesOf(value: MuxContentfulObject | undefined): RobotsPendingCreate[] {
  return value ? storedPendingCreates(value).filter(isPendingCreate) : [];
}

/**
 * Placeholders recent enough to resume the poll for without the tab being open, on the same
 * staleness bound as a running job (ADR-0013). It bounds that read only, never the guard.
 */
export function freshPendingCreates(
  value: MuxContentfulObject | undefined,
  nowMs = Date.now()
): RobotsPendingCreate[] {
  return pendingCreatesOf(value).filter(
    (pending) => nowMs - pending.requestedAt * 1000 < ROBOTS_STALE_JOB_MS
  );
}

/**
 * The key is deleted with its last entry rather than left as `[]`: `updateField` compares values
 * with `undefined` keys dropped, and an empty array would keep the entry from its earlier shape.
 */
function withPendingCreates(value: MuxContentfulObject, entries: unknown[]): MuxContentfulObject {
  const next: MuxContentfulObject = { ...value };
  if (entries.length > 0) next.robotsPendingCreates = entries as RobotsPendingCreate[];
  else delete next.robotsPendingCreates;
  return { ...next, version: deriveFieldVersion(next) };
}

export function addPendingCreate(
  value: MuxContentfulObject | undefined,
  pending: RobotsPendingCreate,
  assetId: string
): MuxContentfulObject | undefined {
  if (!value || value.assetId !== assetId) return value;
  const stored = storedPendingCreates(value);
  if (pendingCreatesOf(value).some((entry) => entry.requestId === pending.requestId)) return value;
  return withPendingCreates(value, [...stored, pending]);
}

export function removePendingCreates(
  value: MuxContentfulObject | undefined,
  predicate: (pending: RobotsPendingCreate) => boolean
): MuxContentfulObject | undefined {
  if (!value) return value;
  const stored = storedPendingCreates(value);
  const kept = stored.filter((entry) => !(isPendingCreate(entry) && predicate(entry)));
  return kept.length === stored.length ? value : withPendingCreates(value, kept);
}

/** A 202 named the job: the record replaces the placeholder, in one write. */
export function resolvePendingJobCreate(
  value: MuxContentfulObject | undefined,
  requestId: string,
  job: RobotsJob,
  assetId: string
): MuxContentfulObject | undefined {
  if (!value || value.assetId !== assetId) return value;
  const withoutPlaceholder = removePendingCreates(value, (entry) => entry.requestId === requestId);
  return applyRobotsJobsToValue(withoutPlaceholder, [job], assetId);
}

/** A 202 named the run: the run record replaces the placeholder, in one write. */
export function resolvePendingDirectiveRunCreate(
  value: MuxContentfulObject | undefined,
  requestId: string,
  run: RobotsDirectiveRun,
  assetId: string
): MuxContentfulObject | undefined {
  if (!value || value.assetId !== assetId) return value;
  const withoutPlaceholder = removePendingCreates(value, (entry) => entry.requestId === requestId);
  return recordRobotsDirectiveRun(withoutPlaceholder, run);
}

function idsOf<T>(records: unknown, id: (record: T) => unknown): Set<string> {
  if (!Array.isArray(records)) return new Set();
  return new Set(
    (records as T[]).map(id).filter((entry): entry is string => typeof entry === 'string')
  );
}

interface MatchCandidate {
  id: string;
  at: number;
}

/** Closest to the request first; ties to the earlier time, then the smaller id. */
function closestTo(requestedAt: number, candidates: MatchCandidate[]): MatchCandidate | undefined {
  return [...candidates].sort(
    (a, b) =>
      Math.abs(a.at - requestedAt) - Math.abs(b.at - requestedAt) ||
      a.at - b.at ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  )[0];
}

function inMatchWindow(at: number, requestedAt: number): boolean {
  return (
    at >= requestedAt - ROBOTS_CREATE_MATCH_BEFORE_S &&
    at <= requestedAt + ROBOTS_CREATE_MATCH_AFTER_S
  );
}

/**
 * Which job or run resolves which placeholder, as `requestId` → job id or run id. Pure, and run on
 * the lists the poll already reads, so it costs no request.
 *
 * A placeholder this tab holds a create response for (`links`) resolves to that. The rest, oldest
 * first, take the closest unused candidate inside the match window that the entry has **not
 * already recorded**: the job a click created is new to the entry by definition, so an earlier run
 * of the same workflow cannot resolve it. A job needs the same workflow and a `created_at`; a run
 * the same directive, the value's asset as its subject, a `run_id` and a `started_at`.
 */
export function matchPendingCreates(
  pendings: RobotsPendingCreate[],
  jobs: RobotsJob[],
  runs: RobotsDirectiveRun[],
  value: MuxContentfulObject | undefined,
  links: ReadonlyMap<string, string> = new Map()
): Map<string, string> {
  const matched = new Map<string, string>();
  const used = new Set<string>();
  for (const pending of pendings) {
    const linked = links.get(pending.requestId);
    if (!linked) continue;
    matched.set(pending.requestId, linked);
    used.add(linked);
  }

  const recordedJobIds = idsOf<RobotsJobRecord>(value?.robotsJobs, (record) => record.id);
  const recordedRunIds = idsOf<RobotsDirectiveRunRecord>(
    value?.robotsDirectiveRuns,
    (record) => record.runId
  );
  const unlinked = pendings
    .filter((pending) => !matched.has(pending.requestId))
    .sort((a, b) => a.requestedAt - b.requestedAt);

  for (const pending of unlinked) {
    const candidates: MatchCandidate[] =
      pending.kind === 'job'
        ? jobs
            .filter((job) => job.workflow === pending.workflow && !recordedJobIds.has(job.id))
            .flatMap((job) =>
              typeof job.created_at === 'number' ? [{ id: job.id, at: job.created_at }] : []
            )
        : runs
            .filter(
              (run) =>
                !!run.run_id &&
                run.directive_id === pending.directiveId &&
                !!value?.assetId &&
                run.subject_id === value.assetId &&
                !recordedRunIds.has(run.run_id)
            )
            .flatMap((run) =>
              typeof run.started_at === 'number' ? [{ id: run.run_id, at: run.started_at }] : []
            );

    const match = closestTo(
      pending.requestedAt,
      candidates.filter(
        (candidate) => !used.has(candidate.id) && inMatchWindow(candidate.at, pending.requestedAt)
      )
    );
    if (!match) continue;
    matched.set(pending.requestId, match.id);
    used.add(match.id);
  }

  return matched;
}

/**
 * The first step of the persist mutator: remove every placeholder a read resolves, and record the
 * directive runs that resolve one. The jobs are recorded by `applyRobotsJobsToValue`, which runs
 * after it in the same mutator.
 */
export function resolvePendingCreatesFromReads(
  value: MuxContentfulObject | undefined,
  jobs: RobotsJob[],
  runs: RobotsDirectiveRun[],
  assetId: string,
  links?: ReadonlyMap<string, string>
): MuxContentfulObject | undefined {
  if (!value || value.assetId !== assetId) return value;
  const pendings = pendingCreatesOf(value);
  if (pendings.length === 0) return value;

  const matched = matchPendingCreates(pendings, jobs, runs, value, links);
  if (matched.size === 0) return value;

  const resolvedRunIds = new Set(
    pendings
      .filter((pending) => pending.kind === 'directive-run' && matched.has(pending.requestId))
      .map((pending) => matched.get(pending.requestId))
  );
  const withoutResolved = removePendingCreates(value, (pending) => matched.has(pending.requestId));
  return applyDirectiveRunRecords(
    withoutResolved,
    runs.filter((run) => resolvedRunIds.has(run.run_id)),
    { append: true }
  );
}

// --- Pending creates on screen ---

/** Where this tab's own create is: saving its placeholder, parked behind a publish, sent, or unknown. */
export type PendingCreatePhase = 'saving' | 'waiting-for-publish' | 'sending' | 'unconfirmed';

/** This tab's own create of one kind. At most one per kind: Run is blocked while there is one. */
export interface LocalPendingCreate {
  pending: RobotsPendingCreate;
  phase: PendingCreatePhase;
}

/** What a pending row says. `saving` and `sending` both show as starting. */
export type PendingCreateRowPhase = 'waiting-for-publish' | 'starting' | 'unconfirmed';

export interface PendingCreateRow {
  pending: RobotsPendingCreate;
  phase: PendingCreateRowPhase;
}

/**
 * How long a stored placeholder with no local create reads as starting before it reads as not
 * confirmed: the ~30 s `createWithResponse` waits, plus the placeholder save and the resolution
 * write reaching other tabs. It changes a label and when the note appears, never Run.
 */
export const ROBOTS_CREATE_CONFIRM_GRACE_S = 45;

export interface PendingCreateRowsInput {
  /** The stored placeholders of one kind. */
  stored: RobotsPendingCreate[];
  local?: LocalPendingCreate;
  /** Request ids this tab settled — refused, withdrawn, cleared — whose removal may still wait. */
  settled: ReadonlySet<string>;
  links: ReadonlyMap<string, string>;
  /** What the table shows: the jobs for job creates, the runs for directive-run creates. */
  jobs: RobotsJob[];
  runs: RobotsDirectiveRun[];
  value: MuxContentfulObject | undefined;
  nowS: number;
}

const LOCAL_ROW_PHASE: Record<PendingCreatePhase, PendingCreateRowPhase> = {
  saving: 'starting',
  'waiting-for-publish': 'waiting-for-publish',
  sending: 'starting',
  unconfirmed: 'unconfirmed',
};

/** Not sent yet, so no job or run can be its result. */
const isUnsent = (phase?: PendingCreatePhase) =>
  phase === 'saving' || phase === 'waiting-for-publish';

/**
 * The pending rows of one table, one per request, derived so a pending row and the job or run it
 * becomes are never both on screen and never both missing. The rows, the Run buttons and the note
 * all read this. See ADR-0003.
 */
export function pendingCreateRows({
  stored,
  local,
  settled,
  links,
  jobs,
  runs,
  value,
  nowS,
}: PendingCreateRowsInput): PendingCreateRow[] {
  // A local create not saved yet is a row of its own; once sent, it only sets its stored
  // placeholder's phase, and yields nothing if that placeholder has gone.
  const localPhase = (requestId: string) =>
    local?.pending.requestId === requestId ? local.phase : undefined;
  const candidates = [...stored];
  if (
    local &&
    isUnsent(local.phase) &&
    !stored.some((p) => p.requestId === local.pending.requestId)
  ) {
    candidates.push(local.pending);
  }

  const unsettled = candidates.filter((pending) => !settled.has(pending.requestId));
  const matched = matchPendingCreates(
    unsettled.filter((pending) => !isUnsent(localPhase(pending.requestId))),
    jobs,
    runs,
    value,
    links
  );
  const shownIds = new Set([...jobs.map((job) => job.id), ...runs.map((run) => run.run_id)]);

  return unsettled
    .filter((pending) => {
      const resolvedTo = matched.get(pending.requestId);
      return !resolvedTo || !shownIds.has(resolvedTo);
    })
    .map((pending) => {
      const phase = localPhase(pending.requestId);
      if (phase) return { pending, phase: LOCAL_ROW_PHASE[phase] };
      return {
        pending,
        phase:
          nowS - pending.requestedAt < ROBOTS_CREATE_CONFIRM_GRACE_S ? 'starting' : 'unconfirmed',
      };
    });
}

/** A row of a Robots table: a pending create, or what the API listed. */
export type RobotsTableRow<T> =
  | { key: string; pending: PendingCreateRow; item?: undefined }
  | { key: string; pending?: undefined; item: T };

/**
 * Newest first, by `requestedAt` for a pending row and the listed time otherwise. A missing time
 * sorts last; on a tie a pending row comes first, then the smaller id. Sorted here rather than
 * trusted to the API, whose list order is not documented, so a resolved job takes the slot its
 * pending row held.
 */
function tableRows<T>(
  pendingRows: PendingCreateRow[],
  items: T[],
  idOf: (item: T) => string,
  timeOf: (item: T) => number | undefined
): RobotsTableRow<T>[] {
  const rows: RobotsTableRow<T>[] = [
    ...pendingRows.map((pending) => ({ key: `create:${pending.pending.requestId}`, pending })),
    ...items.map((item) => ({ key: idOf(item), item })),
  ];
  const at = (row: RobotsTableRow<T>) =>
    row.pending ? row.pending.pending.requestedAt : timeOf(row.item as T);
  const id = (row: RobotsTableRow<T>) =>
    row.pending ? row.pending.pending.requestId : idOf(row.item as T);

  return rows.sort((a, b) => {
    const atA = at(a);
    const atB = at(b);
    const hasA = typeof atA === 'number';
    const hasB = typeof atB === 'number';
    if (hasA !== hasB) return hasA ? -1 : 1;
    if (hasA && hasB && atA !== atB) return (atB as number) - (atA as number);
    if (!!a.pending !== !!b.pending) return a.pending ? -1 : 1;
    return id(a) < id(b) ? -1 : id(a) > id(b) ? 1 : 0;
  });
}

export function jobTableRows(
  pendingRows: PendingCreateRow[],
  jobs: RobotsJob[]
): RobotsTableRow<RobotsJob>[] {
  return tableRows(
    pendingRows,
    jobs,
    (job) => job.id,
    (job) => job.created_at
  );
}

export function runTableRows(
  pendingRows: PendingCreateRow[],
  runs: RobotsDirectiveRun[]
): RobotsTableRow<RobotsDirectiveRun>[] {
  return tableRows(
    pendingRows,
    runs,
    (run) => run.run_id,
    (run) => run.started_at
  );
}
