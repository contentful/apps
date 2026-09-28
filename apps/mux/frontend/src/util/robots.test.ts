import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MuxApiError, muxApiErrorFromResponse } from './muxApi';
import {
  activeDirectiveRuns,
  activeJobs,
  advisoryFromError,
  applyRobotsDirectiveRunsToValue,
  applyRobotsJobsToValue,
  capabilityFromError,
  directiveRunRefsFromJobs,
  jobsNeedingDetail,
  mergeDirectiveRunRecords,
  mergeJobRecords,
  mergeRobotsOutputs,
  cachedRobotsCapability,
  recordRobotsCapability,
  recordRobotsDirectiveRun,
  resetRobotsCapabilityCache,
  LocalPendingCreate,
  PendingCreateRow,
  ROBOTS_CREATE_CONFIRM_GRACE_S,
  ROBOTS_CREATE_MATCH_AFTER_S,
  ROBOTS_CREATE_MATCH_BEFORE_S,
  jobTableRows,
  pendingCreateRows,
  runTableRows,
  addPendingCreate,
  freshPendingCreates,
  matchPendingCreates,
  newPendingDirectiveRunCreate,
  newPendingJobCreate,
  pendingCreatesOf,
  removePendingCreates,
  resolvePendingCreatesFromReads,
  resolvePendingDirectiveRunCreate,
  resolvePendingJobCreate,
  startRobotsDirectiveRun,
  startRobotsJob,
} from './robots';
import {
  RobotsDirectiveRun,
  RobotsJob,
  RobotsPendingDirectiveRunCreate,
  RobotsPendingJobCreate,
} from './robotsTypes';
import { MuxContentfulObject } from './types';

/** A job as the single-job GET returns it, with the asset it ran on in `parameters`. */
const job = (overrides: Partial<RobotsJob> = {}): RobotsJob =>
  ({
    id: 'rjob_1',
    workflow: 'summarize',
    status: 'completed',
    created_at: 1_700_000_000,
    updated_at: 1_700_000_100,
    parameters: { asset_id: 'asset-1' },
    ...overrides,
  } as RobotsJob);

/** A job someone ran from the Mux dashboard against the same asset. */
const foreignJob = (overrides: Partial<RobotsJob> = {}): RobotsJob =>
  job({ id: 'rjob_dashboard', ...overrides });

const baseValue = (extra: Partial<MuxContentfulObject> = {}): MuxContentfulObject =>
  ({ version: 3, assetId: 'asset-1', ready: true, ...extra } as MuxContentfulObject);

/**
 * The terms-not-accepted 403, exactly as Mux sends it. Same `type` as every other 403 of its kind,
 * so the status and type are what classify it; the message is only where the page is named.
 */
const TERMS_PAGE = 'https://dashboard.mux.com/organizations/org-1/environments/env-1/robots/jobs';
const termsNotAccepted = (
  message = `Go to your Robots page in the Mux Dashboard to accept the terms: ${TERMS_PAGE}`
) => new MuxApiError(message, 403, 'forbidden');

describe('capabilityFromError', () => {
  it('reads a missing scope from its own error type', () => {
    const error = new MuxApiError('Missing scope', 403, 'insufficient_scope');
    expect(capabilityFromError(error)?.state).toBe('scope-missing');
  });

  it('treats a 401 as a token problem', () => {
    expect(capabilityFromError(new MuxApiError('Unauthorized', 401))?.state).toBe('scope-missing');
  });

  it('falls back to not-enabled for a bare 403', () => {
    expect(capabilityFromError(new MuxApiError('Forbidden', 403))?.state).toBe('not-enabled');
  });

  it('reads the terms-not-accepted 403 as Robots being off, never as a missing scope', () => {
    // The config screen used to answer every 403 with "generate a new token", which is advice a
    // new token cannot follow: it would be refused exactly the same way.
    expect(capabilityFromError(termsNotAccepted())).toEqual({
      state: 'not-enabled',
      termsUrl: TERMS_PAGE,
    });
  });

  it('keeps the page Mux named, and only the page, when a sentence ends after it', () => {
    expect(capabilityFromError(termsNotAccepted(`Accept the terms at ${TERMS_PAGE}.`))).toEqual({
      state: 'not-enabled',
      termsUrl: TERMS_PAGE,
    });
  });

  it('links nothing it cannot vouch for, and still classifies the same', () => {
    // No page named, or a page somewhere other than the Mux dashboard: the note falls back to the
    // dashboard itself rather than to whatever the message happened to contain.
    expect(capabilityFromError(termsNotAccepted('Robots is not enabled.'))).toEqual({
      state: 'not-enabled',
    });
    expect(
      capabilityFromError(termsNotAccepted('See https://example.com/dashboard.mux.com/robots'))
    ).toEqual({ state: 'not-enabled' });
    expect(
      capabilityFromError(termsNotAccepted('See https://dashboard.mux.com.example.com/robots'))
    ).toEqual({ state: 'not-enabled' });
  });

  it('says nothing about the account when Mux refuses one workflow on this plan', () => {
    // translate-audio on the free plan: every other workflow still runs.
    const refused = new MuxApiError(
      'Workflow is not available on the free plan',
      403,
      'robots_workflow_not_available'
    );
    expect(capabilityFromError(refused)).toBeUndefined();
  });

  it('says nothing about the account when a run would not fit the units left', () => {
    const refused = new MuxApiError(
      'Robots units limit exceeded',
      403,
      'robots_units_limit_exceeded'
    );
    expect(capabilityFromError(refused)).toBeUndefined();
  });

  it('says nothing about the account for a 403 whose type it does not know', () => {
    // The failure it leans towards is a toast on one run, not a tab replaced by an explainer.
    expect(capabilityFromError(new MuxApiError('No', 403, 'robots_something_new'))).toBeUndefined();
  });

  it('says nothing about the account for anything else', () => {
    expect(capabilityFromError(new Error('offline'))).toBeUndefined();
    expect(
      capabilityFromError(new MuxApiError('Invalid', 422, 'validation_error'))
    ).toBeUndefined();
    expect(capabilityFromError(new MuxApiError('Down', 500))).toBeUndefined();
  });
});

describe('advisoryFromError', () => {
  it('reads a units refusal as a warning', () => {
    expect(
      advisoryFromError(
        new MuxApiError('Robots units limit exceeded', 403, 'robots_units_limit_exceeded')
      )
    ).toBe('units-exhausted');
  });

  it('reads nothing else as one', () => {
    expect(
      advisoryFromError(new MuxApiError('No', 403, 'robots_workflow_not_available'))
    ).toBeUndefined();
    expect(advisoryFromError(termsNotAccepted())).toBeUndefined();
    expect(advisoryFromError(new Error('robots_units_limit_exceeded'))).toBeUndefined();
  });
});

describe('muxApiErrorFromResponse', () => {
  /** What `fetch` hands the config screen, reduced to the two members this reads. */
  const response = (status: number, body: unknown) =>
    ({
      ok: false,
      status,
      json: async () => {
        if (body === undefined) throw new SyntaxError('Unexpected end of JSON input');
        return body;
      },
    } as unknown as Response);

  it('builds the error muxProxy would, so the config screen classifies with the same function', async () => {
    const error = await muxApiErrorFromResponse(
      response(403, {
        error: {
          type: 'forbidden',
          messages: [
            `Go to your Robots page in the Mux Dashboard to accept the terms: ${TERMS_PAGE}`,
          ],
        },
      })
    );

    expect(error).toBeInstanceOf(MuxApiError);
    expect(error.status).toBe(403);
    expect(error.errorType).toBe('forbidden');
    expect(capabilityFromError(error)).toEqual({ state: 'not-enabled', termsUrl: TERMS_PAGE });
  });

  it('reads the singular message the reference documents, and joins several', async () => {
    expect(
      (await muxApiErrorFromResponse(response(403, { error: { message: 'One' } }))).message
    ).toBe('One');
    expect(
      (await muxApiErrorFromResponse(response(400, { error: { messages: ['One', 'Two'] } })))
        .message
    ).toBe('One Two');
  });

  it('still says who refused it when the body is not what it expects', async () => {
    const error = await muxApiErrorFromResponse(response(401, undefined));
    expect(error.message).toBe('Mux rejected this request (HTTP 401)');
    expect(error.errorType).toBeUndefined();
    expect(capabilityFromError(error)?.state).toBe('scope-missing');
  });
});

