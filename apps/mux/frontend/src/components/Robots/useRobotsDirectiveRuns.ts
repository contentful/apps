import { useCallback, useMemo, useRef, useState } from 'react';
import { MuxApiService } from '../../util/muxApi';
import { RobotsDirectiveRunRef, activeDirectiveRuns } from '../../util/robots';
import { RobotsDirectiveRun, RobotsDirectiveRunRecord } from '../../util/robotsTypes';

/**
 * The directive runs on this asset.
 *
 * Found two ways, and neither is "every directive in the account". The runs endpoint cannot
 * filter by asset (ADR-0009), so the directives this entry has a reason to know about are listed
 * and narrowed by `subject_id`. A run of any other directive — one started in Mux on an imported
 * video, say — is read by id from the jobs on this asset that name it, so what that costs is
 * bounded by the asset's own jobs.
 */
export interface RobotsDirectiveRunsState {
  /** Every run to show and to poll: the listed ones, and the ones this asset's jobs name. */
  directiveRuns: RobotsDirectiveRun[];
  loadDirectiveRuns: () => Promise<void>;
  /** For the optimistic row a create adds, which is what arms the poll from the moment of a click. */
  addDirectiveRun: (run: RobotsDirectiveRun) => void;
  /**
   * The current set of directives and named runs has not been read once yet, so an empty
   * `directiveRuns` is not yet an answer. Later re-reads of the same set do not bring it back.
   */
  isPending: boolean;
}

const byNewestStart = (a: RobotsDirectiveRun, b: RobotsDirectiveRun) =>
  (b.started_at ?? 0) - (a.started_at ?? 0);

