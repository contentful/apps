import { MuxApiError, MuxApiService } from './muxApi';
import {
  RobotsAdvisory,
  RobotsCapability,
  RobotsDirectiveRun,
  RobotsJob,
  RobotsUnavailableState,
  RobotsWorkflow,
} from './robotsTypes';

/** What the Robots tab sends Mux, and how it reads the answers. See ADR-0003 and ADR-0006. */

export const ROBOTS_PRICING_URL = 'https://www.mux.com/docs/pricing/overview#mux-robots-pricing';
export const ROBOTS_DOCS_URL = 'https://www.mux.com/docs/guides/robots';
export const ROBOTS_TOKEN_DOCS_URL = 'https://dashboard.mux.com/settings/access-tokens';
/** No organization or environment in it, so it is right for every account. */
export const ROBOTS_DASHBOARD_URL = 'https://dashboard.mux.com';

/**
 * How long a job may sit in a non-terminal state before the tab stops waiting on it.
 * Purely a client-side guard against polling forever on a job the API has lost track of.
 */
export const ROBOTS_STALE_JOB_MS = 6 * 60 * 60 * 1000;

/**
 * Poll cadence for in-flight jobs. Much slower than the 500 ms asset loop on purpose: a Robots job
 * takes minutes, and each tick costs at least two CMA requests through the app-action bridge.
 */
export const ROBOTS_POLL_INTERVAL_MS = 6000;

/**
 * How many poll ticks a pending create keeps the loop alive for, so its job or run can be looked
 * for. Counted per kind: job creates and directive-run creates.
 *
 * A pending create is the one case where nothing may be in flight to arm the loop, so the
 * placeholder arms it itself, and the count bounds it, or an open tab polls forever over a job
 * that never started. Ten ticks is a minute at the cadence above; a job Mux did create is listed
 * within seconds. What the bound ends is the looking: the placeholder still blocks Run until a
 * read resolves it or the editor clears it (ADR-0003).
 */
export const ROBOTS_UNCONFIRMED_RECHECK_TICKS = 10;

/**
 * Creates a job, once. The create is billable and has no idempotency key, so it is never retried.
 *
 * A `MuxApiError` with a status means Mux answered and nothing started. Anything else — the app
 * action call giving up after ~30 s, the function dying, a 2xx that names no job — leaves the
 * outcome unknown, and the caller keeps its placeholder. See ADR-0003.
 */
export async function startRobotsJob(
  muxApi: MuxApiService,
  workflow: RobotsWorkflow,
  parameters: Record<string, unknown>
): Promise<RobotsJob> {
  const response = await muxApi.createRobotsJob(workflow, parameters);
  if (response.error) {
    // Every message, not just the first: a rejected job lists one per bad parameter. `muxProxy`
    // does the same for the non-2xx path; this is the rarer error inside a 2xx body.
    const messages = (response.error.messages ?? []).filter(
      (message) => typeof message === 'string' && message.trim() !== ''
    );
    throw new MuxApiError(
      messages.length > 0 ? messages.join(' ') : 'Mux rejected this job but gave no reason.',
      400
    );
  }
  if (!response.data?.id) throw new Error('Mux answered without naming the job it started.');
  return response.data;
}

/**
 * Starts a directive run, once, on the same terms as `startRobotsJob`. A 2xx that names no run is
 * an unknown outcome. The response never names its directive, so the run is tagged with it here.
 */
export async function startRobotsDirectiveRun(
  muxApi: MuxApiService,
  directiveId: string,
  assetId: string
): Promise<RobotsDirectiveRun> {
  const response = await muxApi.createRobotsDirectiveRun(directiveId, assetId);
  const created = response?.data;
  if (!created?.run_id) throw new Error('Mux answered without naming the run it started.');
  return { ...created, directive_id: directiveId };
}

/**
 * What an error says about whether this installation can use Robots at all — or `undefined`, the
 * answer for most errors, including every refusal of a single run.
 *
 * One classifier, two callers: the Robots tab, whose errors come through `muxProxy`, and the
 * config screen, which calls `api.mux.com` directly (see `muxApiErrorFromResponse`).
 *
 * - **401** is the token: rejected, or without the `robots:*` scope. `insufficient_scope` is
 *   honoured too, though nothing Mux documents sends it.
 * - **403 `forbidden`** is Robots not being turned on for the account, which the API reference
 *   gives as the one meaning of that 403: its terms have not been accepted. The type is the same
 *   `forbidden` Mux uses for every 403 of that kind, so the status and type classify it and the
 *   message is read only for the page it names.
 * - **403 `robots_*`** is Mux refusing one run — this workflow is not on the plan, or it would
 *   not fit the units left — and says nothing about the account. See `advisoryFromError`.
 */
export function capabilityFromError(
  error: unknown
): (RobotsCapability & { state: RobotsUnavailableState }) | undefined {
  if (!(error instanceof MuxApiError)) return undefined;
  const { status, errorType } = error;

  if (status === 401 || errorType === 'insufficient_scope') return { state: 'scope-missing' };
  if (status === 403 && (errorType === undefined || errorType === 'forbidden')) {
    const termsUrl = dashboardUrlIn(error.message);
    return termsUrl ? { state: 'not-enabled', termsUrl } : { state: 'not-enabled' };
  }
  return undefined;
}

/**
 * What a refused run says about the runs that come after it. A warning, never a capability: the
 * units check is made per run, so a cheaper workflow can still fit. See ADR-0006.
 */
export function advisoryFromError(error: unknown): RobotsAdvisory | undefined {
  return error instanceof MuxApiError && error.errorType === 'robots_units_limit_exceeded'
    ? 'units-exhausted'
    : undefined;
}

/**
 * The Mux dashboard page a message names, if it names one. The terms-not-accepted 403 links the
 * exact organization and environment, which nothing else in the response identifies.
 */
function dashboardUrlIn(message: string): string | undefined {
  // Sentence punctuation after the URL is not part of it.
  return /https:\/\/dashboard\.mux\.com\/[^\s"'<>]*/.exec(message)?.[0].replace(/[.,;:)]+$/, '');
}

/**
 * Capability is resolved once per browser session, not once per asset. Opening ten entries in a
 * row should not cost ten extra app-action round trips to learn the same answer.
 */
let capabilityCache: RobotsCapability | undefined;

export function cachedRobotsCapability(): RobotsCapability | undefined {
  return capabilityCache;
}

/**
 * Fills the session cache from a read that was happening anyway.
 *
 * There used to be a `resolveRobotsCapability` here that filled the cache with a dedicated
 * `listRobotsJobs({ limit: 1 })` probe, awaited before the tab read anything it actually wanted.
 * The panel's own job list answers the same question — a success means enabled, a 401/403 says
 * which kind of unavailable — so the probe was a serialized round trip spent learning something
 * the next call would have said anyway. The cache is still worth having and is still filled once
 * per browser session; it is just filled by the read the editor is waiting for.
 */
export function recordRobotsCapability(capability: RobotsCapability): void {
  capabilityCache = capability;
}

export function resetRobotsCapabilityCache(): void {
  capabilityCache = undefined;
}