describe('the session capability cache', () => {
  beforeEach(() => resetRobotsCapabilityCache());

  // There is no resolver any more: the panel's own job list answers the question, and this cache
  // is what stops the *next* entry in the same tab re-asking. See `recordRobotsCapability`.
  it('starts empty, so the first entry of a session reads for itself', () => {
    expect(cachedRobotsCapability()).toBeUndefined();
  });

  it('remembers what a read reported, so opening ten entries costs one answer', () => {
    recordRobotsCapability({ state: 'enabled' });
    expect(cachedRobotsCapability()).toEqual({ state: 'enabled' });
  });

  it('remembers a negative answer too', () => {
    recordRobotsCapability({ state: 'not-enabled' });
    expect(cachedRobotsCapability()?.state).toBe('not-enabled');
  });
});

describe('directiveRunRefsFromJobs', () => {
  it('names each run once, from the jobs whose detail carries it', () => {
    // A directive's jobs all point back at the same run, so one run read covers all of them.
    const refs = directiveRunRefsFromJobs([
      job({ id: 'rjob_a', directive: { id: 'drv_1', run_id: 'drvrun_1' } }),
      job({ id: 'rjob_b', directive: { id: 'drv_1', run_id: 'drvrun_1' } }),
      job({ id: 'rjob_c', directive: { id: 'drv_2', run_id: 'drvrun_2' } }),
    ]);

    expect(refs).toEqual([
      { directiveId: 'drv_1', runId: 'drvrun_1' },
      { directiveId: 'drv_2', runId: 'drvrun_2' },
    ]);
  });

  it('names nothing for a job a direct POST created, or one whose detail was never read', () => {
    expect(directiveRunRefsFromJobs([job(), foreignJob()])).toEqual([]);
  });
});

describe('startRobotsJob', () => {
  const apiThatAnswers = (answer: () => Promise<unknown>) => {
    const createRobotsJob = vi.fn(answer);
    return { muxApi: { createRobotsJob } as never, createRobotsJob };
  };

  it('returns the job Mux created, and creates it once', async () => {
    const { muxApi, createRobotsJob } = apiThatAnswers(async () => ({ data: job() }));
    await expect(startRobotsJob(muxApi, 'summarize', { asset_id: 'asset-1' })).resolves.toEqual(
      job()
    );
    expect(createRobotsJob).toHaveBeenCalledTimes(1);
    expect(createRobotsJob).toHaveBeenCalledWith('summarize', { asset_id: 'asset-1' });
  });

  it('reads an error in a 2xx body as Mux answering no, with every message', async () => {
    const { muxApi, createRobotsJob } = apiThatAnswers(async () => ({
      data: undefined,
      error: { type: 'invalid_parameters', messages: ['Bad tone.', ' ', 'Bad length.'] },
    }));
    const error = await startRobotsJob(muxApi, 'summarize', {}).catch((caught) => caught);
    expect(error).toBeInstanceOf(MuxApiError);
    expect(error).toMatchObject({ message: 'Bad tone. Bad length.', status: 400 });
    expect((error as MuxApiError).muxAnswered).toBe(true);
    expect(createRobotsJob).toHaveBeenCalledTimes(1);
  });

  it('says Mux gave no reason when the body error carries no message', async () => {
    const { muxApi } = apiThatAnswers(async () => ({ data: undefined, error: { messages: [] } }));
    await expect(startRobotsJob(muxApi, 'summarize', {})).rejects.toThrow(
      'Mux rejected this job but gave no reason.'
    );
  });

  it('treats a 2xx that names no job as an unknown outcome, not a refusal', async () => {
    const { muxApi, createRobotsJob } = apiThatAnswers(async () => ({ data: {} }));
    const error = await startRobotsJob(muxApi, 'summarize', {}).catch((caught) => caught);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(MuxApiError);
    expect(createRobotsJob).toHaveBeenCalledTimes(1);
  });

  it('passes a proxy error through untouched, and never retries', async () => {
    for (const thrown of [
      new MuxApiError('Limit reached', 403, 'robots_units_limit_exceeded'),
      new Error('The app action response is taking longer than expected to process.'),
    ]) {
      const { muxApi, createRobotsJob } = apiThatAnswers(async () => {
        throw thrown;
      });
      await expect(startRobotsJob(muxApi, 'summarize', {})).rejects.toBe(thrown);
      expect(createRobotsJob).toHaveBeenCalledTimes(1);
    }
  });
});

describe('mergeJobRecords', () => {
  it('stores a job at every stage of its life, not only once it finishes', () => {
    // In flight as well as finished: the record is what the entry shows after a reload.
    const merged = mergeJobRecords(undefined, [
      job({ id: 'a', status: 'processing' }),
      job({ id: 'b', status: 'completed' }),
    ]);
    expect(merged?.map((record) => record.id).sort()).toEqual(['a', 'b']);
  });

  it('returns the same reference when nothing changed, so no write happens', () => {
    const existing = mergeJobRecords(undefined, [job()]);
    expect(mergeJobRecords(existing, [job()])).toBe(existing);
  });

  it('adds an in-flight job rather than ignoring it', () => {
    const existing = mergeJobRecords(undefined, [job()]);
    const merged = mergeJobRecords(existing, [job({ id: 'c', status: 'pending' })]);
    expect(merged?.map((record) => record.id).sort()).toEqual(['c', 'rjob_1']);
  });

  it('keeps what only the richer response knew when a summary comes back thinner', () => {
    // Detail has `units_consumed` and the failure; the list does not. Merging rather than
    // replacing is what stops a poll tick from erasing them.
    const existing = mergeJobRecords(undefined, [
      job({ status: 'errored', units_consumed: 12, errors: [{ message: 'Too quiet' }] }),
    ]);
    const merged = mergeJobRecords(existing, [
      { id: 'rjob_1', workflow: 'summarize', status: 'errored' } as never,
    ]);

    expect(merged).toBe(existing);
    expect(merged?.[0]).toMatchObject({ units_consumed: 12, error: 'Too quiet' });
  });

  it('lets the API win when a stored record disagrees', () => {
    const existing = mergeJobRecords(undefined, [job({ status: 'completed' })]);
    const merged = mergeJobRecords(existing, [
      job({ status: 'errored', errors: { messages: ['nope'] } }),
    ]);
    expect(merged?.[0].status).toBe('errored');
    expect(merged?.[0].error).toBe('nope');
  });

  it('sorts newest first', () => {
    const merged = mergeJobRecords(undefined, [
      job({ id: 'old', created_at: 1 }),
      job({ id: 'new', created_at: 2 }),
    ]);
    expect(merged?.map((record) => record.id)).toEqual(['new', 'old']);
  });
});

