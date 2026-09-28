import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MuxApiService } from '../../util/muxApi';
import { jobsAwaitingDetail, jobsNeedingDetail } from '../../util/robots';
import { RobotsJob } from '../../util/robotsTypes';

/**
 * The job detail cache.
 *
 * `GET /robots/v0/jobs` returns a six-field summary; `outputs`, `units_consumed`, `errors` and
 * `parameters` only exist on `GET /robots/v0/jobs/{workflow}/{id}`. Terminal detail never
 * changes, so it is fetched once and cached for the life of the component.
 *
 * Three ways in, all bounded:
 *
 * - a background pass over the newest terminal jobs, a few per tick (`jobsNeedingDetail`);
 * - `loadJobDetail`, one row, because the editor clicked the Units cell on a row past that window;
 * - `rememberJobDetail`, keeping what the output modal already paid for.
 *
 * Every terminal job on the asset qualifies: reading one is a GET that charges nobody, a row with
 * a permanently blank Units column looks like a bug, and it is where every summarize and moderate
 * output comes from.
 */
export interface RobotsJobDetails {
  /** The list summary, overlaid with whatever detail has been read for each job. */
  enrichedJobs: RobotsJob[];
  /** Ids whose full record is in hand, so a blank Units cell means Mux sent no count. */
  detailedJobIds: Set<string>;
  /** Ids whose detail read was attempted and failed, so the row stops offering the read. */
  failedDetailIds: Set<string>;
  /** Ids with an on-demand read in flight. */
  loadingDetailIds: string[];
  /** Ids the background pass has yet to read, whose Units are therefore on their way. */
  pendingDetailIds: Set<string>;
  loadJobDetail: (job: RobotsJob) => Promise<void>;
  /**
   * Keeps a record the caller already holds: what the output modal fetched. It has already been
   * paid for; throwing it away sent the row behind the modal back to saying it knew nothing about
   * its own Units.
   */
  rememberJobDetail: (job: RobotsJob) => void;
}

export function useRobotsJobDetails(
  muxApi: MuxApiService | undefined,
  jobs: RobotsJob[],
  isMountedRef: React.MutableRefObject<boolean>
): RobotsJobDetails {
  const [jobDetails, setJobDetails] = useState<Record<string, RobotsJob>>({});
  /**
   * Separate from `jobDetails` rather than a null sentinel in it, so nothing downstream has to
   * treat "we know this job has no detail" as a job object. Without it, a 404 on a purged job is
   * retried on every poll tick for as long as the entry stays open.
   */
  const [failedDetailIds, setFailedDetailIds] = useState<Set<string>>(new Set());
  const [loadingDetailIds, setLoadingDetailIds] = useState<string[]>([]);

  /** Mirrors, so `loadJobDetail` keeps one identity — it is a prop of the job table. */
  const jobDetailsRef = useRef(jobDetails);
  jobDetailsRef.current = jobDetails;
  const failedDetailIdsRef = useRef(failedDetailIds);
  failedDetailIdsRef.current = failedDetailIds;
  /** Authoritative, not a mirror: a second click must be refused before React re-renders. */
  const loadingDetailIdsRef = useRef<Set<string>>(new Set());

  const enrichedJobs = useMemo(
    () => jobs.map((job) => (jobDetails[job.id] ? { ...job, ...jobDetails[job.id] } : job)),
    [jobs, jobDetails]
  );

  // The background pass. Re-runs as its own writes land, which is what walks through the window a
  // few jobs at a time rather than in one burst.
  useEffect(() => {
    if (!muxApi || jobs.length === 0) return;
    const attempted = new Set([...Object.keys(jobDetails), ...failedDetailIds]);
    const pending = jobsNeedingDetail(jobs, attempted);
    if (pending.length === 0) return;

    let cancelled = false;
    (async () => {
      const fetched = await Promise.all(
        pending.map(async (job) => {
          try {
            const response = await muxApi.getRobotsJob(job.workflow, job.id);
            return response.data ? ([job.id, response.data] as const) : ([job.id, null] as const);
          } catch (error) {
            console.error(`[robots] Could not load job ${job.id}`, error);
            return [job.id, null] as const;
          }
        })
      );
      if (cancelled || !isMountedRef.current) return;

      const loaded = fetched.filter(
        (entry): entry is readonly [string, RobotsJob] => entry[1] !== null
      );
      const failed = fetched.filter((entry) => entry[1] === null).map(([id]) => id);

      if (loaded.length > 0) {
        setJobDetails((previous) => ({ ...previous, ...Object.fromEntries(loaded) }));
      }
      if (failed.length > 0) {
        setFailedDetailIds((previous) => new Set([...previous, ...failed]));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [muxApi, jobs, jobDetails, failedDetailIds, isMountedRef]);

  /**
   * One row, on a click.
   *
   * The background window stays — an asset with two hundred dashboard jobs must not cost two
   * hundred round trips to open. What was wrong was not the bound but what it looked like: rows
   * past it rendered an em dash, indistinguishable from a job that consumed nothing. They now say
   * "Not loaded" and this is the read that answers it, so request volume tracks interest.
   */
  const loadJobDetail = useCallback(
    async (job: RobotsJob) => {
      if (!muxApi) return;
      // Already known, already failed, or already being read. Any of the three is a no-op.
      if (jobDetailsRef.current[job.id] || failedDetailIdsRef.current.has(job.id)) return;
      if (loadingDetailIdsRef.current.has(job.id)) return;

      loadingDetailIdsRef.current.add(job.id);
      setLoadingDetailIds((previous) => [...previous, job.id]);
      try {
        const response = await muxApi.getRobotsJob(job.workflow, job.id);
        if (!isMountedRef.current) return;
        if (response.data) {
          setJobDetails((previous) => ({ ...previous, [job.id]: response.data }));
        } else {
          setFailedDetailIds((previous) => new Set([...previous, job.id]));
        }
      } catch (error) {
        console.error(`[robots] Could not load job ${job.id}`, error);
        if (isMountedRef.current) {
          setFailedDetailIds((previous) => new Set([...previous, job.id]));
        }
      } finally {
        loadingDetailIdsRef.current.delete(job.id);
        if (isMountedRef.current) {
          setLoadingDetailIds((previous) => previous.filter((id) => id !== job.id));
        }
      }
    },
    [muxApi, isMountedRef]
  );

  /**
   * Never overwrites: a detail already in hand is at least as complete as the incoming one, and
   * replacing it would change `jobDetails`' identity on every modal open for no gain.
   */
  const rememberJobDetail = useCallback((job: RobotsJob) => {
    setJobDetails((previous) => (previous[job.id] ? previous : { ...previous, [job.id]: job }));
  }, []);

  const detailedJobIds = useMemo(() => new Set(Object.keys(jobDetails)), [jobDetails]);

  // No client means no jobs: every job here came from a read or a create through it.
  const pendingDetailIds = useMemo(() => {
    const attempted = new Set([...Object.keys(jobDetails), ...failedDetailIds]);
    return new Set(jobsAwaitingDetail(jobs, attempted).map((job) => job.id));
  }, [jobs, jobDetails, failedDetailIds]);

  return {
    enrichedJobs,
    detailedJobIds,
    failedDetailIds,
    loadingDetailIds,
    pendingDetailIds,
    loadJobDetail,
    rememberJobDetail,
  };
}
