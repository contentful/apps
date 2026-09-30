import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  Flex,
  Note,
  Select,
  Skeleton,
  Subheading,
  Text,
  Tooltip,
} from '@contentful/f36-components';
import { CycleIcon } from '@contentful/f36-icons';
import { MuxApiError, MuxApiService } from '../../util/muxApi';
import {
  LocalPendingCreate,
  PendingCreatePhase,
  PendingCreateRow,
  ROBOTS_CREATE_CONFIRM_GRACE_S,
  ROBOTS_DOCS_URL,
  ROBOTS_POLL_INTERVAL_MS,
  ROBOTS_UNCONFIRMED_RECHECK_TICKS,
  activeDirectiveRuns,
  activeJobs,
  addPendingCreate,
  advisoryFromError,
  applyRobotsDirectiveRunsToValue,
  applyRobotsJobsToValue,
  cachedRobotsCapability,
  capabilityFromError,
  directiveRunRefsFromJobs,
  freshPendingCreates,
  newPendingDirectiveRunCreate,
  newPendingJobCreate,
  pendingCreateRows,
  pendingCreatesOf,
  removePendingCreates,
  resolvePendingCreatesFromReads,
  resolvePendingDirectiveRunCreate,
  resolvePendingJobCreate,
  startRobotsDirectiveRun,
  startRobotsJob,
  unfinishedJobRecords,
} from '../../util/robots';
import { workflowLabel } from '../../util/robotsCatalog';
import {
  RobotsAdvisory,
  RobotsDirective,
  RobotsDirectiveRun,
  RobotsJob,
  RobotsPendingCreate,
  RobotsWorkflow,
} from '../../util/robotsTypes';
import { MuxContentfulObject, Track } from '../../util/types';
import ExternalLink from '../ExternalLink';
import RobotsAdminsOnlyNote from './RobotsAdminsOnlyNote';
import RobotsCapabilityNote from './RobotsCapabilityNote';
import RobotsJobTable from './RobotsJobTable';
import RobotsRunModal from './RobotsRunModal';
import RobotsOutputViewer from './RobotsOutputViewer';
import RobotsDirectiveRunTable from './RobotsDirectiveRunTable';
import RobotsUnconfirmedNote from './RobotsUnconfirmedNote';
import ApplyToEntryModal from './ApplyToEntryModal';
import { useRobotsDirectiveRuns } from './useRobotsDirectiveRuns';
import { directiveNamesById } from './useRobotsDirectiveNames';
import { useRobotsJobDetails } from './useRobotsJobDetails';
import { useRobotsJobList } from './useRobotsJobList';

/**
 * The Robots tab.
 *
 * **It does nothing until the tab is looked at.** `isActive` gates the first fetch, so opening an
 * entry costs no round trips for a feature the editor may never touch. It does *not* gate the poll
 * loop: switching to the Captions tab to wait for a job must not be what stops it being noticed.
 *
 * **It never writes the field directly.** Every change goes through `updateField`, the single
 * serialized write path on the App component, so this loop and the 500 ms asset poll cannot
 * clobber each other. See ADR-0001.
 *
 * **It records what it reads.** Every Robots job listed for the asset is recorded on the entry,
 * whoever started it, with the newest summary and moderation output. See ADR-0005.
 *
 * **Neither Run button offers a retry it cannot justify.** Both creates are billable and neither
 * API has an idempotency key, so each create is guarded by a placeholder saved on the entry before
 * anything is sent, and shown as a row in its table until the job or run replaces it. A read that
 * finds the job resolves it; nothing time-based does, and the editor's "nothing is running" button
 * stays the last resort. See ADR-0003.
 */

interface RobotsPanelProps {
  sdk: FieldExtensionSDK;
  muxApi?: MuxApiService;
  value?: MuxContentfulObject;
  /** True while this tab is the selected one. */
  isActive: boolean;
  updateField: (
    mutate: (current: MuxContentfulObject | undefined) => MuxContentfulObject | undefined,
    // Inline rather than `UpdateFieldOptions`: importing from `index.tsx` would be a cycle.
    options?: { save?: boolean; onParked?: () => void; flushOnUnmount?: boolean }
  ) => Promise<void>;
  /** Re-reads the Mux asset, for workflows that attach a track. */
  resync: (params?: { silent?: boolean; skipPlayerResync?: boolean }) => Promise<void>;
  /** Directives configured at install time, offered for ad-hoc runs. */
  defaultDirectiveIds: string[];
  /** Whether the controls that start or cancel a run render. Results show either way. */
  canRunRobots: boolean;
}

type DirectiveListing =
  | { status: 'pending' }
  | { status: 'loaded'; directives: RobotsDirective[] }
  | { status: 'failed' };

/**
 * The asset gate, and it is a gate rather than an early return inside the panel.
 *
 * Everything this tab knows — the job list, the detail cache, the directive runs, the creates it is
 * making — is *about one Mux asset*. Returning early from a component that has already
 * run its hooks leaves all of that alive and invisible: with no asset the panel would hold a job
 * list for a video that no longer exists, and on the next asset it would hold the *previous* one's.
 * That second case is the reachable one. Pasting a different Mux asset ID replaces the whole value
 * (ADR-0001) without unmounting this panel, and the persist effect would then merge the old
 * asset's job records onto the new asset's entry. The mutators are asset-gated as well, for a write
 * queued before the swap and applied after it.
 *
 * So: no asset, no component. And `key` on the asset id, so an asset swap is a remount and no
 * state can cross between two videos.
 */