describe('mergeRobotsOutputs', () => {
  it('persists summarize output with its provenance', () => {
    const merged = mergeRobotsOutputs(
      undefined,
      [job({ outputs: { title: 'A title', description: 'A description', tags: ['x', 'y'] } })],
      'asset-1'
    );

    expect(merged?.summarize).toEqual({
      jobId: 'rjob_1',
      completedAt: 1_700_000_100,
      title: 'A title',
      description: 'A description',
      tags: ['x', 'y'],
    });
  });

  it('persists moderation scores', () => {
    const merged = mergeRobotsOutputs(
      undefined,
      [
        job({
          id: 'rjob_mod',
          workflow: 'moderate',
          outputs: { exceeds_threshold: false, max_scores: { sexual: 0.1, violence: 0.2 } },
        }),
      ],
      'asset-1'
    );

    expect(merged?.moderate).toMatchObject({
      jobId: 'rjob_mod',
      exceedsThreshold: false,
      maxScores: { sexual: 0.1, violence: 0.2 },
    });
  });

  it('ignores workflows whose output is not persisted', () => {
    expect(
      mergeRobotsOutputs(
        undefined,
        [job({ workflow: 'find-scenes', outputs: { scenes: [{ start_ms: 0 }] } })],
        'asset-1'
      )
    ).toBeUndefined();
  });

  it('ignores jobs that are not completed', () => {
    expect(
      mergeRobotsOutputs(
        undefined,
        [job({ status: 'processing', outputs: { title: 'A' } })],
        'asset-1'
      )
    ).toBeUndefined();
  });

  it('returns the same reference when the same job comes back again', () => {
    const existing = mergeRobotsOutputs(undefined, [job({ outputs: { title: 'A' } })], 'asset-1');
    expect(mergeRobotsOutputs(existing, [job({ outputs: { title: 'A' } })], 'asset-1')).toBe(
      existing
    );
  });

  it('lets a newer summarize run replace an older one', () => {
    const existing = mergeRobotsOutputs(undefined, [job({ outputs: { title: 'Old' } })], 'asset-1');
    const merged = mergeRobotsOutputs(
      existing,
      [job({ id: 'rjob_2', updated_at: 1_700_000_500, outputs: { title: 'New' } })],
      'asset-1'
    );
    expect(merged?.summarize?.title).toBe('New');
  });

  it('does not let a stale job overwrite a newer summary', () => {
    const existing = mergeRobotsOutputs(
      undefined,
      [job({ id: 'rjob_new', updated_at: 1_700_000_500, outputs: { title: 'New' } })],
      'asset-1'
    );
    const merged = mergeRobotsOutputs(
      existing,
      [job({ id: 'rjob_old', updated_at: 1_700_000_100, outputs: { title: 'Old' } })],
      'asset-1'
    );
    expect(merged?.summarize?.title).toBe('New');
  });

  it('keeps nothing from a job whose own record names another asset', () => {
    expect(
      mergeRobotsOutputs(
        undefined,
        [job({ parameters: { asset_id: 'asset-2' }, outputs: { title: 'Another video' } })],
        'asset-1'
      )
    ).toBeUndefined();
  });

  it('keeps nothing from a job that does not say which asset it ran on', () => {
    // The list it came from is filtered by asset. That is not taken on trust.
    for (const parameters of [undefined, {}]) {
      expect(
        mergeRobotsOutputs(undefined, [job({ parameters, outputs: { title: 'A' } })], 'asset-1')
      ).toBeUndefined();
    }
  });

  it('keeps nothing when the value names no asset either', () => {
    expect(
      mergeRobotsOutputs(
        undefined,
        [job({ parameters: undefined, outputs: { title: 'A' } })],
        undefined
      )
    ).toBeUndefined();
  });

  it('settles two jobs that completed in the same second the same way, whichever is read first', () => {
    // Mux timestamps are whole seconds. An answer that depends on read order lets two open
    // sessions, each having read a different one, rewrite the entry back and forth.
    const a = job({ id: 'rjob_a', updated_at: 1_700_000_500, outputs: { title: 'A' } });
    const b = job({ id: 'rjob_b', updated_at: 1_700_000_500, outputs: { title: 'B' } });

    // The greater id, as ADR-0008 says. Arbitrary, and the same everywhere.
    expect(mergeRobotsOutputs(undefined, [a, b], 'asset-1')?.summarize?.jobId).toBe('rjob_b');
    expect(mergeRobotsOutputs(undefined, [b, a], 'asset-1')?.summarize?.jobId).toBe('rjob_b');

    // And a session that has read only the losing job leaves the winning one alone.
    const settled = mergeRobotsOutputs(undefined, [b], 'asset-1');
    expect(mergeRobotsOutputs(settled, [a], 'asset-1')).toBe(settled);
  });

  it('counts a missing or unreadable completion time as the oldest', () => {
    const timed = job({ id: 'rjob_timed', updated_at: 1_700_000_500, outputs: { title: 'Timed' } });
    const untimed = job({
      id: 'rjob_untimed',
      updated_at: undefined,
      outputs: { title: 'Untimed' },
    });

    const withTimed = mergeRobotsOutputs(undefined, [timed], 'asset-1');
    expect(mergeRobotsOutputs(withTimed, [untimed], 'asset-1')).toBe(withTimed);

    const withUntimed = mergeRobotsOutputs(undefined, [untimed], 'asset-1');
    expect(mergeRobotsOutputs(withUntimed, [timed], 'asset-1')?.summarize?.jobId).toBe(
      'rjob_timed'
    );

    // The stored value is user-reachable JSON: a timestamp that is not a number must not pin it.
    const garbled = {
      summarize: { jobId: 'rjob_garbled', completedAt: 'yesterday' as unknown as number },
    };
    expect(mergeRobotsOutputs(garbled, [timed], 'asset-1')?.summarize?.jobId).toBe('rjob_timed');
  });
});

describe('applyRobotsJobsToValue', () => {
  it('returns the identical value when there is nothing new — no write, no "Changed" entry', () => {
    const value = baseValue();
    expect(applyRobotsJobsToValue(value, [], 'asset-1')).toBe(value);
  });

  it('returns the identical value when a stored job reports the same state again', () => {
    const stored = applyRobotsJobsToValue(baseValue(), [job({ status: 'processing' })], 'asset-1');
    expect(applyRobotsJobsToValue(stored, [job({ status: 'processing' })], 'asset-1')).toBe(stored);
  });

  it('leaves every other key alone when it does write', () => {
    const value = baseValue({
      captions: [{ type: 'text', id: 'track-1' } as never],
      pendingActions: { delete: [], create: [], update: [] },
    });

    const next = applyRobotsJobsToValue(value, [job({ outputs: { title: 'A' } })], 'asset-1');

    expect(next).not.toBe(value);
    expect(next?.captions).toBe(value.captions);
    expect(next?.pendingActions).toBe(value.pendingActions);
    expect(next?.robotsJobs).toHaveLength(1);
    expect(next?.robotsOutputs?.summarize?.title).toBe('A');
  });

  it('does nothing when the field has no value at all', () => {
    expect(applyRobotsJobsToValue(undefined, [job()], 'asset-1')).toBeUndefined();
  });

  it('writes nothing onto a value whose assetId is not the listed asset', () => {
    // A mutator queued for one asset and applied after the value was replaced with another: a
    // pasted asset ID, or a write parked behind the publish gate.
    const other = baseValue({ assetId: 'asset-2' });
    expect(applyRobotsJobsToValue(other, [job({ outputs: { title: 'A' } })], 'asset-1')).toBe(
      other
    );
    const none = baseValue({ assetId: undefined });
    expect(applyRobotsJobsToValue(none, [job()], 'asset-1')).toBe(none);
  });
});

describe('activeJobs', () => {
  const now = 1_700_000_000_000;

  it('keeps only non-terminal jobs', () => {
    const jobs = [
      job({ id: 'a', status: 'pending', created_at: now / 1000 }),
      job({ id: 'b', status: 'processing', created_at: now / 1000 }),
      job({ id: 'c', status: 'completed' }),
      job({ id: 'd', status: 'errored' }),
      job({ id: 'e', status: 'cancelled' }),
    ];
    expect(activeJobs(jobs, now).map((entry) => entry.id)).toEqual(['a', 'b']);
  });

  it('stops waiting on a job the API seems to have lost', () => {
    const ancient = job({ status: 'processing', created_at: (now - 24 * 3600 * 1000) / 1000 });
    expect(activeJobs([ancient], now)).toHaveLength(0);
  });

  it('keeps a job with no creation timestamp rather than dropping it', () => {
    expect(activeJobs([job({ status: 'pending', created_at: undefined })], now)).toHaveLength(1);
  });
});