export function useRobotsDirectiveRuns({
  muxApi,
  assetId,
  defaultDirectiveIds,
  recordedRuns,
  pendingDirectiveIds,
  runsNamedByJobs,
  isMountedRef,
}: {
  muxApi?: MuxApiService;
  /** Required: the panel does not mount without an asset, and remounts when it changes. */
  assetId: string;
  defaultDirectiveIds: string[];
  /** Runs the entry itself records, so a directive dropped from the config is still polled. */
  recordedRuns?: RobotsDirectiveRunRecord[];
  /** Directives with a run create pending on the entry, so the run can be found. */
  pendingDirectiveIds: string[];
  /** Runs the jobs on this asset name. See `directiveRunRefsFromJobs`. */
  runsNamedByJobs: RobotsDirectiveRunRef[];
  isMountedRef: React.MutableRefObject<boolean>;
}): RobotsDirectiveRunsState {
  /** Runs of the directives below, plus the optimistic row a create adds. */
  const [listedRuns, setListedRuns] = useState<RobotsDirectiveRun[]>([]);
  /** Runs read by id because a job named them. Never feeds the directive set below. */
  const [namedRuns, setNamedRuns] = useState<RobotsDirectiveRun[]>([]);
  /** The set the last finished pass read, whether or not every call in it succeeded. */
  const [settledKey, setSettledKey] = useState<string | undefined>();
  /** One pass at a time: overlapping passes resolve out of order and the loser wins. */
  const isLoadingRef = useRef(false);
  /** What the running pass covers, so a request for something else waits instead of vanishing. */
  const inFlightKeyRef = useRef<string | undefined>();
  const isQueuedRef = useRef(false);
  const listedRunsRef = useRef(listedRuns);
  listedRunsRef.current = listedRuns;
  const namedRunsRef = useRef(namedRuns);
  namedRunsRef.current = namedRuns;

  /** Directives this entry has actually seen a run from, whatever the config says today. */
  const recordedDirectiveIds = useMemo(
    () => (recordedRuns ?? []).map((run) => run.directiveId).filter(Boolean),
    [recordedRuns]
  );
  const liveDirectiveIds = useMemo(
    () => listedRuns.map((run) => run.directive_id).filter((id): id is string => !!id),
    [listedRuns]
  );

  /**
   * Every directive worth listing, as one stable string: the ones configured to run at ingest,
   * the ones this entry records a run from, the ones with a run create pending, and the ones
   * already on screen. Not the account's — that would cost one round trip per directive in it
   * (ADR-0009).
   *
   * Sorted and joined because the identity matters: `loadDirectiveRuns` is a dependency of the
   * poll effect, so a set that merely re-orders would re-arm the 6 s timer before it ever fired.
   */
  const directiveIdKey = useMemo(
    () =>
      Array.from(
        new Set([
          ...defaultDirectiveIds,
          ...recordedDirectiveIds,
          ...pendingDirectiveIds,
          ...liveDirectiveIds,
        ])
      )
        .sort()
        .join(','),
    [defaultDirectiveIds, recordedDirectiveIds, pendingDirectiveIds, liveDirectiveIds]
  );
  /** The runs this asset's jobs name, stable for the same reason. */
  const namedRunKey = useMemo(
    () =>
      runsNamedByJobs
        .map((ref) => `${ref.directiveId}/${ref.runId}`)
        .sort()
        .join(','),
    [runsNamedByJobs]
  );

  const loadDirectiveRuns = useCallback(async () => {
    if (!muxApi) return;
    const directiveIds = directiveIdKey ? directiveIdKey.split(',') : [];
    const refs = namedRunKey
      ? namedRunKey.split(',').map((key) => {
          const [directiveId, runId] = key.split('/');
          return { directiveId, runId };
        })
      : [];
    if (directiveIds.length === 0 && refs.length === 0) return;

    const passKey = `${directiveIdKey}|${namedRunKey}`;
    if (isLoadingRef.current) {
      // A job's detail — where a named run comes from — routinely lands while the first pass is
      // still reading. Dropping that request left the run unread until something else asked.
      if (passKey !== inFlightKeyRef.current) isQueuedRef.current = true;
      return;
    }
    isLoadingRef.current = true;
    inFlightKeyRef.current = passKey;

    try {
      const listed = await Promise.all(
        directiveIds.map(async (directiveId) => {
          try {
            const response = await muxApi.listRobotsDirectiveRuns(directiveId, { limit: 25 });
            const runs = (response.data ?? [])
              // `subject_id`, not `asset_id` — the webhook payload's name for the same value
              // matches nothing here, which is what left this table empty forever.
              .filter((run) => run.subject_id === assetId)
              .map((run) => ({ ...run, directive_id: directiveId }));

            // `node_states` is normally on the list response; this is the fallback. It is what the
            // runs table's steps and the run record's `jobIds` come from.
            return Promise.all(
              runs.map(async (run) => {
                if (run.node_states) return run;
                try {
                  const full = await muxApi.getRobotsDirectiveRun(directiveId, run.run_id);
                  return full.data ? { ...full.data, directive_id: directiveId } : run;
                } catch (error) {
                  console.error(`[robots] Could not load directive run ${run.run_id}`, error);
                  return run;
                }
              })
            );
          } catch (error) {
            console.error(`[robots] Could not list runs for directive ${directiveId}`, error);
            return undefined;
          }
        })
      );
      if (!isMountedRef.current) return;

      // A directive whose read failed keeps what was last known about it. Replacing it with
      // nothing reads as "the run finished", and the poll loop is gated on this list — so one bad
      // tick would end the loop.
      const nextListed = (previous: RobotsDirectiveRun[]) =>
        listed
          .flatMap(
            (runs, index) =>
              runs ?? previous.filter((run) => run.directive_id === directiveIds[index])
          )
          .sort(byNewestStart);

      // Read by id only what the listing does not already hold and has not finished: a finished
      // run never changes, and a live one is re-read at the cadence the listing polls at.
      const listedIds = new Set(nextListed(listedRunsRef.current).map((run) => run.run_id));
      const settledIds = new Set(
        namedRunsRef.current
          .filter((run) => activeDirectiveRuns([run]).length === 0)
          .map((run) => run.run_id)
      );
      const read = await Promise.all(
        refs
          .filter((ref) => !listedIds.has(ref.runId) && !settledIds.has(ref.runId))
          .map(async ({ directiveId, runId }): Promise<RobotsDirectiveRun | undefined> => {
            try {
              const response = await muxApi.getRobotsDirectiveRun(directiveId, runId);
              const run = response.data;
              // Checked, not assumed: a run on another asset is not this video's.
              return run?.run_id && run.subject_id === assetId
                ? { ...run, directive_id: directiveId }
                : undefined;
            } catch (error) {
              console.error(`[robots] Could not load directive run ${runId}`, error);
              return undefined;
            }
          })
      );
      if (!isMountedRef.current) return;

      setListedRuns(nextListed);
      setNamedRuns((previous) => {
        const fresh = read.filter((run): run is RobotsDirectiveRun => !!run);
        const freshIds = new Set(fresh.map((run) => run.run_id));
        // A run not re-read — finished, or its read failed — keeps what was last known, for the
        // same reason as a failed listing.
        return [...fresh, ...previous.filter((run) => !freshIds.has(run.run_id))];
      });
    } finally {
      isLoadingRef.current = false;
      inFlightKeyRef.current = undefined;
      if (isMountedRef.current) setSettledKey(passKey);
      if (isQueuedRef.current && isMountedRef.current) {
        isQueuedRef.current = false;
        void loadRef.current?.();
      }
    }
  }, [muxApi, assetId, directiveIdKey, namedRunKey, isMountedRef]);

  const loadRef = useRef<typeof loadDirectiveRuns>();
  loadRef.current = loadDirectiveRuns;

  const addDirectiveRun = useCallback((run: RobotsDirectiveRun) => {
    setListedRuns((previous) => [
      run,
      ...previous.filter((existing) => existing.run_id !== run.run_id),
    ]);
  }, []);

  const directiveRuns = useMemo(() => {
    const listedIds = new Set(listedRuns.map((run) => run.run_id));
    return [...listedRuns, ...namedRuns.filter((run) => !listedIds.has(run.run_id))].sort(
      byNewestStart
    );
  }, [listedRuns, namedRuns]);

  // Nothing to read is an answer already: no directive this entry has any tie to.
  const hasSomethingToRead = !!muxApi && (directiveIdKey !== '' || namedRunKey !== '');
  const isPending = hasSomethingToRead && settledKey !== `${directiveIdKey}|${namedRunKey}`;

  return { directiveRuns, loadDirectiveRuns, addDirectiveRun, isPending };
}