const RobotsPanel: FC<RobotsPanelProps> = (props) => {
  const assetId = props.value?.assetId;

  if (!assetId) {
    return (
      <Box marginTop="spacingM">
        <Note variant="neutral">Add a video before running Robots workflows.</Note>
      </Box>
    );
  }

  return <RobotsPanelForAsset key={assetId} {...props} assetId={assetId} />;
};

const RobotsPanelForAsset: FC<RobotsPanelProps & { assetId: string }> = ({
  sdk,
  muxApi,
  value,
  isActive,
  updateField,
  resync,
  defaultDirectiveIds,
  canRunRobots,
  assetId,
}) => {
  /**
   * The account's directives, for the picker. `failed` is the only state that falls back to the
   * configured ids: those come from installation parameters the web app handed this iframe when
   * it loaded, and can name a directive that has since been deleted or replaced (ADR-0009).
   */
  const [directiveListing, setDirectiveListing] = useState<DirectiveListing>({ status: 'pending' });
  const [selectedDirectiveId, setSelectedDirectiveId] = useState('');
  const [cancellingIds, setCancellingIds] = useState<string[]>([]);
  const [isRunModalShown, setIsRunModalShown] = useState(false);
  const [isApplyModalShown, setIsApplyModalShown] = useState(false);
  const [viewedJob, setViewedJob] = useState<RobotsJob | undefined>();
  /** This tab's own creates, one per kind, while they are being made. See `pendingCreateRows`. */
  const [localJobCreate, setLocalJobCreate] = useState<LocalPendingCreate | undefined>();
  const [localRunCreate, setLocalRunCreate] = useState<LocalPendingCreate | undefined>();
  /** Creates this tab settled — refused, withdrawn, cleared — whose removal may still wait. */
  const [settledRequestIds, setSettledRequestIds] = useState<ReadonlySet<string>>(() => new Set());
  /** Re-renders when a stored placeholder crosses the grace period, to relabel its row. */
  const [graceTick, setGraceTick] = useState(0);
  /**
   * A limit a refused run ran into — units, today. Shown over the tab rather than instead of it,
   * because a cheaper run may still fit, and cleared by the next run Mux accepts: nothing else is
   * evidence either way, since only a create is checked against the units left.
   */
  const [advisory, setAdvisory] = useState<RobotsAdvisory | undefined>();

  const isMountedRef = useRef(true);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout>>();
  /** Completed jobs that have already triggered a resync. */
  const resyncedJobIdsRef = useRef<Set<string>>(new Set());
  /**
   * Jobs this session has seen running.
   *
   * What separates "a job finished while the editor was watching" from "this entry has finished
   * jobs in its history". Only the first should reload the player; the second is every time
   * anyone opens this tab on an old entry.
   */
  const seenRunningJobIdsRef = useRef<Set<string>>(new Set());
  /** How many poll ticks each kind of pending create has already been looked for on. */
  const createRecheckTicksRef = useRef(0);
  const directiveRecheckTicksRef = useRef(0);
  /** Pending creates this tab has seen, so one arriving from another tab gets a full budget. */
  const seenRequestIdsRef = useRef<Set<string>>(new Set());
  /** Request id → the job or run id its create response named, for creates made in this tab. */
  const createdForRequestRef = useRef<Map<string, string>>(new Map());
  /** The create each Run button is making, read synchronously: two confirms in one frame start one. */
  const startingJobRef = useRef<string>();
  const startingDirectiveRef = useRef<string>();
  /** Creates withdrawn with "Don't start" while their placeholder waited behind a publish. */
  const withdrawnRef = useRef<Set<string>>(new Set());
  /** What the session already knew about Robots before this panel read anything. */
  const cachedCapabilityRef = useRef(cachedRobotsCapability());
  /** So the picker's names are fetched once per asset rather than on every activation. */
  const hasLoadedDirectivesRef = useRef(false);

  useEffect(
    () => () => {
      isMountedRef.current = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    },
    []
  );

  const captions = useMemo(() => (value?.captions ?? []) as Track[], [value?.captions]);
  const audioTracks = useMemo(() => (value?.audioTracks ?? []) as Track[], [value?.audioTracks]);

  /**
   * Whether this entry already records a job that has not finished.
   *
   * Read from the stored value, so it costs nothing and is known on the first render — before
   * anything has been fetched, and without anybody opening this tab. See ADR-0013.
   */
  const hasUnfinishedJobs = useMemo(
    () => unfinishedJobRecords(value).length > 0,
    [value?.robotsJobs]
  );
  /** The same for a create saved on the entry and not resolved yet, on the same six-hour bound. */
  const hasFreshPendingCreates = useMemo(
    () => freshPendingCreates(value).length > 0,
    [value?.robotsPendingCreates]
  );
  /**
   * The job creates this entry is waiting on, read from the stored value: they survive a reload
   * and reach every open tab. Run stays blocked while there is one.
   */
  const jobCreates = useMemo(
    () => pendingCreatesOf(value).filter((pending) => pending.kind === 'job'),
    [value?.robotsPendingCreates]
  );
  /** The same for directive runs. */
  const runCreates = useMemo(
    () =>
      pendingCreatesOf(value).flatMap((pending) =>
        pending.kind === 'directive-run' ? [pending] : []
      ),
    [value?.robotsPendingCreates]
  );
  /** Listed whether or not they are configured, so their runs can be found. */
  const pendingDirectiveIds = useMemo(
    () => runCreates.map((pending) => pending.directiveId),
    [runCreates]
  );

  /**
   * A completed job may have changed the Mux asset, so the mirror is stale.
   *
   * Every workflow, not just the four that attach a track: `summarize` with `update_asset_meta`,
   * `find-best-thumbnails` with `update_asset_thumbnail` and `moderate` with
   * `on_flagged: delete_playback_ids` all write to the asset too.
   *
   * The player is only reloaded for a job that finished under the editor's nose — otherwise
   * opening this tab on an entry with job history would restart whatever they were watching.
   */
  const resyncForFinishedJobs = useCallback(
    async (fetched: RobotsJob[]) => {
      const needsResync = fetched.filter(
        (job) => job.status === 'completed' && !resyncedJobIdsRef.current.has(job.id)
      );
      const finishedWhileWatching = needsResync.some((job) =>
        seenRunningJobIdsRef.current.has(job.id)
      );
      for (const job of fetched) {
        if (job.status !== 'completed' && job.status !== 'errored' && job.status !== 'cancelled') {
          seenRunningJobIdsRef.current.add(job.id);
        }
      }
      if (needsResync.length === 0) return;
      for (const job of needsResync) resyncedJobIdsRef.current.add(job.id);
      await resync({ silent: true, skipPlayerResync: !finishedWhileWatching });
    },
    [resync]
  );

  const {
    jobs,
    capability,
    isLoading,
    setIsLoading,
    loadError,
    hasLoadedOnce,
    pollNonce,
    refresh,
    addCreatedJob,
  } = useRobotsJobList({ muxApi, assetId, onJobsFetched: resyncForFinishedJobs, isMountedRef });

  const {
    enrichedJobs,
    detailedJobIds,
    failedDetailIds,
    loadingDetailIds,
    pendingDetailIds,
    loadJobDetail,
    rememberJobDetail,
  } = useRobotsJobDetails(muxApi, jobs, isMountedRef);

  /** The runs this asset's jobs name, which is how a run started outside Contentful is found. */
  const runsNamedByJobs = useMemo(() => directiveRunRefsFromJobs(enrichedJobs), [enrichedJobs]);

  const {
    directiveRuns,
    loadDirectiveRuns,
    addDirectiveRun,
    isPending: areDirectiveRunsPending,
  } = useRobotsDirectiveRuns({
    muxApi,
    assetId,
    defaultDirectiveIds,
    recordedRuns: value?.robotsDirectiveRuns,
    pendingDirectiveIds,
    runsNamedByJobs,
    isMountedRef,
  });

  const loadDirectives = useCallback(async () => {
    if (!muxApi) return;
    try {
      const response = await muxApi.listRobotsDirectives({ limit: 100 });
      if (isMountedRef.current) {
        setDirectiveListing({ status: 'loaded', directives: response.data ?? [] });
      }
    } catch (error) {
      // Not worth blocking the tab over. A re-list that fails keeps the listing it had; only a
      // first one falls back to the ids configured at install.
      console.error('[robots] Could not list directives', error);
      if (isMountedRef.current) {
        setDirectiveListing((previous) =>
          previous.status === 'loaded' ? previous : { status: 'failed' }
        );
      }
    }
  }, [muxApi]);

  /**
   * First activation.
   *
   * Everything here is one app-action round trip, which is two CMA requests and a function that
   * may cold-start, so what matters is how many of them are *serialized*. There used to be three
   * in a row before the table could paint: a capability probe, then the job list, then the
   * directive list. Two of those are gone.
   *
   * The probe was `listRobotsJobs({ limit: 1 })` — the same call as the read below, with its
   * result thrown away. `refresh` already reports capability both ways (a successful list *is*
   * the check, and a 401/403 becomes the right `RobotsCapabilityNote`), so the real read answers
   * the question and the probe was a round trip spent learning something the next one would say.
   * The per-session cache it existed for is unchanged — `refresh` fills it now.
   *
   * What is left is one parallel pass: the job list and the directive runs together, and the
   * directive listing beside them once Robots is known to be on. An install that never enabled
   * Robots configures no directives, so neither of the other two makes a call there and the
   * non-enabled case still costs exactly one failed request. The table paints when the list
   * answers — the asset resync it sets off is not awaited (see `useRobotsJobList`).
   */
  useEffect(() => {
    // `isActive` is what keeps Robots free for editors who never open this tab — but an entry
    // reopened while a job is still running, or a create is still unresolved, has to pick the loop
    // back up on its own, or a publish re-publishes the stale record. Only entries that already
    // hold one qualify, so an install that has never run Robots still fetches nothing.
    if ((!isActive && !hasUnfinishedJobs && !hasFreshPendingCreates) || !muxApi || hasLoadedOnce) {
      return;
    }
    // Already answered, for this whole browser session: an account without the `robots:*` scope
    // does not acquire it between two entries, and asking again per entry is what the session
    // cache exists to prevent. This is the one place that reads it, because it is the only place
    // that would otherwise spend a request on a question with a known answer.
    //
    // From a ref captured at mount, not from the `capability` state. React 17 does not batch the
    // two `setState`s the fetch makes across its `await`, so `setCapability('enabled')` renders
    // before `setHasLoadedOnce(true)` does — and a `capability` dependency here would re-enter
    // this effect in that gap, with `hasLoadedOnce` still false, and fetch everything twice.
    if (cachedCapabilityRef.current && cachedCapabilityRef.current.state !== 'enabled') return;

    setIsLoading(true);
    void Promise.all([refresh({ silent: true }), loadDirectiveRuns()]);
  }, [
    isActive,
    hasUnfinishedJobs,
    hasFreshPendingCreates,
    muxApi,
    hasLoadedOnce,
    refresh,
    loadDirectiveRuns,
    setIsLoading,
  ]);

  useEffect(() => {
    // Only after the first load — otherwise this races it and both fetch the same runs.
    if (!isActive || capability?.state !== 'enabled' || !hasLoadedOnce) return;
    loadDirectiveRuns();
  }, [isActive, capability?.state, hasLoadedOnce, loadDirectiveRuns]);

  /**
   * The directive listing, for the picker.
   *
   * Off the path to the job table, and in parallel with it once Robots is known to be on: from
   * the session cache, or because directives are configured, which an install without Robots
   * never has. Otherwise it waits for the list read to answer, so a non-Robots install still
   * costs one request per session (ADR-0006).
   */
  const isKnownEnabled = capability?.state === 'enabled';
  const mayListDirectives = isKnownEnabled || (!capability && defaultDirectiveIds.length > 0);
  useEffect(() => {
    if (!isActive || !mayListDirectives) return;
    if (hasLoadedDirectivesRef.current) return;
    hasLoadedDirectivesRef.current = true;
    loadDirectives();
  }, [isActive, mayListDirectives, loadDirectives]);

  /** The newest reads, for the persist mutator to apply against. See the effect below. */
  const latestPersistInputRef = useRef<{
    jobs: RobotsJob[];
    runs: RobotsDirectiveRun[];
    links: ReadonlyMap<string, string>;
  }>({ jobs: [], runs: [], links: createdForRequestRef.current });

  /**
   * Persist whatever the latest read says.
   *
   * Re-running is free when there is nothing new: the mutators hand back the identical value and
   * `updateField` drops writes that would change nothing.
   */
  useEffect(() => {
    if (enrichedJobs.length === 0 && directiveRuns.length === 0) return;
    latestPersistInputRef.current = {
      jobs: enrichedJobs,
      runs: directiveRuns,
      links: createdForRequestRef.current,
    };
    updateField((current) => {
      // Read at apply time, not at effect time. A write parked behind the publish gate re-applies
      // up to 90 s later, and `mergeJobRecords` lets an incoming record win — so a mutator holding
      // the snapshot from the tick it was queued on would write a stale `processing` over a stored
      // `completed`. The ref always holds the newest read, so a replay is idempotent.
      const { jobs: latestJobs, runs, links } = latestPersistInputRef.current;
      // Placeholders first: a job already recorded can no longer resolve one (ADR-0003). Runs
      // are only updated here; a run is added at creation, or by resolving its placeholder.
      const resolved = resolvePendingCreatesFromReads(current, latestJobs, runs, assetId, links);
      return applyRobotsJobsToValue(
        applyRobotsDirectiveRunsToValue(resolved, runs),
        latestJobs,
        assetId
      );
    }).catch((error) => {
      // Not awaited: this runs on the poll loop and must not block it. A write parked behind the
      // publish gate and then dropped at unmount rejects, and the next poll re-derives it.
      console.warn('[robots] Could not persist the latest job state', error);
    });
  }, [enrichedJobs, directiveRuns, updateField, assetId]);

  const inFlight = useMemo(() => activeJobs(enrichedJobs), [enrichedJobs]);
  /**
   * Directive runs that may still dispatch more work.
   *
   * Not redundant with `inFlight`: a directive runs its workflows in sequence, so there is a
   * legitimate gap with zero non-terminal jobs between one finishing and the next starting.
   * Stopping there is what made mid-sequence jobs invisible until a reload.
   */
  const activeRuns = useMemo(() => activeDirectiveRuns(directiveRuns), [directiveRuns]);

  /** A create this tab has not seen before, from another tab say, gets a full tick budget. */
  useEffect(() => {
    for (const pending of [...jobCreates, ...runCreates]) {
      if (seenRequestIdsRef.current.has(pending.requestId)) continue;
      seenRequestIdsRef.current.add(pending.requestId);
      if (pending.kind === 'job') createRecheckTicksRef.current = 0;
      else directiveRecheckTicksRef.current = 0;
    }
  }, [jobCreates, runCreates]);

  /**
   * A stored placeholder this tab is not making reads as starting, then as not confirmed once
   * `ROBOTS_CREATE_CONFIRM_GRACE_S` has passed. One timer, for the next such moment. It changes a
   * label and brings the note in, never Run.
   */
  useEffect(() => {
    const nowS = Date.now() / 1000;
    const localIds = [localJobCreate?.pending.requestId, localRunCreate?.pending.requestId];
    const untilCrossings = [...jobCreates, ...runCreates]
      .filter(
        (pending) =>
          !localIds.includes(pending.requestId) && !settledRequestIds.has(pending.requestId)
      )
      .map((pending) => pending.requestedAt + ROBOTS_CREATE_CONFIRM_GRACE_S - nowS)
      .filter((seconds) => seconds > 0);
    if (untilCrossings.length === 0) return;
    const timer = setTimeout(
      () => setGraceTick((tick) => tick + 1),
      Math.ceil(Math.min(...untilCrossings) * 1000)
    );
    return () => clearTimeout(timer);
  }, [jobCreates, runCreates, localJobCreate, localRunCreate, settledRequestIds, graceTick]);

  /**
   * Poll while anything is live — on any tab.
   *
   * `isActive` gates the *first* load, which is what keeps Robots free for editors who never open
   * this tab. Gating the loop as well stopped the thing the loop exists for: a completed job is
   * what triggers `resync`, and the natural thing to do after starting `edit-captions` is to go
   * and watch the Captions tab. The panel is `forceMount`ed for this same reason.
   */
  useEffect(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = undefined;
    }
    if (capability?.state !== 'enabled') return;
    if (!hasLoadedOnce) return;
    // A pending create keeps the loop ticking with nothing in flight, so its job or run can be
    // found; bounded by a count of ticks, never a clock. What the bound ends is the looking: the
    // placeholder still blocks Run (ADR-0003).
    const isRecheckingCreate =
      jobCreates.length > 0 && createRecheckTicksRef.current < ROBOTS_UNCONFIRMED_RECHECK_TICKS;
    const isRecheckingDirectiveRun =
      runCreates.length > 0 && directiveRecheckTicksRef.current < ROBOTS_UNCONFIRMED_RECHECK_TICKS;
    if (
      inFlight.length === 0 &&
      activeRuns.length === 0 &&
      !isRecheckingCreate &&
      !isRecheckingDirectiveRun
    ) {
      return;
    }

    pollTimerRef.current = setTimeout(() => {
      if (jobCreates.length > 0) createRecheckTicksRef.current += 1;
      if (runCreates.length > 0) directiveRecheckTicksRef.current += 1;
      refresh({ silent: true });
      // Re-read the runs only while one is live or one is being looked for: it costs a call per
      // directive, and it is the only way an active run is ever seen to finish.
      if (activeRuns.length > 0 || isRecheckingDirectiveRun) loadDirectiveRuns();
    }, ROBOTS_POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [
    capability?.state,
    hasLoadedOnce,
    inFlight.length,
    activeRuns.length,
    jobCreates.length,
    runCreates.length,
    pollNonce,
    refresh,
    loadDirectiveRuns,
  ]);

  /**
   * What a refused create means beyond the run it refused. Never a capability: Mux refuses
   * `translate-audio` on the free plan while every other workflow runs, so a create is no answer
   * about the account. A refusal that could mean the account lost Robots asks the list read, which
   * is what decides that; one about units becomes the warning.
   */
  const noteRefusal = (error: MuxApiError) => {
    const refusedFor = advisoryFromError(error);
    if (refusedFor) setAdvisory(refusedFor);
    else if (capabilityFromError(error)) void refresh({ silent: true });
  };

  /** Sets the phase of this tab's own create, if it still holds that create. */
  const setLocalPhase = (requestId: string, phase: PendingCreatePhase) => {
    if (!isMountedRef.current) return;
    const update = (local?: LocalPendingCreate) =>
      local?.pending.requestId === requestId ? { ...local, phase } : local;
    setLocalJobCreate(update);
    setLocalRunCreate(update);
  };

  const dropLocal = (requestId: string) => {
    if (!isMountedRef.current) return;
    const drop = (local?: LocalPendingCreate) =>
      local?.pending.requestId === requestId ? undefined : local;
    setLocalJobCreate(drop);
    setLocalRunCreate(drop);
  };

  /** Hides these rows and gives Run back at once, even while their removal waits behind a publish. */
  const settle = (requestIds: string[]) => {
    if (!isMountedRef.current || requestIds.length === 0) return;
    setSettledRequestIds((previous) => new Set([...previous, ...requestIds]));
    requestIds.forEach(dropLocal);
  };

  const removePlaceholders = (requestIds: string[]) =>
    updateField(
      (current) => removePendingCreates(current, (entry) => requestIds.includes(entry.requestId)),
      { save: true }
    ).catch((error) => console.error('[robots] Could not remove a settled placeholder', error));

  /**
   * Saves the placeholder for a create, and says whether to send it. No durable guard, no spend:
   * nothing is sent if the save fails, if the editor withdrew the create while the save waited
   * behind a publish, or if the panel has gone. A save still parked when the editor closes is
   * dropped rather than flushed, because a closing editor sends nothing (ADR-0003, ADR-0010).
   */
  const savePlaceholder = async (pending: RobotsPendingCreate): Promise<boolean> => {
    const isWithdrawn = () => withdrawnRef.current.has(pending.requestId);
    try {
      await updateField(
        (current) => (isWithdrawn() ? current : addPendingCreate(current, pending, assetId)),
        {
          save: true,
          flushOnUnmount: false,
          onParked: () => setLocalPhase(pending.requestId, 'waiting-for-publish'),
        }
      );
    } catch (error) {
      dropLocal(pending.requestId);
      if (isWithdrawn()) return false;
      console.error('[robots] Could not record a run on the entry before starting it', error);
      sdk.notifier.error('Could not record this run on the entry, so it was not started.');
      return false;
    }
    if (isWithdrawn() || !isMountedRef.current) {
      void removePlaceholders([pending.requestId]);
      dropLocal(pending.requestId);
      return false;
    }
    setLocalPhase(pending.requestId, 'sending');
    return true;
  };

  /** Mux said no: nothing started, so the placeholder has nothing left to guard. */
  const settleRefusal = (
    pending: RobotsPendingCreate,
    error: MuxApiError,
    alreadyRunning: string,
    reread: () => void
  ) => {
    settle([pending.requestId]);
    void removePlaceholders([pending.requestId]);
    if (!isMountedRef.current) return;
    if (error.status === 409) {
      sdk.notifier.warning(alreadyRunning);
      reread();
    } else {
      sdk.notifier.error(error.message);
      noteRefusal(error);
    }
  };

  /** The created job or run replaces its placeholder. A failure is logged, never a failed run. */
  const recordCreated = (
    mutate: (current?: MuxContentfulObject) => MuxContentfulObject | undefined
  ) =>
    updateField(mutate, { save: true }).catch((error) =>
      console.error('[robots] Started a run but could not record it on the entry', error)
    );

  /** Withdraws a create whose placeholder is still waiting behind a publish. Nothing was sent. */
  const handleDontStart = (requestId: string) => {
    withdrawnRef.current.add(requestId);
    if (startingJobRef.current === requestId) startingJobRef.current = undefined;
    if (startingDirectiveRef.current === requestId) startingDirectiveRef.current = undefined;
    settle([requestId]);
  };

  /** "Nothing is running": clears exactly the placeholders the note names. */
  const clearUnconfirmed = (rows: PendingCreateRow[]) => {
    const named = rows.map((row) => row.pending.requestId);
    settle(named);
    void removePlaceholders(named);
  };

  /**
   * Starts a workflow. The modal has already closed; the job table shows the run from here on.
   * See ADR-0003.
   */
  const handleRun = async (workflow: RobotsWorkflow, parameters: Record<string, unknown>) => {
    if (!muxApi || startingJobRef.current) return;
    const pending = newPendingJobCreate(workflow);
    startingJobRef.current = pending.requestId;
    setLocalJobCreate({ pending, phase: 'saving' });

    try {
      if (!(await savePlaceholder(pending))) return;

      let job: RobotsJob;
      try {
        job = await startRobotsJob(muxApi, workflow, parameters);
      } catch (error) {
        if (error instanceof MuxApiError && error.muxAnswered) {
          settleRefusal(
            pending,
            error,
            'This workflow is already running on this video with the same settings.',
            () => void refresh({ silent: true })
          );
          return;
        }
        // Unknown: it may be running and billing. The placeholder stays and the loop looks.
        if (!isMountedRef.current) return;
        setLocalPhase(pending.requestId, 'unconfirmed');
        createRecheckTicksRef.current = 0;
        sdk.notifier.warning(
          `Mux has not answered about the ${workflowLabel(
            workflow
          )} run yet. The Robots tab keeps checking.`
        );
        void refresh({ silent: true });
        return;
      }

      // In this order, so the job is on screen before anything removes its pending row.
      createdForRequestRef.current.set(pending.requestId, job.id);
      // Now rather than at the first list read, which a fast job could beat.
      seenRunningJobIdsRef.current.add(job.id);
      if (isMountedRef.current) addCreatedJob(job);
      dropLocal(pending.requestId);
      await recordCreated((current) =>
        resolvePendingJobCreate(current, pending.requestId, job, assetId)
      );
      if (!isMountedRef.current) return;
      setAdvisory(undefined);
      sdk.notifier.success(`Started ${workflow}. This can take a few minutes.`);
    } finally {
      if (startingJobRef.current === pending.requestId) startingJobRef.current = undefined;
    }
  };

  const handleCancel = async (job: RobotsJob) => {
    if (!muxApi) return;
    setCancellingIds((previous) => [...previous, job.id]);
    try {
      await muxApi.cancelRobotsJob(job.id);
      await refresh({ silent: true });
    } catch (error) {
      sdk.notifier.error(
        error instanceof MuxApiError ? error.message : 'Could not cancel this job.'
      );
    } finally {
      if (isMountedRef.current) {
        setCancellingIds((previous) => previous.filter((id) => id !== job.id));
      }
    }
  };

  /**
   * The most expensive click in this tab — a directive dispatches several billable workflows in
   * sequence — on the same path as `handleRun`.
   */
  const handleRunDirective = async () => {
    if (!muxApi || !selectedDirectiveId || startingDirectiveRef.current) return;
    const directiveId = selectedDirectiveId;
    const pending = newPendingDirectiveRunCreate(directiveId);
    startingDirectiveRef.current = pending.requestId;
    setLocalRunCreate({ pending, phase: 'saving' });

    try {
      if (!(await savePlaceholder(pending))) return;

      let run: RobotsDirectiveRun;
      try {
        run = await startRobotsDirectiveRun(muxApi, directiveId, assetId);
      } catch (error) {
        if (error instanceof MuxApiError && error.muxAnswered) {
          settleRefusal(
            pending,
            error,
            'That directive is already running on this video.',
            () => void loadDirectiveRuns()
          );
          return;
        }
        if (!isMountedRef.current) return;
        setLocalPhase(pending.requestId, 'unconfirmed');
        directiveRecheckTicksRef.current = 0;
        sdk.notifier.warning(
          'Mux has not answered about this directive run yet. The Robots tab keeps checking.'
        );
        void loadDirectiveRuns();
        return;
      }

      createdForRequestRef.current.set(pending.requestId, run.run_id);
      // The row the create response gives is also what arms the poll from the moment of the
      // click: `POST .../runs` answers before the run is listable.
      if (isMountedRef.current) addDirectiveRun(run);
      dropLocal(pending.requestId);
      await recordCreated((current) =>
        resolvePendingDirectiveRunCreate(current, pending.requestId, run, assetId)
      );
      if (!isMountedRef.current) return;
      setAdvisory(undefined);
      sdk.notifier.success('Directive run started.');
      void refresh({ silent: true });
    } finally {
      if (startingDirectiveRef.current === pending.requestId) {
        startingDirectiveRef.current = undefined;
      }
    }
  };

  // Before the skeleton, not after it. A capability that is already known to be unavailable — by
  // this panel's own read, or from the session cache a previous entry filled — is a final answer,
  // so there is nothing to wait for and the effect above does not fetch.
  if (capability && capability.state !== 'enabled') {
    return <RobotsCapabilityNote state={capability.state} termsUrl={capability.termsUrl} />;
  }

  // Nothing is known about the account yet, so no furniture: for most installs the answer is that
  // Robots is off and the tab is about to become a note. Once the session knows Robots is on, the
  // tab renders the moment it is opened, and only what is still being read says so. A tab nobody
  // has opened stays the inert placeholder either way.
  //
  // Not `&& isLoading`: effects run after render, so the first render with `isActive` true has not
  // started loading yet, and an empty job table would flash before the spinner.
  if (!hasLoadedOnce && !(isKnownEnabled && isActive)) {
    return (
      <Box marginTop="spacingM">
        <Skeleton.Container>
          <Skeleton.BodyText numberOfLines={4} />
        </Skeleton.Container>
      </Box>
    );
  }

  // An asset queued for deletion at the next publish is not worth spending units on.
  const isAssetPendingDelete = !!value?.pendingActions?.delete?.some(
    (action) => action.type === 'asset' && action.id === assetId
  );

  // Who sees the run controls at all is `canRunRobots`: space admins, and everyone else once an
  // admin turns on "Let everyone run Robots". UI-only — `muxProxy` forwards any Robots call, so it
  // hides controls rather than refusing calls. See ADR-0016.
  //
  // One rule for the buttons and the tables: a Run button is blocked exactly while its table shows
  // a pending row, so it is never disabled for a create nobody can see. An unconfirmed job create
  // blocks directives too.
  const nowS = Math.floor(Date.now() / 1000);
  const links = createdForRequestRef.current;
  const jobRows = pendingCreateRows({
    stored: jobCreates,
    local: localJobCreate,
    settled: settledRequestIds,
    links,
    jobs: enrichedJobs,
    runs: [],
    value,
    nowS,
  });
  const runRows = pendingCreateRows({
    stored: runCreates,
    local: localRunCreate,
    settled: settledRequestIds,
    links,
    jobs: [],
    runs: directiveRuns,
    value,
    nowS,
  });
  const unconfirmedJobRows = jobRows.filter((row) => row.phase === 'unconfirmed');
  const unconfirmedRunRows = runRows.filter((row) => row.phase === 'unconfirmed');

  const deleteReason = isAssetPendingDelete
    ? 'This video is marked for deletion at the next publish.'
    : undefined;
  const pendingReason = (
    rows: PendingCreateRow[],
    unconfirmed: PendingCreateRow[],
    where: string
  ) =>
    rows.length === 0
      ? undefined
      : unconfirmed.length > 0
      ? `Mux has not confirmed the last run. See the note above the ${where}.`
      : 'A run is starting on this video.';
  const runDisabledReason = deleteReason ?? pendingReason(jobRows, unconfirmedJobRows, 'jobs');
  const directiveRunDisabledReason =
    deleteReason ??
    pendingReason(runRows, unconfirmedRunRows, 'directive runs') ??
    pendingReason(jobRows, unconfirmedJobRows, 'jobs');

  // Not a spend guard like the two above — there is simply nothing to apply yet. It reads as a
  // reason rather than a boolean because it is what the tooltip says.
  const applyDisabledReason = value?.robotsOutputs?.summarize
    ? undefined
    : 'Run a Summarize workflow to apply its title, description and tags to this entry’s own fields.';

  const availableDirectives =
    directiveListing.status === 'loaded'
      ? directiveListing.directives
      : directiveListing.status === 'failed'
      ? defaultDirectiveIds.map((id) => ({ id, name: id } as RobotsDirective))
      : [];
  // A choice the latest listing no longer offers is no choice: running it would be a 404.
  const chosenDirectiveId = availableDirectives.some(
    (directive) => directive.id === selectedDirectiveId
  )
    ? selectedDirectiveId
    : '';
  const directivePrompt =
    directiveListing.status === 'pending'
      ? 'Loading directives…'
      : availableDirectives.length > 0
      ? 'Select a directive'
      : directiveListing.status === 'loaded'
      ? 'No directives in this Mux account'
      : 'Could not list directives';

  const directiveNames = directiveNamesById(
    directiveListing.status === 'loaded' ? directiveListing.directives : [],
    defaultDirectiveIds
  );

  return (
    <Box marginTop="spacingS">
      <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingM">
        <Flex alignItems="center" gap="spacingS">
          {canRunRobots && (
            <Button
              variant="primary"
              isDisabled={!!runDisabledReason}
              title={runDisabledReason}
              onClick={() => setIsRunModalShown(true)}>
              Run a workflow
            </Button>
          )}
          {applyDisabledReason ? (
            // Rendered disabled rather than hidden: a feature that only appears once you have
            // already done the thing that enables it is a feature nobody discovers. The tooltip
            // says what it would do and what has to happen first, which is the same
            // disabled-with-a-reason pattern `TrackList` and `Mp4RenditionsList` use.
            <Tooltip content={applyDisabledReason} placement="bottom">
              <Button variant="secondary" isDisabled>
                Apply summary
              </Button>
            </Tooltip>
          ) : (
            <Button variant="secondary" onClick={() => setIsApplyModalShown(true)}>
              Apply summary
            </Button>
          )}
        </Flex>
        <Button
          variant="transparent"
          startIcon={<CycleIcon />}
          isDisabled={isLoading}
          onClick={() => {
            refresh();
            loadDirectiveRuns();
            // The picker too: a directive created or deleted in Mux reaches it here, rather
            // than only on a reload.
            loadDirectives();
          }}>
          Refresh
        </Button>
      </Flex>

      {!canRunRobots && <RobotsAdminsOnlyNote />}

      {canRunRobots && deleteReason && (
        <Box marginBottom="spacingM">
          <Note variant="neutral">{deleteReason}</Note>
        </Box>
      )}

      {canRunRobots && (
        <RobotsUnconfirmedNote
          rows={unconfirmedJobRows}
          directiveNames={directiveNames}
          onClear={() => clearUnconfirmed(unconfirmedJobRows)}
          testId="robots-job-unconfirmed"
        />
      )}

      {loadError && (
        <Box marginBottom="spacingM">
          <Note variant="negative">{loadError}</Note>
        </Box>
      )}

      {advisory && <RobotsCapabilityNote state={advisory} />}

      {/* A list that failed is not a list with nothing in it: the note above says what happened,
          and "No Robots jobs have run on this video yet" would be a claim nobody checked. */}
      {!(loadError && enrichedJobs.length === 0 && jobRows.length === 0) && (
        <RobotsJobTable
          jobs={enrichedJobs}
          pendingRows={jobRows}
          onDontStart={canRunRobots ? handleDontStart : undefined}
          pointsToNote={canRunRobots}
          detailedJobIds={detailedJobIds}
          unreadableJobIds={failedDetailIds}
          onCancel={canRunRobots ? handleCancel : undefined}
          onViewOutput={setViewedJob}
          onLoadDetail={loadJobDetail}
          cancellingIds={cancellingIds}
          loadingDetailIds={loadingDetailIds}
          pendingDetailIds={pendingDetailIds}
          isLoading={!hasLoadedOnce}
        />
      )}

      <Box marginTop="spacingL">
        <Subheading marginBottom="spacingXs">Directives</Subheading>
        <Text as="p" fontColor="gray600" marginBottom="spacingM">
          A directive runs several workflows in order.{' '}
          <ExternalLink href={`${ROBOTS_DOCS_URL}-directives`}>Author them in Mux</ExternalLink>.
        </Text>
        {canRunRobots && (
          <>
            <Flex gap="spacingS" alignItems="flex-end" marginBottom="spacingM">
              <Box style={{ minWidth: '18rem' }}>
                <Select
                  id="robots-directive"
                  aria-label="Directive"
                  value={chosenDirectiveId}
                  isDisabled={availableDirectives.length === 0}
                  onChange={(event) =>
                    setSelectedDirectiveId((event.target as HTMLSelectElement).value)
                  }>
                  <Select.Option value="">{directivePrompt}</Select.Option>
                  {availableDirectives.map((directive) => (
                    <Select.Option key={directive.id} value={directive.id}>
                      {directive.name || directive.id}
                    </Select.Option>
                  ))}
                </Select>
              </Box>
              <Button
                variant="secondary"
                isDisabled={!chosenDirectiveId || !!directiveRunDisabledReason}
                title={directiveRunDisabledReason}
                onClick={handleRunDirective}>
                Run directive
              </Button>
            </Flex>

            <RobotsUnconfirmedNote
              rows={unconfirmedRunRows}
              directiveNames={directiveNames}
              onClear={() => clearUnconfirmed(unconfirmedRunRows)}
              testId="robots-directive-run-unconfirmed"
            />
          </>
        )}

        <RobotsDirectiveRunTable
          runs={directiveRuns}
          pendingRows={runRows}
          onDontStart={canRunRobots ? handleDontStart : undefined}
          pointsToNote={canRunRobots}
          directiveNames={directiveNames}
          isLoading={areDirectiveRunsPending}
        />
      </Box>

      {canRunRobots && (
        <RobotsRunModal
          isShown={isRunModalShown}
          onClose={() => setIsRunModalShown(false)}
          onRun={handleRun}
          assetId={assetId}
          captions={captions}
          audioTracks={audioTracks}
          isAudioOnly={value?.audioOnly}
          duration={value?.is_live ? undefined : value?.duration}
          isRunDisabled={!!runDisabledReason}
          runDisabledReason={runDisabledReason}
        />
      )}

      <RobotsOutputViewer
        job={viewedJob && (enrichedJobs.find((job) => job.id === viewedJob.id) ?? viewedJob)}
        muxApi={muxApi}
        onLoaded={rememberJobDetail}
        onClose={() => setViewedJob(undefined)}
      />

      <ApplyToEntryModal
        isShown={isApplyModalShown}
        onClose={() => setIsApplyModalShown(false)}
        sdk={sdk}
        outputs={value?.robotsOutputs}
      />
    </Box>
  );
};

export default RobotsPanel;