describe('activeDirectiveRuns', () => {
  const now = 1_700_000_000_000;

  /** The REST shape: `run_id` and `subject_id`, not the webhook's `id` and `asset_id`. */
  const run = (overrides: Partial<RobotsDirectiveRun> = {}): RobotsDirectiveRun => ({
    run_id: 'drvrun_1',
    subject_id: 'asset-1',
    status: 'running',
    started_at: now / 1000,
    ...overrides,
  });

  it('keeps a run that may still dispatch more workflows', () => {
    const runs = [
      run({ run_id: 'a', status: 'pending' }),
      run({ run_id: 'b', status: 'dispatching' }),
      run({ run_id: 'c', status: 'running' }),
      run({ run_id: 'd', status: 'waiting' }),
      run({ run_id: 'e', status: 'completed' }),
      run({ run_id: 'f', status: 'partial' }),
      run({ run_id: 'g', status: 'errored' }),
    ];
    expect(activeDirectiveRuns(runs, now).map((entry) => entry.run_id)).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
  });

  it('stops waiting on a run that is stuck, so the poll cannot bill forever', () => {
    const stuck = run({ started_at: (now - 24 * 3600 * 1000) / 1000 });
    expect(activeDirectiveRuns([stuck], now)).toHaveLength(0);
  });

  it('keeps a run with no start time, which is the row the create response seeds', () => {
    expect(
      activeDirectiveRuns([run({ status: 'pending', started_at: undefined })], now)
    ).toHaveLength(1);
  });
});

describe('every job on the asset is recorded', () => {
  it('records a job someone ran from the Mux dashboard', () => {
    const next = applyRobotsJobsToValue(
      baseValue(),
      [foreignJob({ workflow: 'find-scenes', outputs: { scenes: [] } })],
      'asset-1'
    );
    expect(next?.robotsJobs?.map(({ id }) => id)).toEqual(['rjob_dashboard']);
    expect(next?.version).toBe(4);
  });

  it('records a job a directive dispatched, with no run in sight', () => {
    const next = applyRobotsJobsToValue(
      baseValue(),
      [{ id: 'rjob_auto', workflow: 'summarize', status: 'completed' }] as never as RobotsJob[],
      'asset-1'
    );
    expect(next?.robotsJobs?.map(({ id }) => id)).toEqual(['rjob_auto']);
  });

  it('keeps a stored record the API no longer returns', () => {
    // Robots purges jobs after 30 days, and the entry's history has to outlive that.
    const withRecord = applyRobotsJobsToValue(baseValue(), [job()], 'asset-1');
    expect(withRecord?.robotsJobs).toHaveLength(1);

    const afterPurge = applyRobotsJobsToValue(withRecord, [], 'asset-1');
    expect(afterPurge).toBe(withRecord);
  });

  it('keeps a stored output after the job that produced it is gone', () => {
    const withOutput = applyRobotsJobsToValue(
      baseValue(),
      [job({ outputs: { title: 'Kept' } })],
      'asset-1'
    );
    const afterPurge = applyRobotsJobsToValue(withOutput, [], 'asset-1');
    expect(afterPurge?.robotsOutputs?.summarize?.title).toBe('Kept');
  });
});

/** Outputs describe the video, so they are kept whoever started the job, and only for its asset. */
describe('applyRobotsJobsToValue — outputs, whoever started the job', () => {
  it('keeps the summary and moderation result of jobs run elsewhere, and records both jobs', () => {
    const next = applyRobotsJobsToValue(
      baseValue(),
      [
        foreignJob({ outputs: { title: 'From the dashboard' } }),
        foreignJob({
          id: 'rjob_dashboard_mod',
          workflow: 'moderate',
          outputs: { exceeds_threshold: true, max_scores: { sexual: 0.9, violence: 0.1 } },
        }),
      ],
      'asset-1'
    );

    expect(next?.robotsOutputs?.summarize).toMatchObject({
      jobId: 'rjob_dashboard',
      title: 'From the dashboard',
    });
    expect(next?.robotsOutputs?.moderate).toMatchObject({
      jobId: 'rjob_dashboard_mod',
      exceedsThreshold: true,
    });
    expect(next?.robotsJobs?.map(({ id }) => id).sort()).toEqual([
      'rjob_dashboard',
      'rjob_dashboard_mod',
    ]);
    expect(next?.version).toBe(4);
  });

  it('keeps no output from a job whose own record names another asset', () => {
    const next = applyRobotsJobsToValue(
      baseValue(),
      [job({ parameters: { asset_id: 'asset-2' }, outputs: { title: 'Another video' } })],
      'asset-1'
    );
    expect(next?.robotsOutputs).toBeUndefined();
  });

  it('lets the newest completed run win, whoever started it', () => {
    const earlier = job({ id: 'rjob_ours', updated_at: 1_700_000_100, outputs: { title: 'Ours' } });
    const later = foreignJob({
      id: 'rjob_theirs',
      updated_at: 1_700_000_900,
      outputs: { title: 'Theirs' },
    });
    const earliest = foreignJob({
      id: 'rjob_theirs_first',
      updated_at: 1_700_000_050,
      outputs: { title: 'Theirs, first' },
    });

    const withEarlier = applyRobotsJobsToValue(baseValue(), [earlier, earliest], 'asset-1');
    expect(
      applyRobotsJobsToValue(withEarlier, [later], 'asset-1')?.robotsOutputs?.summarize?.title
    ).toBe('Theirs');
    // An older one read late — a row past the detail window, opened afterwards — changes nothing.
    expect(applyRobotsJobsToValue(withEarlier, [earlier, earliest], 'asset-1')).toBe(withEarlier);
    for (const jobs of [
      [earlier, later],
      [later, earlier],
    ]) {
      expect(
        applyRobotsJobsToValue(baseValue(), jobs, 'asset-1')?.robotsOutputs?.summarize?.jobId
      ).toBe('rjob_theirs');
    }
  });
});

describe('the shape the list endpoint actually returns', () => {
  /**
   * `GET /robots/v0/jobs` returns a summary per job: no `outputs`, `parameters` or
   * `units_consumed`. A fixture shaped like the full job hides exactly the bugs this feature has
   * had.
   */
  const summaryJob = (overrides: Partial<RobotsJob> = {}): RobotsJob =>
    ({
      id: 'rjob_summary',
      workflow: 'ask-questions',
      status: 'completed',
      created_at: 1_700_000_000,
      updated_at: 1_700_000_100,
      ...overrides,
    } as RobotsJob);

  it('records a job the entry already knows about, whatever the list omits', () => {
    // First contact: the app started this job, so it was recorded at create time.
    const value = baseValue({
      robotsJobs: [{ id: 'rjob_summary', workflow: 'ask-questions', status: 'processing' }],
    });

    // Later poll: the same job comes back as a summary.
    const next = applyRobotsJobsToValue(value, [summaryJob()], 'asset-1');

    expect(next).not.toBe(value);
    expect(next?.robotsJobs).toHaveLength(1);
    expect(next?.robotsJobs?.[0].status).toBe('completed');
  });

  it('records a summary job the entry has never seen', () => {
    const next = applyRobotsJobsToValue(baseValue(), [summaryJob()], 'asset-1');
    expect(next?.robotsJobs?.map(({ id }) => id)).toEqual(['rjob_summary']);
  });

  it('records a job before it has finished', () => {
    const created = summaryJob({ id: 'rjob_new', status: 'pending' });

    const next = applyRobotsJobsToValue(baseValue(), [created], 'asset-1');

    expect(next?.robotsJobs).toEqual([
      expect.objectContaining({ id: 'rjob_new', status: 'pending' }),
    ]);
  });

  it('carries a stored job through a poll that reports no change', () => {
    const first = applyRobotsJobsToValue(
      baseValue(),
      [summaryJob({ status: 'pending' })],
      'asset-1'
    );
    const second = applyRobotsJobsToValue(first, [summaryJob({ status: 'pending' })], 'asset-1');
    expect(second).toBe(first);
  });
});

describe('jobsNeedingDetail', () => {
  it('asks for detail on finished jobs only', () => {
    const jobs = [
      { id: 'a', workflow: 'summarize', status: 'completed' },
      { id: 'b', workflow: 'summarize', status: 'processing' },
      { id: 'c', workflow: 'summarize', status: 'errored' },
    ] as never as RobotsJob[];

    expect(
      jobsNeedingDetail(jobs, new Set())
        .map((j) => j.id)
        .sort()
    ).toEqual(['a', 'c']);
  });

  it('never asks twice for the same job', () => {
    const jobs = [{ id: 'a', workflow: 'summarize', status: 'completed' }] as never as RobotsJob[];
    expect(jobsNeedingDetail(jobs, new Set(['a']))).toEqual([]);
  });

  it('fetches detail for jobs run outside the plugin too', () => {
    // Reading a job costs nothing and charges nobody, and a dashboard job with a permanently
    // blank Units column and no output looks broken.
    const foreign = [
      { id: 'a', workflow: 'summarize', status: 'completed' },
    ] as never as RobotsJob[];

    expect(jobsNeedingDetail(foreign, new Set()).map((j) => j.id)).toEqual(['a']);
  });

  it('bounds the burst, newest first', () => {
    const jobs = Array.from({ length: 12 }, (_, index) => ({
      id: `job-${index}`,
      workflow: 'summarize',
      status: 'completed',
      created_at: index,
    })) as never as RobotsJob[];

    const picked = jobsNeedingDetail(jobs, new Set(), { limit: 3 });
    expect(picked.map((j) => j.id)).toEqual(['job-11', 'job-10', 'job-9']);
  });

  it('will not look further back than the window, however many passes it takes', () => {
    // The bound that matters now that every terminal job is a candidate: an asset with a long
    // dashboard history must not turn into one detail read per job.
    const jobs = Array.from({ length: 50 }, (_, index) => ({
      id: `job-${index}`,
      workflow: 'summarize',
      status: 'completed',
      created_at: index,
    })) as never as RobotsJob[];

    const attempted = new Set<string>();
    for (let pass = 0; pass < 20; pass += 1) {
      for (const job of jobsNeedingDetail(jobs, attempted, { window: 5 })) attempted.add(job.id);
    }

    expect([...attempted].sort()).toEqual(['job-45', 'job-46', 'job-47', 'job-48', 'job-49']);
  });

  it("does not mutate the caller's array", () => {
    const jobs = [
      { id: 'old', workflow: 'summarize', status: 'completed', created_at: 1 },
      { id: 'new', workflow: 'summarize', status: 'completed', created_at: 2 },
    ] as never as RobotsJob[];

    jobsNeedingDetail(jobs, new Set());
    expect(jobs.map((j) => j.id)).toEqual(['old', 'new']);
  });
});

/**
 * Directive runs recorded on the entry.
 *
 * Before this, a directive's jobs were claimed only by matching them against a *freshly listed*
 * run: `GET /robots/v0/directives/{id}/runs` capped at 25, filtered client-side because the API
 * cannot filter by asset. A busy directive pushes this asset's run out of that window within
 * hours and a deleted directive removes it immediately, and the jobs it dispatched then become
 * permanently unclaimable. See ADR-0009.
 */
describe('mergeDirectiveRunRecords', () => {
  const run = (overrides: Partial<RobotsDirectiveRun> = {}): RobotsDirectiveRun =>
    ({
      run_id: 'drvrun_1',
      directive_id: 'drv_1',
      subject_id: 'asset-1',
      status: 'pending',
      started_at: 1_700_000_000,
      ...overrides,
    } as RobotsDirectiveRun);

  it('appends a run at creation, which is the only time a run is added', () => {
    const records = mergeDirectiveRunRecords(undefined, [run()], { append: true });
    expect(records).toEqual([
      { runId: 'drvrun_1', directiveId: 'drv_1', status: 'pending', startedAt: 1_700_000_000 },
    ]);
  });

  it('never adds a run on the polling path', () => {
    // Otherwise merely opening an entry whose asset has any directive run inside the API's
    // newest-25 window would add a key to it, raise the version to v6, and flip a published entry
    // to "Changed" for a run nobody started from here.
    expect(mergeDirectiveRunRecords(undefined, [run()])).toBeUndefined();
    const existing = [{ runId: 'drvrun_other', directiveId: 'drv_9' }];
    expect(mergeDirectiveRunRecords(existing, [run()])).toBe(existing);
  });

  it('fills in the job ids as node_states reveals them', () => {
    // The create response is a run id and `pending`; the jobs arrive over the following minutes.
    const recorded = mergeDirectiveRunRecords(undefined, [run()], { append: true });
    const withJobs = mergeDirectiveRunRecords(recorded, [
      run({
        status: 'running',
        node_states: [{ job_id: 'rjob_a' }, { job_id: 'rjob_b' }, { reason: 'no job yet' }],
      }),
    ]);

    expect(withJobs?.[0].jobIds).toEqual(['rjob_a', 'rjob_b']);
    expect(withJobs?.[0].status).toBe('running');
  });

  it('never drops a job id it has already recorded', () => {
    // A later listing can come back without `node_states`, and losing an id there would un-claim
    // a job the entry had already claimed.
    const recorded = mergeDirectiveRunRecords(
      undefined,
      [run({ node_states: [{ job_id: 'rjob_a' }] })],
      { append: true }
    );
    const thinner = mergeDirectiveRunRecords(recorded, [run({ status: 'completed' })]);
    expect(thinner?.[0].jobIds).toEqual(['rjob_a']);
  });

  it('returns the same reference when nothing changed, so no write happens', () => {
    const recorded = mergeDirectiveRunRecords(undefined, [run()], { append: true });
    expect(mergeDirectiveRunRecords(recorded, [run()])).toBe(recorded);
  });

  it('ignores a run with no id or no directive, which nothing could be keyed on', () => {
    expect(
      mergeDirectiveRunRecords(undefined, [{ run_id: 'drvrun_2' } as RobotsDirectiveRun], {
        append: true,
      })
    ).toBeUndefined();
  });
});

describe('recordRobotsDirectiveRun', () => {
  const run = {
    run_id: 'drvrun_1',
    directive_id: 'drv_1',
    subject_id: 'asset-1',
    status: 'pending',
    started_at: 1_700_000_000,
  } as RobotsDirectiveRun;

  it('puts the run on the entry and raises the version to v4', () => {
    const next = recordRobotsDirectiveRun(baseValue(), run);
    expect(next?.robotsDirectiveRuns?.[0].runId).toBe('drvrun_1');
    expect(next?.version).toBe(4);
  });

  it('leaves every other key alone', () => {
    const value = baseValue({ captions: [{ type: 'text', id: 'track-1' } as never] });
    const next = recordRobotsDirectiveRun(value, run);
    expect(next?.captions).toBe(value.captions);
    expect(next?.assetId).toBe('asset-1');
  });

  it('returns the identical value when the run is already recorded', () => {
    const first = recordRobotsDirectiveRun(baseValue(), run);
    expect(recordRobotsDirectiveRun(first, run)).toBe(first);
  });

  it('does nothing when the field has no value at all', () => {
    expect(recordRobotsDirectiveRun(undefined, run)).toBeUndefined();
  });
});

describe('applyRobotsDirectiveRunsToValue', () => {
  it('updates a recorded run without adding an unrecorded one', () => {
    const value = baseValue({
      robotsDirectiveRuns: [{ runId: 'drvrun_1', directiveId: 'drv_1', status: 'pending' }],
    });

    const next = applyRobotsDirectiveRunsToValue(value, [
      {
        run_id: 'drvrun_1',
        directive_id: 'drv_1',
        status: 'completed',
        node_states: [{ job_id: 'rjob_a' }],
      } as RobotsDirectiveRun,
      { run_id: 'drvrun_ingest', directive_id: 'drv_2', status: 'running' } as RobotsDirectiveRun,
    ]);

    expect(next?.robotsDirectiveRuns).toHaveLength(1);
    expect(next?.robotsDirectiveRuns?.[0]).toMatchObject({
      status: 'completed',
      jobIds: ['rjob_a'],
    });
  });

  it('leaves an entry with no recorded runs byte-identical', () => {
    const value = baseValue();
    expect(
      applyRobotsDirectiveRunsToValue(value, [
        { run_id: 'drvrun_ingest', directive_id: 'drv_2' } as RobotsDirectiveRun,
      ])
    ).toBe(value);
  });
});

describe('startRobotsDirectiveRun', () => {
  it('returns the created run, tagged with the directive that started it, and starts it once', async () => {
    const createRobotsDirectiveRun = vi.fn(async () => ({
      data: { run_id: 'drvrun_1', subject_id: 'asset-1', status: 'pending' },
    }));
    const run = await startRobotsDirectiveRun(
      { createRobotsDirectiveRun } as never,
      'drv_1',
      'asset-1'
    );
    expect(run).toMatchObject({ run_id: 'drvrun_1', directive_id: 'drv_1' });
    expect(createRobotsDirectiveRun).toHaveBeenCalledTimes(1);
    expect(createRobotsDirectiveRun).toHaveBeenCalledWith('drv_1', 'asset-1');
  });

  it('treats a 2xx that names no run as an unknown outcome, not a refusal', async () => {
    const muxApi = { createRobotsDirectiveRun: vi.fn(async () => ({ data: {} })) } as never;
    const error = await startRobotsDirectiveRun(muxApi, 'drv_1', 'asset-1').catch(
      (caught) => caught
    );
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(MuxApiError);
  });

  it('passes an answered refusal and an unknown outcome through, and never retries', async () => {
    for (const thrown of [
      new MuxApiError('Already running', 409),
      new Error('The app action response is taking longer than expected to process.'),
    ]) {
      const createRobotsDirectiveRun = vi.fn(async () => {
        throw thrown;
      });
      await expect(
        startRobotsDirectiveRun({ createRobotsDirectiveRun } as never, 'drv_1', 'asset-1')
      ).rejects.toBe(thrown);
      expect(createRobotsDirectiveRun).toHaveBeenCalledTimes(1);
    }
  });
});

describe('pending creates', () => {
  const requestedAt = 1_700_000_000;

  const pendingJob = (overrides: Partial<RobotsPendingJobCreate> = {}): RobotsPendingJobCreate => ({
    requestId: 'req_job_1',
    kind: 'job',
    workflow: 'summarize',
    requestedAt,
    ...overrides,
  });

  const pendingRun = (
    overrides: Partial<RobotsPendingDirectiveRunCreate> = {}
  ): RobotsPendingDirectiveRunCreate => ({
    requestId: 'req_run_1',
    kind: 'directive-run',
    directiveId: 'drv_1',
    requestedAt,
    ...overrides,
  });

  /** A list summary: six fields, no detail. */
  const listed = (id: string, createdAt: number | undefined, workflow = 'summarize'): RobotsJob =>
    ({ id, workflow, status: 'pending', created_at: createdAt } as RobotsJob);

  const run = (overrides: Partial<RobotsDirectiveRun> = {}): RobotsDirectiveRun => ({
    run_id: 'drvrun_1',
    directive_id: 'drv_1',
    subject_id: 'asset-1',
    status: 'pending',
    started_at: requestedAt,
    ...overrides,
  });

  describe('newPendingJobCreate and newPendingDirectiveRunCreate', () => {
    it('stamp a 16-hex request id and the time in Unix seconds, as Mux dates jobs', () => {
      const job = newPendingJobCreate('summarize', 1_700_000_000_999);
      expect(job).toEqual({
        requestId: expect.stringMatching(/^[0-9a-f]{16}$/),
        kind: 'job',
        workflow: 'summarize',
        requestedAt: 1_700_000_000,
      });
      expect(newPendingJobCreate('summarize').requestId).not.toBe(job.requestId);
      expect(newPendingDirectiveRunCreate('drv_1', 1_700_000_000_500)).toEqual({
        requestId: expect.stringMatching(/^[0-9a-f]{16}$/),
        kind: 'directive-run',
        directiveId: 'drv_1',
        requestedAt: 1_700_000_000,
      });
    });
  });

  describe('pendingCreatesOf', () => {
    it('never throws on what a person can type into the JSON', () => {
      for (const stored of ['nonsense', { a: 1 }, 42, null]) {
        expect(pendingCreatesOf(baseValue({ robotsPendingCreates: stored as never }))).toEqual([]);
      }
      expect(pendingCreatesOf(undefined)).toEqual([]);
    });

    it('skips entries it cannot read and keeps the rest', () => {
      const value = baseValue({
        robotsPendingCreates: [
          pendingJob(),
          { kind: 'job', workflow: 'summarize', requestedAt } as never,
          { requestId: 'q', kind: 'thumbnail', requestedAt } as never,
          { requestId: 'q', kind: 'job', workflow: 'summarize', requestedAt: 'now' } as never,
          { requestId: 'q', kind: 'directive-run', requestedAt } as never,
          'q' as never,
          pendingRun(),
        ],
      });
      expect(pendingCreatesOf(value)).toEqual([pendingJob(), pendingRun()]);
    });
  });

  describe('freshPendingCreates', () => {
    it('drops placeholders older than six hours', () => {
      const nowMs = requestedAt * 1000;
      const value = baseValue({
        robotsPendingCreates: [
          pendingJob({ requestId: 'fresh', requestedAt: requestedAt - 6 * 3600 + 1 }),
          pendingJob({ requestId: 'stale', requestedAt: requestedAt - 6 * 3600 }),
        ],
      });
      expect(freshPendingCreates(value, nowMs).map(({ requestId }) => requestId)).toEqual([
        'fresh',
      ]);
    });
  });

  describe('addPendingCreate and removePendingCreates', () => {
    it('raises a v3 value to v4 when it adds a placeholder', () => {
      const next = addPendingCreate(baseValue(), pendingJob(), 'asset-1');
      expect(next?.robotsPendingCreates).toEqual([pendingJob()]);
      expect(next?.version).toBe(4);
    });

    it('returns the same reference for a placeholder already stored', () => {
      const once = addPendingCreate(baseValue(), pendingJob(), 'asset-1');
      expect(addPendingCreate(once, pendingJob(), 'asset-1')).toBe(once);
    });

    it('writes nothing onto another asset, or onto no value', () => {
      const other = baseValue({ assetId: 'asset-2' });
      expect(addPendingCreate(other, pendingJob(), 'asset-1')).toBe(other);
      expect(addPendingCreate(undefined, pendingJob(), 'asset-1')).toBeUndefined();
    });

    it('deletes the key with the last placeholder rather than leaving []', () => {
      const withOne = addPendingCreate(baseValue(), pendingJob(), 'asset-1');
      const emptied = removePendingCreates(withOne, () => true);
      expect(emptied && 'robotsPendingCreates' in emptied).toBe(false);
    });

    it('removes only what the predicate names, and keeps entries it cannot read', () => {
      const unreadable = { requestId: 'future', kind: 'thumbnail', requestedAt } as never;
      const value = baseValue({
        version: 4,
        robotsPendingCreates: [pendingJob(), unreadable, pendingRun()],
      });
      const next = removePendingCreates(value, (pending) => pending.kind === 'job');
      expect(next?.robotsPendingCreates).toEqual([unreadable, pendingRun()]);
    });

    it('returns the same reference when nothing is removed, whatever is stored', () => {
      for (const stored of [[pendingJob()], 'nonsense', { a: 1 }, undefined]) {
        const value = baseValue({ robotsPendingCreates: stored as never });
        expect(removePendingCreates(value, (pending) => pending.kind === 'directive-run')).toBe(
          value
        );
      }
      expect(removePendingCreates(undefined, () => true)).toBeUndefined();
    });
  });

  describe('resolvePendingJobCreate and resolvePendingDirectiveRunCreate', () => {
    it('replace a job placeholder with the job record in one write', () => {
      const value = baseValue({ version: 4, robotsPendingCreates: [pendingJob(), pendingRun()] });
      const next = resolvePendingJobCreate(
        value,
        'req_job_1',
        listed('rjob_new', requestedAt),
        'asset-1'
      );
      expect(next?.robotsPendingCreates).toEqual([pendingRun()]);
      expect(next?.robotsJobs?.map(({ id }) => id)).toEqual(['rjob_new']);
    });

    it('still record the job when the placeholder has already gone', () => {
      const next = resolvePendingJobCreate(
        baseValue(),
        'req_job_1',
        listed('rjob_new', requestedAt),
        'asset-1'
      );
      expect(next?.robotsJobs?.map(({ id }) => id)).toEqual(['rjob_new']);
    });

    it('replace a run placeholder with the run record in one write', () => {
      const value = baseValue({ version: 4, robotsPendingCreates: [pendingRun()] });
      const next = resolvePendingDirectiveRunCreate(value, 'req_run_1', run(), 'asset-1');
      expect(next && 'robotsPendingCreates' in next).toBe(false);
      expect(next?.robotsDirectiveRuns?.map(({ runId }) => runId)).toEqual(['drvrun_1']);
    });

    it('write nothing onto another asset, or onto no value', () => {
      const other = baseValue({ assetId: 'asset-2', robotsPendingCreates: [pendingJob()] });
      expect(resolvePendingJobCreate(other, 'req_job_1', listed('j', requestedAt), 'asset-1')).toBe(
        other
      );
      expect(resolvePendingDirectiveRunCreate(other, 'req_run_1', run(), 'asset-1')).toBe(other);
      expect(
        resolvePendingJobCreate(undefined, 'req_job_1', listed('j', requestedAt), 'asset-1')
      ).toBeUndefined();
      expect(
        resolvePendingDirectiveRunCreate(undefined, 'req_run_1', run(), 'asset-1')
      ).toBeUndefined();
    });
  });

  describe('matchPendingCreates', () => {
    const match = (
      pendings: Parameters<typeof matchPendingCreates>[0],
      jobs: RobotsJob[],
      runs: RobotsDirectiveRun[] = [],
      value: MuxContentfulObject = baseValue(),
      links?: Map<string, string>
    ) => Object.fromEntries(matchPendingCreates(pendings, jobs, runs, value, links));

    it('matches a job at either edge of the window, and not one second outside it', () => {
      expect(ROBOTS_CREATE_MATCH_BEFORE_S).toBe(15);
      expect(ROBOTS_CREATE_MATCH_AFTER_S).toBe(120);
      expect(match([pendingJob()], [listed('early', requestedAt - 15)])).toEqual({
        req_job_1: 'early',
      });
      expect(match([pendingJob()], [listed('late', requestedAt + 120)])).toEqual({
        req_job_1: 'late',
      });
      expect(match([pendingJob()], [listed('too_early', requestedAt - 16)])).toEqual({});
      expect(match([pendingJob()], [listed('too_late', requestedAt + 121)])).toEqual({});
    });

    it('matches a run at either edge of the window, and not one second outside it', () => {
      const at = (startedAt: number) => [run({ run_id: `r${startedAt}`, started_at: startedAt })];
      expect(match([pendingRun()], [], at(requestedAt - 15))).toEqual({
        req_run_1: `r${requestedAt - 15}`,
      });
      expect(match([pendingRun()], [], at(requestedAt + 120))).toEqual({
        req_run_1: `r${requestedAt + 120}`,
      });
      expect(match([pendingRun()], [], at(requestedAt - 16))).toEqual({});
      expect(match([pendingRun()], [], at(requestedAt + 121))).toEqual({});
    });

    it('resolves a linked placeholder to its link, even with another job closer', () => {
      const jobs = [listed('closer', requestedAt), listed('linked', requestedAt + 60)];
      expect(
        match([pendingJob()], jobs, [], baseValue(), new Map([['req_job_1', 'linked']]))
      ).toEqual({ req_job_1: 'linked' });
    });

    it('never lets a linked job resolve another placeholder', () => {
      const second = pendingJob({ requestId: 'req_job_2' });
      const jobs = [listed('linked', requestedAt)];
      expect(
        match([pendingJob(), second], jobs, [], baseValue(), new Map([['req_job_1', 'linked']]))
      ).toEqual({ req_job_1: 'linked' });
    });

    it('never matches a job the entry already records', () => {
      const value = baseValue({
        robotsJobs: [{ id: 'recorded', workflow: 'summarize', status: 'completed' }],
      });
      expect(match([pendingJob()], [listed('recorded', requestedAt)], [], value)).toEqual({});
    });

    it('never matches another workflow, or a job with no creation time', () => {
      expect(
        match(
          [pendingJob()],
          [listed('other', requestedAt, 'moderate'), listed('untimed', undefined)]
        )
      ).toEqual({});
    });

    it('lets one job resolve one placeholder, oldest placeholder first', () => {
      const older = pendingJob({ requestId: 'older', requestedAt: requestedAt - 5 });
      const newer = pendingJob({ requestId: 'newer', requestedAt });
      expect(match([newer, older], [listed('only', requestedAt)])).toEqual({ older: 'only' });
    });

    it('takes the closest job, ties to the earlier time and then the smaller id', () => {
      expect(
        match([pendingJob()], [listed('far', requestedAt + 30), listed('near', requestedAt + 2)])
      ).toEqual({ req_job_1: 'near' });
      expect(
        match([pendingJob()], [listed('after', requestedAt + 3), listed('before', requestedAt - 3)])
      ).toEqual({ req_job_1: 'before' });
      expect(match([pendingJob()], [listed('b', requestedAt), listed('a', requestedAt)])).toEqual({
        req_job_1: 'a',
      });
    });

    it('never matches a run on another asset, with no start time, or already recorded', () => {
      expect(match([pendingRun()], [], [run({ subject_id: 'asset-2' })])).toEqual({});
      expect(match([pendingRun()], [], [run({ started_at: undefined })])).toEqual({});
      expect(match([pendingRun()], [], [run({ directive_id: 'drv_2' })])).toEqual({});
      const recorded = baseValue({
        robotsDirectiveRuns: [{ runId: 'drvrun_1', directiveId: 'drv_1' }],
      });
      expect(match([pendingRun()], [], [run()], recorded)).toEqual({});
    });

    it('tolerates a Mux clock a little ahead of the browser, and fails closed past that', () => {
      // `requestedAt` is the browser's clock and `started_at` is Mux's.
      expect(match([pendingRun()], [], [run({ started_at: requestedAt + 30 })])).toEqual({
        req_run_1: 'drvrun_1',
      });
      expect(match([pendingRun()], [], [run({ started_at: requestedAt - 600 })])).toEqual({});
    });

    it('tolerates recorded ids stored as something other than an array', () => {
      const garbled = baseValue({ robotsJobs: 'nonsense' as never });
      expect(match([pendingJob()], [listed('j', requestedAt)], [], garbled)).toEqual({
        req_job_1: 'j',
      });
    });
  });

  describe('resolvePendingCreatesFromReads', () => {
    it('removes the placeholder a listed job resolves, and leaves the job to be recorded after', () => {
      const value = baseValue({ version: 4, robotsPendingCreates: [pendingJob()] });
      const next = resolvePendingCreatesFromReads(
        value,
        [listed('rjob_1', requestedAt)],
        [],
        'asset-1'
      );
      expect(next && 'robotsPendingCreates' in next).toBe(false);
      expect(next?.robotsJobs).toBeUndefined();
    });

    it('records the run that resolves a directive placeholder', () => {
      const value = baseValue({ version: 4, robotsPendingCreates: [pendingRun()] });
      const next = resolvePendingCreatesFromReads(value, [], [run()], 'asset-1');
      expect(next && 'robotsPendingCreates' in next).toBe(false);
      expect(next?.robotsDirectiveRuns?.map(({ runId }) => runId)).toEqual(['drvrun_1']);
    });

    it('removes a linked placeholder whether or not the read shows its job yet', () => {
      const value = baseValue({ version: 4, robotsPendingCreates: [pendingJob()] });
      const next = resolvePendingCreatesFromReads(
        value,
        [],
        [],
        'asset-1',
        new Map([['req_job_1', 'rjob_created']])
      );
      expect(next && 'robotsPendingCreates' in next).toBe(false);
    });

    it('returns the same reference when nothing resolves', () => {
      const value = baseValue({ version: 4, robotsPendingCreates: [pendingJob()] });
      expect(resolvePendingCreatesFromReads(value, [], [], 'asset-1')).toBe(value);
      const none = baseValue();
      expect(resolvePendingCreatesFromReads(none, [listed('j', requestedAt)], [], 'asset-1')).toBe(
        none
      );
    });

    it('writes nothing onto another asset, or onto no value', () => {
      const other = baseValue({ assetId: 'asset-2', robotsPendingCreates: [pendingJob()] });
      expect(resolvePendingCreatesFromReads(other, [listed('j', requestedAt)], [], 'asset-1')).toBe(
        other
      );
      expect(resolvePendingCreatesFromReads(undefined, [], [], 'asset-1')).toBeUndefined();
    });
  });
});

describe('pending creates on screen', () => {
  const requestedAt = 1_700_000_000;
  const placeholder = (
    overrides: Partial<RobotsPendingJobCreate> = {}
  ): RobotsPendingJobCreate => ({
    requestId: 'req_1',
    kind: 'job',
    workflow: 'summarize',
    requestedAt,
    ...overrides,
  });
  const listedJob = (id: string, createdAt: number | undefined): RobotsJob =>
    ({ id, workflow: 'summarize', status: 'pending', created_at: createdAt } as RobotsJob);

  const rows = (overrides: Partial<Parameters<typeof pendingCreateRows>[0]> = {}) =>
    pendingCreateRows({
      stored: [],
      settled: new Set(),
      links: new Map(),
      jobs: [],
      runs: [],
      value: baseValue(),
      nowS: requestedAt + 1,
      ...overrides,
    }).map(({ pending, phase }) => [pending.requestId, phase]);

  const local = (phase: LocalPendingCreate['phase'], pending = placeholder()) => ({
    pending,
    phase,
  });

  describe('pendingCreateRows', () => {
    it('shows a create that is saving, or waiting for a publish, before anything is stored', () => {
      expect(rows({ local: local('saving') })).toEqual([['req_1', 'starting']]);
      expect(rows({ local: local('waiting-for-publish') })).toEqual([
        ['req_1', 'waiting-for-publish'],
      ]);
    });

    it('shows nothing for a sent create whose placeholder has gone', () => {
      expect(rows({ local: local('sending') })).toEqual([]);
      expect(rows({ local: local('unconfirmed') })).toEqual([]);
    });

    it('takes the local phase over the stored one, and never shows a request twice', () => {
      expect(
        rows({ stored: [placeholder()], local: local('sending'), nowS: requestedAt + 60 })
      ).toEqual([['req_1', 'starting']]);
      expect(rows({ stored: [placeholder()], local: local('unconfirmed') })).toEqual([
        ['req_1', 'unconfirmed'],
      ]);
      expect(rows({ stored: [placeholder()], local: local('saving') })).toEqual([
        ['req_1', 'starting'],
      ]);
    });

    it('hides what this tab has settled', () => {
      expect(
        rows({
          stored: [placeholder()],
          local: local('waiting-for-publish'),
          settled: new Set(['req_1']),
        })
      ).toEqual([]);
    });

    it('hides a row whose linked or matched job is on screen', () => {
      const shown = [listedJob('rjob_new', requestedAt + 3)];
      expect(rows({ stored: [placeholder()], jobs: shown })).toEqual([]);
      expect(
        rows({
          stored: [placeholder()],
          jobs: [listedJob('rjob_linked', requestedAt + 500)],
          links: new Map([['req_1', 'rjob_linked']]),
        })
      ).toEqual([]);
      // A link to a job not on screen yet keeps the row, so there is never neither.
      expect(
        rows({ stored: [placeholder()], links: new Map([['req_1', 'rjob_elsewhere']]) })
      ).toEqual([['req_1', 'starting']]);
    });

    it('never matches a create that has not been sent, even with a fresh job of its workflow', () => {
      const earlier = [listedJob('rjob_dashboard', requestedAt - 5)];
      expect(rows({ local: local('saving'), jobs: earlier })).toEqual([['req_1', 'starting']]);
      expect(
        rows({ stored: [placeholder()], local: local('waiting-for-publish'), jobs: earlier })
      ).toEqual([['req_1', 'waiting-for-publish']]);
    });

    it('reads a stored placeholder as starting for the grace period, then as not confirmed', () => {
      expect(ROBOTS_CREATE_CONFIRM_GRACE_S).toBe(45);
      expect(rows({ stored: [placeholder()], nowS: requestedAt + 44 })).toEqual([
        ['req_1', 'starting'],
      ]);
      expect(rows({ stored: [placeholder()], nowS: requestedAt + 45 })).toEqual([
        ['req_1', 'unconfirmed'],
      ]);
    });
  });

  describe('jobTableRows and runTableRows', () => {
    const pendingAt = (requestId: string, at: number): PendingCreateRow => ({
      pending: placeholder({ requestId, requestedAt: at }),
      phase: 'starting',
    });

    it('sort newest first, missing times last, pending first on a tie and then by id', () => {
      const ordered = jobTableRows(
        [pendingAt('req_b', 20), pendingAt('req_a', 20)],
        [
          listedJob('j_untimed', undefined),
          listedJob('j_old', 10),
          listedJob('j_tie', 20),
          listedJob('j_new', 30),
        ]
      ).map(({ key }) => key);
      expect(ordered).toEqual([
        'j_new',
        'create:req_a',
        'create:req_b',
        'j_tie',
        'j_old',
        'j_untimed',
      ]);
    });

    it('order runs by when they started, the same way', () => {
      const pendingRun: PendingCreateRow = {
        pending: {
          requestId: 'req_run',
          kind: 'directive-run',
          directiveId: 'drv_1',
          requestedAt: 20,
        },
        phase: 'starting',
      };
      const ordered = runTableRows([pendingRun], [
        { run_id: 'r_untimed' },
        { run_id: 'r_old', started_at: 10 },
        { run_id: 'r_new', started_at: 30 },
      ] as RobotsDirectiveRun[]).map(({ key }) => key);
      expect(ordered).toEqual(['r_new', 'create:req_run', 'r_old', 'r_untimed']);
    });
  });

  /**
   * Testing Library cannot see intermediate renders, so the property "never both rows, never
   * neither" is held here, over every state a create can pass through on its way to its job.
   */
  describe('the swap from pending row to job row', () => {
    const others = [
      listedJob('j_older', requestedAt - 600),
      listedJob('j_newer', requestedAt + 600),
    ];
    const created = listedJob('rjob_created', requestedAt + 2);
    const pending = placeholder();
    const stored = baseValue({ version: 4, robotsPendingCreates: [pending] });
    const recorded = baseValue({
      version: 4,
      robotsJobs: [{ id: 'rjob_created', workflow: 'summarize', status: 'pending' }],
    });

    const tableAt = (state: {
      value: MuxContentfulObject;
      local?: LocalPendingCreate;
      links?: Map<string, string>;
      jobs: RobotsJob[];
    }) =>
      jobTableRows(
        pendingCreateRows({
          stored: pendingCreatesOf(state.value),
          local: state.local,
          settled: new Set(),
          links: state.links ?? new Map(),
          jobs: state.jobs,
          runs: [],
          value: state.value,
          nowS: requestedAt + 5,
        }),
        state.jobs
      ).map(({ key }) => key);

    const expectOneAtIndex = (keys: string[]) => {
      const pendingIndex = keys.indexOf('create:req_1');
      const jobIndex = keys.indexOf('rjob_created');
      expect([pendingIndex, jobIndex].filter((index) => index >= 0)).toHaveLength(1);
      expect(Math.max(pendingIndex, jobIndex)).toBe(1);
    };

    it('holds through a create that ends in a 202', () => {
      const links = new Map([['req_1', 'rjob_created']]);
      const states = [
        { value: stored, local: local('sending', pending), jobs: others },
        { value: stored, local: local('sending', pending), links, jobs: [created, ...others] },
        { value: stored, links, jobs: [created, ...others] },
        { value: recorded, links, jobs: [created, ...others] },
      ];
      for (const state of states) expectOneAtIndex(tableAt(state));
    });

    it('holds through a create resolved by a list read', () => {
      const states = [
        { value: stored, jobs: others },
        { value: stored, jobs: [created, ...others] },
        { value: recorded, jobs: [created, ...others] },
      ];
      for (const state of states) expectOneAtIndex(tableAt(state));
    });
  });
});
