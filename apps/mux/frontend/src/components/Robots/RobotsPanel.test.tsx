/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useCallback, useRef, useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import RobotsPanel from './RobotsPanel';
import RobotsErrorBoundary from './RobotsErrorBoundary';
import { MuxApiError } from '../../util/muxApi';
import {
  ROBOTS_POLL_INTERVAL_MS,
  ROBOTS_UNCONFIRMED_RECHECK_TICKS,
  cachedRobotsCapability,
  recordRobotsCapability,
  resetRobotsCapabilityCache,
} from '../../util/robots';
import { RobotsPendingCreate } from '../../util/robotsTypes';
import { MuxContentfulObject } from '../../util/types';

/**
 * Every state the Robots tab can render.
 *
 * The four capability states are the ones that matter most: they are only distinguishable because
 * `muxProxy` forwards Mux's `error.type`, so a regression there collapses three of them into one
 * generic 403 and these tests are what would catch it.
 */

/** The entry these tests run in. */
const ids = { space: 'space-1', environment: 'master', entry: 'entry-1' };

const sdk = {
  ids,
  field: { id: 'muxVideo' },
  locales: { default: 'en-US' },
  contentType: { fields: [] },
  entry: { fields: {} },
  notifier: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
} as unknown as FieldExtensionSDK;

const value = (extra: Partial<MuxContentfulObject> = {}): MuxContentfulObject =>
  ({ version: 3, assetId: 'asset-1', ready: true, ...extra } as MuxContentfulObject);

const renderPanel = (overrides: Record<string, any> = {}) =>
  render(
    <RobotsPanel
      sdk={sdk}
      muxApi={overrides.muxApi}
      value={'value' in overrides ? overrides.value : value()}
      isActive={overrides.isActive ?? true}
      updateField={overrides.updateField ?? vi.fn(async () => undefined)}
      resync={overrides.resync ?? vi.fn(async () => undefined)}
      defaultDirectiveIds={overrides.defaultDirectiveIds ?? []}
      canRunRobots={overrides.canRunRobots ?? true}
    />
  );

const apiThatFailsWith = (error: unknown) => ({
  listRobotsJobs: vi.fn(async () => {
    throw error;
  }),
  listRobotsDirectives: vi.fn(async () => ({ data: [] })),
  listRobotsDirectiveRuns: vi.fn(async () => ({ data: [] })),
});

/**
 * `GET /robots/v0/jobs` returns a six-field summary — no `outputs`, `parameters`,
 * `units_consumed` or `errors`. `getRobotsJob` is where those live, so it is mocked separately
 * and deliberately returns nothing extra unless a test says otherwise.
 */
const apiThatReturns = (jobs: unknown[], details: Record<string, unknown> = {}) => ({
  listRobotsJobs: vi.fn(async () => ({ data: jobs })),
  getRobotsJob: vi.fn(async (_workflow: string, jobId: string) => ({
    data: details[jobId] ?? (jobs as any[]).find((job) => job.id === jobId),
  })),
  listRobotsDirectives: vi.fn(async () => ({ data: [] })),
  listRobotsDirectiveRuns: vi.fn(async () => ({ data: [] })),
});

type Mutator = (current: MuxContentfulObject | undefined) => MuxContentfulObject | undefined;

interface PanelWrite {
  mutate: Mutator;
  options?: { save?: boolean; onParked?: () => void; flushOnUnmount?: boolean };
}

/**
 * `updateField` the way `App` runs it: each write applies its mutator to what is stored, and the
 * panel renders the result. `land` decides when a write lands — at once by default; a test can
 * hold one, or make it fail, the way the publish gate or a refused save would.
 */
const renderWithStore = (
  initial: MuxContentfulObject | undefined,
  {
    land,
    ...props
  }: Record<string, any> & {
    land?: (write: PanelWrite, apply: () => void) => Promise<void> | void;
  } = {}
) => {
  let stored = initial;
  const writes: PanelWrite[] = [];
  let show: (next: MuxContentfulObject | undefined) => void = () => undefined;
  let activate: () => void = () => undefined;

  const Harness: FC = () => {
    const [value, setValue] = useState(initial);
    const [isActive, setIsActive] = useState<boolean>(props.isActive ?? true);
    show = setValue;
    activate = () => setIsActive(true);
    const updateField = useCallback(async (mutate: Mutator, options?: PanelWrite['options']) => {
      const write = { mutate, options };
      writes.push(write);
      const apply = () => {
        stored = mutate(stored);
        setValue(stored);
      };
      if (land) return land(write, apply);
      apply();
    }, []);
    return (
      <RobotsPanel
        sdk={props.sdk ?? sdk}
        muxApi={props.muxApi}
        value={value}
        isActive={isActive}
        updateField={updateField}
        resync={noResync}
        defaultDirectiveIds={props.defaultDirectiveIds ?? noDirectives}
        canRunRobots={props.canRunRobots ?? true}
      />
    );
  };

  const view = render(<Harness />);
  return {
    ...view,
    read: () => stored,
    writes,
    savedWrites: () => writes.filter((write) => write.options?.save),
    /** Another tab's write, arriving the way `onValueChanged` delivers it. */
    replace: (next: MuxContentfulObject | undefined) =>
      act(() => {
        stored = next;
        show(next);
      }),
    activate: () => act(() => activate()),
  };
};

/** A placeholder as the panel stores it. */
const pendingJob = (overrides: Partial<RobotsPendingCreate> = {}): RobotsPendingCreate =>
  ({
    requestId: '9f2c0b7a41d3e865',
    kind: 'job',
    workflow: 'summarize',
    requestedAt: Math.floor(Date.now() / 1000),
    ...overrides,
  } as RobotsPendingCreate);

describe('RobotsPanel capability states', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  it('enabled: shows the job table and a way to run something', async () => {
    renderPanel({
      muxApi: apiThatReturns([
        {
          id: 'rjob_1',
          workflow: 'summarize',
          status: 'completed',
          created_at: 1_700_000_000,
        },
      ]),
    });

    await waitFor(() => expect(screen.getByText('Run a workflow')).toBeInTheDocument());
    expect(screen.getByTestId('robots_job_table')).toBeInTheDocument();
    expect(screen.getByText('Summarize')).toBeInTheDocument();
  });

  it('not enabled: explains what Robots is instead of showing an error', async () => {
    renderPanel({ muxApi: apiThatFailsWith(new MuxApiError('Forbidden', 403)) });

    await waitFor(() => expect(screen.getByTestId('robots-not-enabled')).toBeInTheDocument());
    expect(screen.queryByText('Run a workflow')).not.toBeInTheDocument();
  });

  it('scope missing: says a new token is needed, because the scope cannot be added', async () => {
    renderPanel({
      muxApi: apiThatFailsWith(
        new MuxApiError('Token is missing the robots:* scope', 403, 'insufficient_scope')
      ),
    });

    await waitFor(() => expect(screen.getByTestId('robots-scope-missing')).toBeInTheDocument());
    expect(screen.getByText(/cannot be added to a token that already exists/)).toBeInTheDocument();
  });

  it("scope missing: says it in our words only, without repeating Mux's under them", async () => {
    const said = "This token hasn't been granted the correct scope for this operation.";
    renderPanel({ muxApi: apiThatFailsWith(new MuxApiError(said, 401, 'unauthorized')) });

    await waitFor(() => expect(screen.getByTestId('robots-scope-missing')).toBeInTheDocument());
    expect(screen.queryByText(said, { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByText(/Mux said/)).not.toBeInTheDocument();
  });

  it("terms not accepted: links the page Mux named, and not Mux's sentence", async () => {
    // The sentence was the only thing on screen that said where the terms are accepted. It is
    // gone, so the link has to come across — and nothing may tell this account to replace a
    // token that works.
    const page = 'https://dashboard.mux.com/organizations/org-1/environments/env-1/robots/jobs';
    const said = `Go to your Robots page in the Mux Dashboard to accept the terms: ${page}`;
    renderPanel({ muxApi: apiThatFailsWith(new MuxApiError(said, 403, 'forbidden')) });

    const note = await screen.findByTestId('robots-not-enabled');
    expect(
      within(note).getByRole('link', { name: /Accept the Robots terms in your Mux dashboard/ })
    ).toHaveAttribute('href', page);
    expect(screen.queryByText(said, { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByTestId('robots-scope-missing')).not.toBeInTheDocument();
  });

  it('terms not accepted, no page named: links the dashboard, which needs no account ids', async () => {
    renderPanel({ muxApi: apiThatFailsWith(new MuxApiError('Forbidden', 403, 'forbidden')) });

    const note = await screen.findByTestId('robots-not-enabled');
    expect(
      within(note).getByRole('link', { name: /Accept the Robots terms in your Mux dashboard/ })
    ).toHaveAttribute('href', 'https://dashboard.mux.com');
  });

  it('remembers an unavailable answer for the session, so the next entry does not re-ask', async () => {
    // The session cache used to be filled by a dedicated probe that short-circuited the whole
    // load. With the probe gone, the read that fills it is the panel's own — and the *second*
    // entry opened in the same tab still has to cost nothing. An account does not acquire the
    // `robots:*` scope between two entries.
    const first = apiThatFailsWith(new MuxApiError('Forbidden', 403));
    const { unmount } = renderPanel({ muxApi: first });
    await waitFor(() => expect(screen.getByTestId('robots-not-enabled')).toBeInTheDocument());
    unmount();

    const second = apiThatFailsWith(new MuxApiError('Forbidden', 403));
    renderPanel({ muxApi: second });

    expect(screen.getByTestId('robots-not-enabled')).toBeInTheDocument();
    await waitFor(() => expect(second.listRobotsJobs).not.toHaveBeenCalled());
  });

  it('no video yet: asks for one rather than calling Mux', async () => {
    const muxApi = apiThatReturns([]);
    renderPanel({ muxApi, value: undefined });

    expect(screen.getByText('Add a video before running Robots workflows.')).toBeInTheDocument();
    expect(muxApi.listRobotsJobs).not.toHaveBeenCalled();
  });

  it('inactive tab: costs nothing, so opening an entry does not pay for Robots', async () => {
    const muxApi = apiThatReturns([]);
    renderPanel({ muxApi, isActive: false });

    await waitFor(() => expect(muxApi.listRobotsJobs).not.toHaveBeenCalled());
  });
});

/**
 * Admins always see the run controls; everyone else only once an admin turns on "Let everyone run
 * Robots". The switch is resolved by the caller (`canRunRobots`), so the panel is told the answer.
 * Results stay visible either way, because reading costs nothing. See ADR-0016.
 */
describe('RobotsPanel for people who cannot run Robots', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  const jobs = [
    { id: 'rjob_running', workflow: 'summarize', status: 'processing', created_at: 1_700_000_100 },
    { id: 'rjob_done', workflow: 'moderate', status: 'completed', created_at: 1_700_000_000 },
  ];
  const directiveApi = () => ({
    ...apiThatReturns(jobs),
    listRobotsDirectives: vi.fn(async () => ({ data: [{ id: 'drv_1', name: 'Publish' }] })),
  });

  it('offers the run controls to someone who can', async () => {
    renderPanel({ muxApi: directiveApi(), canRunRobots: true });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeEnabled()
    );
    expect(screen.getByRole('button', { name: 'Run directive' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.queryByTestId('robots-admins-only')).not.toBeInTheDocument();
  });

  it('shows everyone else the results, and nothing that starts or stops a run', async () => {
    renderPanel({ muxApi: directiveApi(), canRunRobots: false });

    await waitFor(() => expect(screen.getByTestId('robots_job_table')).toBeInTheDocument());
    expect(screen.getByTestId('robots-admins-only')).toHaveTextContent(
      /Only space admins can run Robots here/
    );
    expect(screen.getByRole('button', { name: 'View output' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply summary' })).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: 'Run a workflow' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Run directive' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Directive' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });
});

describe('RobotsPanel spend guards', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  it('blocks a run on a video already queued for deletion', async () => {
    renderPanel({
      muxApi: apiThatReturns([]),
      value: value({
        pendingActions: {
          delete: [{ type: 'asset', id: 'asset-1', retry: 0 }],
          create: [],
          update: [],
        },
      }),
    });

    await waitFor(() =>
      expect(
        screen.getByText('This video is marked for deletion at the next publish.')
      ).toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeDisabled();
  });

  /**
   * The button used to be hidden until a summary existed, which made the whole feature invisible
   * to anyone who had not already run the workflow that enables it. It is now always rendered,
   * and disabled-with-a-reason is what carries the "not yet" — so what these two assert is
   * discoverability, not merely the enabled/disabled flip.
   */
  it('shows the apply button before there is anything to apply, disabled', async () => {
    renderPanel({ muxApi: apiThatReturns([]) });
    await waitFor(() => expect(screen.getByText('Run a workflow')).toBeInTheDocument());

    expect(screen.getByRole('button', { name: 'Apply summary' })).toBeDisabled();
  });

  it('says on hover what the apply button would do and what has to happen first', async () => {
    renderPanel({ muxApi: apiThatReturns([]) });
    await waitFor(() => expect(screen.getByText('Run a workflow')).toBeInTheDocument());

    fireEvent.mouseOver(screen.getByRole('button', { name: 'Apply summary' }));

    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveTextContent(
        /Run a Summarize workflow to apply its title, description and tags/
      )
    );
  });

  it('enables apply once a summary has been stored', async () => {
    renderPanel({
      muxApi: apiThatReturns([]),
      value: value({ robotsOutputs: { summarize: { jobId: 'rjob_1', title: 'A title' } } }),
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Apply summary' })).toBeEnabled()
    );
  });
});

describe('RobotsPanel field writes', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  it('never writes the field directly — everything goes through updateField', async () => {
    const updateField = vi.fn(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (mutate: (current: any) => any) => undefined
    );
    renderPanel({
      muxApi: apiThatReturns([
        { id: 'rjob_1', workflow: 'summarize', status: 'completed', created_at: 1 },
      ]),
      updateField,
    });

    await waitFor(() => expect(updateField).toHaveBeenCalled());
    expect(typeof updateField.mock.calls[0][0]).toBe('function');
  });

  it('hands back the stored value untouched when a read says nothing new, so it cannot flip to Changed', async () => {
    const recorded = { id: 'rjob_1', workflow: 'summarize', status: 'processing' } as const;
    const stored = value({ version: 4, robotsJobs: [recorded] });
    const results: unknown[] = [];
    const updateField = vi.fn(async (mutate: any) => {
      results.push(mutate(stored));
    });

    renderPanel({ muxApi: apiThatReturns([{ ...recorded }]), value: stored, updateField });

    await waitFor(() => expect(results.length).toBeGreaterThan(0));
    for (const result of results) expect(result).toBe(stored);
  });

  it('resyncs the asset once when a track-producing workflow finishes', async () => {
    const resync = vi.fn(async () => undefined);
    renderPanel({
      muxApi: apiThatReturns([
        {
          id: 'rjob_caption',
          workflow: 'generate-premium-captions',
          status: 'completed',
          created_at: 1,
        },
      ]),
      resync,
    });

    await waitFor(() => expect(resync).toHaveBeenCalledTimes(1));
  });

  it('resyncs after a workflow that attaches no track, because it can still change the asset', async () => {
    // This used to assert the opposite, gated on a `TRACK_PRODUCING_WORKFLOWS` list. The gate was
    // wrong: `summarize` with `update_asset_meta` writes the asset's title and description,
    // `find-best-thumbnails` with `update_asset_thumbnail` moves its poster, and `moderate` with
    // `on_flagged: delete_playback_ids` removes playback ids outright. None attach a track, all
    // three left the mirror stale until something else happened to refresh it.
    const resync = vi.fn(async () => undefined);
    renderPanel({
      muxApi: apiThatReturns([
        { id: 'rjob_sum', workflow: 'summarize', status: 'completed', created_at: 1 },
      ]),
      resync,
    });

    await waitFor(() => expect(resync).toHaveBeenCalledTimes(1));
    expect(resync).toHaveBeenCalledWith({ silent: true, skipPlayerResync: true });
  });

  it('resyncs once per job however many times the list is read', async () => {
    // The dedup is what makes "resync for every workflow" affordable: one GET per newly-completed
    // job per session, not one per poll tick.
    const nowSeconds = Math.floor(Date.now() / 1000);
    const done = {
      id: 'rjob_sum',
      workflow: 'summarize',
      status: 'completed',
      created_at: nowSeconds,
    };
    const running = {
      id: 'rjob_live',
      workflow: 'find-scenes',
      status: 'processing',
      created_at: nowSeconds,
    };
    const resync = vi.fn(async () => undefined);
    const muxApi = {
      listRobotsJobs: vi.fn(async () => ({ data: [{ ...done }, { ...running }] })),
      getRobotsJob: vi.fn(async (_workflow: string, id: string) => ({ data: { ...done, id } })),
      listRobotsDirectives: vi.fn(async () => ({ data: [] })),
      listRobotsDirectiveRuns: vi.fn(async () => ({ data: [] })),
    };

    vi.useFakeTimers();
    try {
      renderPanel({ muxApi, resync });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });
      expect(resync).toHaveBeenCalledTimes(1);

      for (let tick = 0; tick < 3; tick += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(ROBOTS_POLL_INTERVAL_MS + 100);
        });
      }

      expect(muxApi.listRobotsJobs.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(resync).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not resync for a job that has not finished', async () => {
    const resync = vi.fn(async () => undefined);
    renderPanel({
      muxApi: apiThatReturns([
        { id: 'rjob_sum', workflow: 'summarize', status: 'processing', created_at: 1 },
      ]),
      resync,
    });

    await waitFor(() => expect(screen.getByTestId('robots_job_table')).toBeInTheDocument());
    expect(resync).not.toHaveBeenCalled();
  });
});

describe('RobotsPanel — a job create is guarded by a placeholder on the entry', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  const createdJob = () => ({
    id: 'rjob_new',
    workflow: 'summarize',
    status: 'pending',
    created_at: Math.floor(Date.now() / 1000),
  });

  it('saves the placeholder before anything is sent to Mux', async () => {
    let release: () => void = () => undefined;
    const createRobotsJob = vi.fn(async () => ({ data: createdJob() }));
    const store = renderWithStore(value(), {
      muxApi: { ...apiThatReturns([]), createRobotsJob },
      land: (write: PanelWrite, apply: () => void) =>
        write.options?.save && !store.read()?.robotsPendingCreates
          ? new Promise<void>((resolve) => {
              release = () => {
                apply();
                resolve();
              };
            })
          : apply(),
    });

    await runSummarize();
    await waitFor(() => expect(store.savedWrites()).toHaveLength(1));
    // Saved at once; dropped rather than flushed if the editor closes before it lands; and it
    // says when it is waiting behind a publish.
    expect(store.savedWrites()[0].options).toEqual({
      save: true,
      flushOnUnmount: false,
      onParked: expect.any(Function),
    });
    expect(store.savedWrites()[0].mutate(value())?.robotsPendingCreates).toEqual([
      expect.objectContaining({ kind: 'job', workflow: 'summarize' }),
    ]);
    // Held: nothing has been sent.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(createRobotsJob).not.toHaveBeenCalled();

    await act(async () => release());
    await waitFor(() => expect(createRobotsJob).toHaveBeenCalledTimes(1));
  });

  it('sends nothing, and says so, when the placeholder cannot be saved', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const createRobotsJob = vi.fn(async () => ({ data: createdJob() }));
    renderWithStore(value(), {
      muxApi: { ...apiThatReturns([]), createRobotsJob },
      land: (write: PanelWrite, apply: () => void) => {
        if (write.options?.save) throw new Error('This entry is archived.');
        apply();
      },
    });

    await runSummarize();
    await waitFor(() =>
      expect(sdk.notifier.error).toHaveBeenCalledWith(
        'Could not record this run on the entry, so it was not started.'
      )
    );
    expect(createRobotsJob).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('replaces the placeholder with the job record in one saved write', async () => {
    const store = renderWithStore(value(), {
      muxApi: {
        ...apiThatReturns([]),
        createRobotsJob: vi.fn(async () => ({ data: createdJob() })),
      },
    });

    await runSummarize();
    await waitFor(() =>
      expect(store.read()?.robotsJobs?.map(({ id }) => id)).toEqual(['rjob_new'])
    );
    expect(store.read()?.robotsPendingCreates).toBeUndefined();
    expect(store.read()?.version).toBe(4);

    // The second saved write is the resolution: on its own it turns the placeholder into the job.
    const [placeholder, resolution] = store.savedWrites();
    const withPlaceholder = placeholder.mutate(value());
    const resolved = resolution.mutate(withPlaceholder);
    expect(resolved?.robotsPendingCreates).toBeUndefined();
    expect(resolved?.robotsJobs?.map(({ id }) => id)).toEqual(['rjob_new']);
    expect(resolution.options).toEqual({ save: true });
  });

  it('removes the placeholder when Mux refuses the run, and says why', async () => {
    const store = renderWithStore(value(), {
      muxApi: {
        ...apiThatReturns([]),
        createRobotsJob: vi.fn(async () => {
          throw new MuxApiError('The tone parameter is not valid.', 400);
        }),
      },
    });

    await runSummarize();
    await waitFor(() =>
      expect(sdk.notifier.error).toHaveBeenCalledWith('The tone parameter is not valid.')
    );
    await waitFor(() => expect(store.savedWrites()).toHaveLength(2));
    expect(store.savedWrites()[1].options).toEqual({ save: true });
    expect(store.read()?.robotsPendingCreates).toBeUndefined();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeEnabled()
    );
  });

  it('reads a 409 as an identical run already going, removes the placeholder and re-reads', async () => {
    const muxApi = {
      ...apiThatReturns([]),
      createRobotsJob: vi.fn(async () => {
        throw new MuxApiError(
          'A job with the same workflow and parameters is already pending or processing.',
          409
        );
      }),
    };
    const store = renderWithStore(value(), { muxApi });

    await runSummarize();
    const readsBefore = muxApi.listRobotsJobs.mock.calls.length;
    await waitFor(() =>
      expect(sdk.notifier.warning).toHaveBeenCalledWith(
        'This workflow is already running on this video with the same settings.'
      )
    );
    await waitFor(() => expect(store.read()?.robotsPendingCreates).toBeUndefined());
    await waitFor(() =>
      expect(muxApi.listRobotsJobs.mock.calls.length).toBeGreaterThan(readsBefore)
    );
    expect(sdk.notifier.error).not.toHaveBeenCalled();
  });

  it('keeps the placeholder when the outcome is unknown, and offers an informed way out', async () => {
    const store = renderWithStore(value(), {
      muxApi: {
        ...apiThatReturns([]),
        createRobotsJob: vi.fn(async () => {
          throw new Error('The app action response is taking longer than expected to process.');
        }),
      },
    });

    await runSummarize();
    expect(await screen.findByTestId('robots-job-unconfirmed')).toHaveTextContent(
      /Mux has not confirmed the Summarize run requested at .+\. It may already be running and billing, so nothing was retried\./
    );
    expect(sdk.notifier.warning).toHaveBeenCalledWith(
      'Mux has not answered about the Summarize run yet. The Robots tab keeps checking.'
    );
    expect(pendingCreatesIn(store.read())).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeDisabled();

    // Only the editor clears it, and the clearing is saved.
    const writesBefore = store.writes.length;
    fireEvent.click(screen.getByRole('button', { name: 'Nothing is running — let me try again' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeEnabled()
    );
    expect(store.read()?.robotsPendingCreates).toBeUndefined();
    expect(store.writes.slice(writesBefore).map(({ options }) => options)).toEqual([
      { save: true },
    ]);
  });

  it('shows no warning while its own create is still on its way', async () => {
    const store = renderWithStore(value(), {
      muxApi: {
        ...apiThatReturns([]),
        createRobotsJob: vi.fn(() => new Promise(() => undefined)),
      },
    });

    await runSummarize();
    await waitFor(() => expect(pendingCreatesIn(store.read())).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByTestId('robots-job-unconfirmed')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeDisabled();
  });

  it('blocks Run on first paint for an entry that already holds a placeholder', () => {
    recordRobotsCapability({ state: 'enabled' });
    renderWithStore(value({ version: 4, robotsPendingCreates: [pendingJob()] }), {
      muxApi: apiThatReturns([]),
    });
    expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeDisabled();
  });

  it('reads the list for a fresh placeholder without the tab being open', async () => {
    const muxApi = apiThatReturns([]);
    renderWithStore(value({ version: 4, robotsPendingCreates: [pendingJob()] }), {
      muxApi,
      isActive: false,
    });
    await waitFor(() => expect(muxApi.listRobotsJobs).toHaveBeenCalled());
  });

  it('does not resume for a placeholder older than six hours, and still blocks Run', async () => {
    const muxApi = apiThatReturns([]);
    const store = renderWithStore(
      value({
        version: 4,
        robotsPendingCreates: [
          pendingJob({ requestedAt: Math.floor(Date.now() / 1000) - 7 * 60 * 60 }),
        ],
      }),
      { muxApi, isActive: false }
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(muxApi.listRobotsJobs).not.toHaveBeenCalled();

    store.activate();
    await waitFor(() => expect(muxApi.listRobotsJobs).toHaveBeenCalled());
    expect(await screen.findByRole('button', { name: 'Run a workflow' })).toBeDisabled();
  });

  it("blocks Run as soon as another tab's placeholder arrives", async () => {
    const store = renderWithStore(value(), { muxApi: apiThatReturns([]) });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeEnabled()
    );

    store.replace(value({ version: 4, robotsPendingCreates: [pendingJob()] }));
    expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeDisabled();
  });

  it('resolves the placeholder from a list read that shows the job, and gives Run back', async () => {
    const requestedAt = Math.floor(Date.now() / 1000) - 60;
    let listed: unknown[] = [];
    const muxApi = {
      ...apiThatReturns([]),
      listRobotsJobs: vi.fn(async () => ({ data: listed.map((row) => ({ ...(row as object) })) })),
    };
    const store = renderWithStore(
      value({ version: 4, robotsPendingCreates: [pendingJob({ requestedAt })] }),
      { muxApi }
    );
    expect(await screen.findByTestId('robots-job-unconfirmed')).toBeInTheDocument();

    // It was running the whole time, and now it is in the list.
    listed = [
      {
        id: 'rjob_found',
        workflow: 'summarize',
        status: 'processing',
        created_at: requestedAt + 4,
      },
    ];
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeEnabled()
    );
    expect(store.read()?.robotsPendingCreates).toBeUndefined();
    expect(store.read()?.robotsJobs?.map(({ id }) => id)).toEqual(['rjob_found']);
  });
});

/**
 * What the editor sees while a run starts: a row in the table where the job will appear, from the
 * click until the job or run replaces it, in every tab and after a reload. See ADR-0003.
 */
describe('RobotsPanel — what the editor sees while a run starts', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  const nowSeconds = () => Math.floor(Date.now() / 1000);
  const createdJob = () => ({
    id: 'rjob_new',
    workflow: 'summarize',
    status: 'pending',
    created_at: nowSeconds(),
  });
  const pendingCells = () => screen.queryAllByTestId(/^robots-pending-/);
  const jobTable = () => screen.getByTestId('robots_job_table');
  const isPlaceholderSave = (write: PanelWrite) => write.options?.flushOnUnmount === false;
  const runButton = () => screen.getByRole('button', { name: 'Run a workflow' });

  /** Holds the placeholder save the way the publish gate does: parked, told so, applied later. */
  const parkPlaceholder = () => {
    const held: { release: () => void; write?: PanelWrite; reject: (error: Error) => void } = {
      release: () => undefined,
      reject: () => undefined,
    };
    const land = (write: PanelWrite, apply: () => void) => {
      if (!isPlaceholderSave(write)) return apply();
      held.write = write;
      write.options?.onParked?.();
      return new Promise<void>((resolve, reject) => {
        held.release = () => {
          apply();
          resolve();
        };
        held.reject = reject;
      });
    };
    return { held, land };
  };

  it('shows Starting… at once, while the placeholder is still being saved, with the modal closed', async () => {
    // The save never lands.
    const land = (write: PanelWrite, apply: () => void) =>
      isPlaceholderSave(write) ? new Promise<void>(() => undefined) : apply();
    renderWithStore(value(), { muxApi: { ...apiThatReturns([]), createRobotsJob: vi.fn() }, land });

    await runSummarize();

    expect(within(jobTable()).getByText('Starting…')).toBeInTheDocument();
    expect(pendingCells()[0]).toHaveTextContent('Waiting for Mux');
    expect(screen.queryByRole('button', { name: 'Run Summarize' })).not.toBeInTheDocument();
    expect(runButton()).toBeDisabled();
    expect(runButton()).toHaveAttribute('title', 'A run is starting on this video.');
  });

  it('starts one run for two confirms in one frame', async () => {
    const createRobotsJob = vi.fn(async () => ({ data: createdJob() }));
    const store = renderWithStore(value(), {
      muxApi: { ...apiThatReturns([]), createRobotsJob },
    });
    await waitFor(() => expect(runButton()).toBeEnabled());
    fireEvent.click(runButton());
    fireEvent.click(await screen.findByRole('button', { name: 'Continue' }));
    const confirm = await screen.findByRole('button', { name: 'Run Summarize' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    await waitFor(() => expect(store.read()?.robotsJobs).toHaveLength(1));
    expect(createRobotsJob).toHaveBeenCalledTimes(1);
    expect(store.writes.filter(isPlaceholderSave)).toHaveLength(1);
  });

  it('says it waits for the publish, and sends nothing, while the placeholder is parked', async () => {
    const { land } = parkPlaceholder();
    const createRobotsJob = vi.fn();
    renderWithStore(value(), { muxApi: { ...apiThatReturns([]), createRobotsJob }, land });

    await runSummarize();

    expect(await within(jobTable()).findByText('Waiting for publish')).toBeInTheDocument();
    expect(pendingCells()[0]).toHaveTextContent('Starts after the publish finishes');
    expect(screen.getByRole('button', { name: 'Don’t start' })).toBeInTheDocument();
    expect(runButton()).toBeDisabled();
    expect(screen.queryByTestId('robots-job-unconfirmed')).not.toBeInTheDocument();
    expect(sdk.notifier.warning).not.toHaveBeenCalled();
    expect(sdk.notifier.success).not.toHaveBeenCalled();
    expect(createRobotsJob).not.toHaveBeenCalled();
  });

  it('sends nothing and writes nothing for a create withdrawn while parked', async () => {
    const { held, land } = parkPlaceholder();
    const createRobotsJob = vi.fn();
    const store = renderWithStore(value(), {
      muxApi: { ...apiThatReturns([]), createRobotsJob },
      land,
    });
    await runSummarize();
    fireEvent.click(await screen.findByRole('button', { name: 'Don’t start' }));

    expect(pendingCells()).toHaveLength(0);
    expect(runButton()).toBeEnabled();

    // The publish lands later and releases the write: its mutator now changes nothing.
    const before = store.read();
    expect(held.write?.mutate(before)).toBe(before);
    await act(async () => held.release());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(createRobotsJob).not.toHaveBeenCalled();
    expect(store.read()?.robotsPendingCreates).toBeUndefined();
    expect(sdk.notifier.error).not.toHaveBeenCalled();
  });

  it('lets the editor start again straight after withdrawing, while the gate still holds', async () => {
    const { land } = parkPlaceholder();
    const store = renderWithStore(value(), {
      muxApi: { ...apiThatReturns([]), createRobotsJob: vi.fn() },
      land,
    });
    await runSummarize();
    fireEvent.click(await screen.findByRole('button', { name: 'Don’t start' }));

    await runSummarize();
    await waitFor(() => expect(store.writes.filter(isPlaceholderSave)).toHaveLength(2));
    expect(await within(jobTable()).findByText('Waiting for publish')).toBeInTheDocument();
  });

  it('sends nothing, and says why, when the editor closes before the parked save lands', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { held, land } = parkPlaceholder();
    const createRobotsJob = vi.fn();
    renderWithStore(value(), { muxApi: { ...apiThatReturns([]), createRobotsJob }, land });
    await runSummarize();
    await within(jobTable()).findByText('Waiting for publish');

    // What `updateField` does to a `flushOnUnmount: false` write at unmount.
    await act(async () =>
      held.reject(
        Object.assign(new Error('The editor closed before this write could be made.'), {
          name: 'DiscardedFieldWriteError',
        })
      )
    );

    await waitFor(() =>
      expect(sdk.notifier.error).toHaveBeenCalledWith(
        'Could not record this run on the entry, so it was not started.'
      )
    );
    expect(createRobotsJob).not.toHaveBeenCalled();
    expect(pendingCells()).toHaveLength(0);
    consoleError.mockRestore();
  });

  it('turns the row into the job from the 202, before the resolution write lands', async () => {
    let releaseResolution: () => void = () => undefined;
    const store = renderWithStore(value(), {
      muxApi: {
        ...apiThatReturns([]),
        createRobotsJob: vi.fn(async () => ({ data: createdJob() })),
      },
      land: (write: PanelWrite, apply: () => void) => {
        const isResolution =
          write.options?.save && !isPlaceholderSave(write) && !!store.read()?.robotsPendingCreates;
        if (!isResolution) return apply();
        return new Promise<void>((resolve) => {
          releaseResolution = () => {
            apply();
            resolve();
          };
        });
      },
    });

    await runSummarize();
    await waitFor(() => expect(within(jobTable()).getByText('pending')).toBeInTheDocument());
    expect(pendingCells()).toHaveLength(0);

    await act(async () => releaseResolution());
    expect(jobTable().querySelectorAll('tbody tr')).toHaveLength(1);
    expect(store.read()?.robotsPendingCreates).toBeUndefined();
  });

  it('explains an unknown outcome once, in the note, and only points at it from the row', async () => {
    renderWithStore(value(), {
      muxApi: {
        ...apiThatReturns([]),
        createRobotsJob: vi.fn(async () => {
          throw new Error('The app action response is taking longer than expected to process.');
        }),
      },
    });

    await runSummarize();

    const note = await screen.findByTestId('robots-job-unconfirmed');
    const row = within(jobTable()).getByText('Not confirmed').closest('tr') as HTMLElement;
    expect(pendingCells()[0]).toHaveTextContent('See the note above');
    expect(screen.getAllByTestId('robots-job-unconfirmed')).toHaveLength(1);
    expect(within(note).getByRole('button', { name: /Nothing is running/ })).toBeInTheDocument();
    expect(row).not.toHaveTextContent(/billing|retried|refuses/);
    expect(sdk.notifier.warning).toHaveBeenCalledWith(
      'Mux has not answered about the Summarize run yet. The Robots tab keeps checking.'
    );
    expect(runButton()).toHaveAttribute(
      'title',
      'Mux has not confirmed the last run. See the note above the jobs.'
    );
  });

  it('replaces the Not confirmed row with the job, and the note goes with it', async () => {
    let listed: unknown[] = [];
    const muxApi = {
      ...apiThatReturns([]),
      listRobotsJobs: vi.fn(async () => ({ data: listed.map((row) => ({ ...(row as object) })) })),
      createRobotsJob: vi.fn(async () => {
        throw new Error('The app action response is taking longer than expected to process.');
      }),
    };
    renderWithStore(value(), { muxApi });
    await runSummarize();
    await screen.findByTestId('robots-job-unconfirmed');

    listed = [createdJob()];
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => expect(within(jobTable()).getByText('pending')).toBeInTheDocument());
    expect(pendingCells()).toHaveLength(0);
    expect(screen.queryByTestId('robots-job-unconfirmed')).not.toBeInTheDocument();
    expect(runButton()).toBeEnabled();
  });

  it("shows another tab's create as Starting…, then as Not confirmed without a list read", async () => {
    vi.useFakeTimers();
    try {
      // The first read answers; every later one hangs, so no read can be what relabels the row.
      const listRobotsJobs = vi
        .fn()
        .mockImplementationOnce(async () => ({ data: [] }))
        .mockImplementation(() => new Promise(() => undefined));
      const store = renderWithStore(value(), { muxApi: { ...apiThatReturns([]), listRobotsJobs } });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });

      store.replace(
        value({
          version: 4,
          robotsPendingCreates: [pendingJob({ requestedAt: nowSeconds() - 10 })],
        })
      );
      expect(within(jobTable()).getByText('Starting…')).toBeInTheDocument();
      expect(screen.queryByTestId('robots-job-unconfirmed')).not.toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(34_000);
      });
      expect(within(jobTable()).getByText('Starting…')).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2_000);
      });
      expect(within(jobTable()).getByText('Not confirmed')).toBeInTheDocument();
      expect(screen.getByTestId('robots-job-unconfirmed')).toBeInTheDocument();
      expect(listRobotsJobs.mock.calls.length).toBeLessThanOrEqual(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows a placeholder saved minutes ago as Not confirmed once the tab has loaded', async () => {
    renderWithStore(
      value({
        version: 4,
        robotsPendingCreates: [pendingJob({ requestedAt: nowSeconds() - 300 })],
      }),
      { muxApi: apiThatReturns([]) }
    );
    expect(
      await within(await screen.findByTestId('robots_job_table')).findByText('Not confirmed')
    ).toBeInTheDocument();
    expect(screen.getByTestId('robots-job-unconfirmed')).toBeInTheDocument();
  });

  it('shows someone who cannot run Robots the row, and nothing to act on', async () => {
    renderWithStore(
      value({
        version: 4,
        robotsPendingCreates: [pendingJob({ requestedAt: nowSeconds() - 300 })],
      }),
      { muxApi: apiThatReturns([]), canRunRobots: false }
    );
    expect(
      await within(await screen.findByTestId('robots_job_table')).findByText('Not confirmed')
    ).toBeInTheDocument();
    expect(pendingCells()[0]).toHaveTextContent('Waiting for Mux');
    expect(screen.queryByTestId('robots-job-unconfirmed')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Don’t start' })).not.toBeInTheDocument();
  });

  it('drops the row and gives Run back at once on a refusal, even while its removal waits', async () => {
    const store = renderWithStore(value(), {
      muxApi: {
        ...apiThatReturns([]),
        createRobotsJob: vi.fn(async () => {
          throw new MuxApiError('The tone parameter is not valid.', 400);
        }),
      },
      // Anything saved after the placeholder is the removal, and it is held.
      land: (write: PanelWrite, apply: () => void) =>
        write.options?.save && !isPlaceholderSave(write) ? new Promise(() => undefined) : apply(),
    });

    await runSummarize();
    await waitFor(() => expect(sdk.notifier.error).toHaveBeenCalled());
    expect(pendingCreatesIn(store.read())).toHaveLength(1);
    expect(pendingCells()).toHaveLength(0);
    expect(runButton()).toBeEnabled();
  });

  it('clears exactly the placeholders the note names', async () => {
    const unconfirmed = pendingJob({ requestId: 'req_old', requestedAt: nowSeconds() - 300 });
    const starting = pendingJob({ requestId: 'req_fresh', requestedAt: nowSeconds() });
    const store = renderWithStore(
      value({ version: 4, robotsPendingCreates: [unconfirmed, starting] }),
      { muxApi: apiThatReturns([]) }
    );

    const note = await screen.findByTestId('robots-job-unconfirmed');
    fireEvent.click(within(note).getByRole('button', { name: /Nothing is running/ }));

    await waitFor(() =>
      expect(pendingCreatesIn(store.read()).map(({ requestId }) => requestId)).toEqual([
        'req_fresh',
      ])
    );
    expect(within(jobTable()).getByText('Starting…')).toBeInTheDocument();
    expect(within(jobTable()).queryByText('Not confirmed')).not.toBeInTheDocument();
    expect(runButton()).toBeDisabled();
  });

  it('still shows a pending row when the job list cannot be read', async () => {
    renderWithStore(value({ version: 4, robotsPendingCreates: [pendingJob()] }), {
      muxApi: apiThatFailsWith(new Error('502 from the app-action bridge')),
    });
    expect(await screen.findByText('502 from the app-action bridge')).toBeInTheDocument();
    expect(within(jobTable()).getByText('Starting…')).toBeInTheDocument();
  });

  describe('directive runs', () => {
    const directiveApi = (overrides: Record<string, any> = {}) => ({
      ...apiThatReturns([]),
      listRobotsDirectives: vi.fn(async () => ({ data: [{ id: 'drv_1', name: 'Ingest' }] })),
      listRobotsDirectiveRuns: vi.fn(async () => ({ data: [] })),
      createRobotsDirectiveRun: vi.fn(async () => ({
        data: {
          run_id: 'drvrun_1',
          subject_id: 'asset-1',
          status: 'pending',
          started_at: nowSeconds(),
        },
      })),
      ...overrides,
    });
    const runsTable = () => screen.getByTestId('robots_directive_run_table');
    const runDirective = async () => {
      await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'drv_1' } });
      fireEvent.click(screen.getByRole('button', { name: 'Run directive' }));
    };

    it('shows the row while parked, and a withdrawn run is never asked for', async () => {
      const { held, land } = parkPlaceholder();
      const muxApi = directiveApi();
      renderWithStore(value(), { muxApi, defaultDirectiveIds: ['drv_1'], land });
      await runDirective();

      expect(await within(runsTable()).findByText('Waiting for publish')).toBeInTheDocument();
      expect(within(runsTable()).getByText('Ingest')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Don’t start' }));
      expect(pendingCells()).toHaveLength(0);

      await act(async () => held.release());
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(muxApi.createRobotsDirectiveRun).not.toHaveBeenCalled();
    });

    it('turns the row into the run from the 202', async () => {
      const store = renderWithStore(value(), {
        muxApi: directiveApi(),
        defaultDirectiveIds: ['drv_1'],
      });
      await runDirective();

      await waitFor(() => expect(within(runsTable()).getByText('pending')).toBeInTheDocument());
      expect(pendingCells()).toHaveLength(0);
      await waitFor(() => expect(store.read()?.robotsDirectiveRuns).toHaveLength(1));
      expect(store.read()?.robotsPendingCreates).toBeUndefined();
    });

    it('explains an unknown outcome in its note, and turns the row into the run once listed', async () => {
      let listed: unknown[] = [];
      const muxApi = directiveApi({
        listRobotsDirectiveRuns: vi.fn(async () => ({ data: listed })),
        createRobotsDirectiveRun: vi.fn(async () => {
          throw new Error('The app action response is taking longer than expected to process.');
        }),
      });
      renderWithStore(value(), { muxApi, defaultDirectiveIds: ['drv_1'] });
      await runDirective();

      const note = await screen.findByTestId('robots-directive-run-unconfirmed');
      expect(note).toHaveTextContent(/Mux has not confirmed the run of Ingest requested at/);
      expect(within(runsTable()).getByText('Not confirmed')).toBeInTheDocument();
      expect(pendingCells()[0]).toHaveTextContent('See the note above');

      listed = [
        {
          run_id: 'drvrun_late',
          subject_id: 'asset-1',
          status: 'running',
          started_at: nowSeconds(),
          node_states: [],
        },
      ];
      fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
      await waitFor(() => expect(within(runsTable()).getByText('running')).toBeInTheDocument());
      expect(pendingCells()).toHaveLength(0);
      expect(screen.queryByTestId('robots-directive-run-unconfirmed')).not.toBeInTheDocument();
    });
  });
});

/** The placeholders stored on a value, however the test got it. */
const pendingCreatesIn = (stored: MuxContentfulObject | undefined) =>
  stored?.robotsPendingCreates ?? [];

describe('RobotsErrorBoundary', () => {
  it('keeps a fault in the Robots tab from unmounting the field editor', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Boom = () => {
      throw new Error('boom');
    };

    render(
      <div>
        <span>The rest of the editor</span>
        <RobotsErrorBoundary>
          <Boom />
        </RobotsErrorBoundary>
      </div>
    );

    expect(screen.getByTestId('robots-crashed')).toBeInTheDocument();
    expect(screen.getByText('The rest of the editor')).toBeInTheDocument();
    error.mockRestore();
  });
});

describe('RobotsPanel persistence', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  /**
   * A harness that actually applies the mutators, instead of swallowing them.
   *
   * The original panel tests mocked `updateField` as a no-op and asserted only that it was
   * called — which is why "nothing is ever stored" passed every test it had.
   */
  const withStoredValue = (initial: MuxContentfulObject | undefined) => {
    let stored = initial;
    const updateField = vi.fn(async (mutate: (current: any) => any) => {
      stored = mutate(stored);
    });
    return { updateField, read: () => stored };
  };

  /** What the API really returns from `GET /robots/v0/jobs`: no parameters, no outputs. */
  const summaryRow = (overrides: Record<string, unknown> = {}) => ({
    id: 'rjob_1',
    workflow: 'ask-questions',
    status: 'completed',
    created_at: 1_700_000_000,
    ...overrides,
  });

  it('records a job the editor starts here, immediately', async () => {
    const { updateField, read } = withStoredValue(value());
    const created = summaryRow({ status: 'pending' });

    renderPanel({
      muxApi: {
        ...apiThatReturns([]),
        createRobotsJob: vi.fn(async () => ({ data: created })),
      },
      updateField,
    });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Run a workflow' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Continue' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Run Summarize' }));

    await waitFor(() => expect(read()?.robotsJobs).toHaveLength(1));
    expect(read()?.robotsJobs?.[0]).toMatchObject({ id: 'rjob_1', status: 'pending' });
    expect(read()?.robotsPendingCreates).toBeUndefined();
    // v4 is asserted only because the value now genuinely holds v4 data.
    expect(read()?.version).toBe(4);
  });

  it('updates a recorded job from a later summary, thin as it is', async () => {
    const { updateField, read } = withStoredValue(
      value({
        robotsJobs: [{ id: 'rjob_1', workflow: 'ask-questions', status: 'processing' }],
      })
    );

    renderPanel({ muxApi: apiThatReturns([summaryRow()]), updateField });

    await waitFor(() => expect(read()?.robotsJobs?.[0].status).toBe('completed'));
  });

  it('records a job someone ran in the Mux dashboard', async () => {
    const { updateField, read } = withStoredValue(value());

    renderPanel({ muxApi: apiThatReturns([summaryRow({ id: 'rjob_theirs' })]), updateField });

    await waitFor(() => expect(read()?.robotsJobs?.map(({ id }) => id)).toEqual(['rjob_theirs']));
  });

  it('records a directive-dispatched job with no run listed', async () => {
    const { updateField, read } = withStoredValue(value());

    renderPanel({
      muxApi: apiThatReturns([summaryRow({ id: 'rjob_auto' })]),
      defaultDirectiveIds: ['drv_1'],
      updateField,
    });

    await waitFor(() => expect(read()?.robotsJobs).toHaveLength(1));
    expect(read()?.robotsJobs?.[0].id).toBe('rjob_auto');
  });

  it('leaves an entry with no Robots activity byte-identical', async () => {
    const original = value();
    const { updateField, read } = withStoredValue(original);

    renderPanel({ muxApi: apiThatReturns([]), updateField });

    await waitFor(() =>
      expect(screen.getByText('No Robots jobs have run on this video yet.')).toBeInTheDocument()
    );
    expect(read()).toBe(original);
  });
});

describe('RobotsPanel — a started job is never reported as failed', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  it('reports success even if recording the job on the entry fails', async () => {
    // The job is running and billing. A failed write is our problem, not something to tell the
    // editor a run failed over — they would pay for it twice.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let saves = 0;
    renderWithStore(value(), {
      muxApi: {
        ...apiThatReturns([]),
        createRobotsJob: vi.fn(async () => ({
          data: { id: 'rjob_1', workflow: 'summarize', status: 'pending' },
        })),
      },
      // The placeholder lands; the resolution write after the 202 does not.
      land: (write: PanelWrite, apply: () => void) => {
        if (write.options?.save && (saves += 1) === 2) throw new Error('version conflict');
        apply();
      },
    });

    await runSummarize();

    await waitFor(() => expect(sdk.notifier.success).toHaveBeenCalled());
    expect(sdk.notifier.error).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeEnabled()
    );
    consoleError.mockRestore();
  });
});

describe('RobotsPanel — the fields the list leaves out', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  const withStored = (initial: MuxContentfulObject | undefined) => {
    let stored = initial;
    const updateField = vi.fn(async (mutate: (current: any) => any) => {
      stored = mutate(stored);
    });
    return { updateField, value: initial, read: () => stored };
  };

  const summary = (overrides: Record<string, unknown> = {}) => ({
    id: 'rjob_sum',
    workflow: 'summarize',
    status: 'completed',
    created_at: 1_700_000_000,
    ...overrides,
  });

  it('populates robotsOutputs, which is only possible from the single-job GET', async () => {
    const stored = withStored(
      value({ robotsJobs: [{ id: 'rjob_sum', workflow: 'summarize', status: 'processing' }] })
    );
    const { updateField, read } = stored;

    renderPanel({
      muxApi: apiThatReturns([summary()], {
        rjob_sum: {
          ...summary(),
          units_consumed: 4,
          parameters: { asset_id: 'asset-1' },
          outputs: { title: 'A generated title', tags: ['alpha'] },
        },
      }),
      value: stored.value,
      updateField,
    });

    await waitFor(() => expect(read()?.robotsOutputs?.summarize?.title).toBe('A generated title'));
    expect(read()?.robotsOutputs?.summarize?.tags).toEqual(['alpha']);
    // And the value carries the Robots version, because it now holds Robots data.
    expect(read()?.version).toBe(4);
  });

  it('records units consumed and the failure reason, neither of which the list carries', async () => {
    const stored = withStored(
      value({ robotsJobs: [{ id: 'rjob_sum', workflow: 'summarize', status: 'processing' }] })
    );
    const { updateField, read } = stored;

    renderPanel({
      muxApi: apiThatReturns([summary({ status: 'errored' })], {
        rjob_sum: {
          ...summary({ status: 'errored' }),
          units_consumed: 2,
          errors: [{ message: 'The audio track was too quiet' }],
        },
      }),
      value: stored.value,
      updateField,
    });

    await waitFor(() =>
      expect(read()?.robotsJobs?.[0].error).toBe('The audio track was too quiet')
    );
    expect(read()?.robotsJobs?.[0].units_consumed).toBe(2);
  });

  it('opens a job started elsewhere, so its units and output are not left blank', async () => {
    // Reading a job costs nothing and charges nobody.
    const muxApi = apiThatReturns([summary({ id: 'rjob_theirs' })], {
      rjob_theirs: { ...summary({ id: 'rjob_theirs' }), units_consumed: 7 },
    });
    const { updateField, read } = withStored(value());
    renderPanel({ muxApi, updateField });

    await waitFor(() =>
      expect(muxApi.getRobotsJob).toHaveBeenCalledWith('summarize', 'rjob_theirs')
    );
    expect(await screen.findByText('7')).toBeInTheDocument();
    await waitFor(() => expect(read()?.robotsJobs?.[0]).toMatchObject({ units_consumed: 7 }));
  });

  it('hands Mux the workflow and its parameters, and nothing else', async () => {
    // The body, interim marker included, is pinned in `muxApi.test.ts`.
    const createRobotsJob = vi.fn(async () => ({
      data: { id: 'rjob_new', workflow: 'summarize', status: 'pending' },
    }));
    renderPanel({ muxApi: { ...apiThatReturns([]), createRobotsJob } });

    await runSummarize();

    await waitFor(() => expect(createRobotsJob).toHaveBeenCalled());
    expect(createRobotsJob.mock.calls[0]).toEqual([
      'summarize',
      expect.objectContaining({ asset_id: 'asset-1' }),
    ]);
  });

  it('stops re-reading a job whose detail fetch failed', async () => {
    // Without a tombstone the failed id never lands in the detail cache, so every poll tick
    // re-requests it: a job Robots has purged would 404 in a loop for as long as the entry
    // stays open. Reproducing that needs the two things the real world supplies and a
    // one-shot mock does not — a live poll (something still processing) and a *fresh* array
    // from each list call, which is what actually re-triggers the effect.
    // Recent timestamps matter: `activeJobs` drops anything older than `ROBOTS_STALE_JOB_MS`, so
    // a job dated 1970 is never "in flight" and the poll that reproduces the loop never arms.
    const nowSeconds = Math.floor(Date.now() / 1000);
    const gone = {
      id: 'rjob_gone',
      workflow: 'summarize',
      status: 'errored',
      created_at: nowSeconds,
    };
    const running = {
      id: 'rjob_live',
      workflow: 'summarize',
      status: 'processing',
      created_at: nowSeconds,
    };

    const muxApi = {
      listRobotsJobs: vi.fn(async () => ({ data: [{ ...gone }, { ...running }] })),
      getRobotsJob: vi.fn(async () => {
        throw new Error('404 — job purged');
      }),
      listRobotsDirectives: vi.fn(async () => ({ data: [] })),
      listRobotsDirectiveRuns: vi.fn(async () => ({ data: [] })),
    };

    vi.useFakeTimers();
    try {
      renderPanel({ muxApi, updateField: withStored(value()).updateField });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });
      expect(muxApi.getRobotsJob).toHaveBeenCalledTimes(1);

      // Drive several poll cycles. The list keeps handing back new arrays, so the detail effect
      // re-evaluates every time; only the tombstone stops it asking again.
      for (let tick = 0; tick < 3; tick += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(ROBOTS_POLL_INTERVAL_MS + 100);
        });
      }

      expect(muxApi.listRobotsJobs.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(muxApi.getRobotsJob).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('opens each job at most once', async () => {
    const muxApi = apiThatReturns([summary()]);
    const stored = withStored(
      value({ robotsJobs: [{ id: 'rjob_sum', workflow: 'summarize', status: 'processing' }] })
    );

    renderPanel({ muxApi, value: stored.value, updateField: stored.updateField });

    await waitFor(() => expect(muxApi.getRobotsJob).toHaveBeenCalledTimes(1));
    // Give the effects a few more cycles to prove it does not loop.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(muxApi.getRobotsJob).toHaveBeenCalledTimes(1);
  });
});

/**
 * What happens past the detail window.
 *
 * The background read is capped at the newest 20 terminal jobs, and that cap is the whole reason
 * an asset with a long dashboard history is cheap to open. What it must not do is quietly lie:
 * a row past it had `units_consumed` rendered as an em dash, which reads as "this job consumed
 * nothing" when it means "nobody ever asked". These tests hold both halves at once — the ceiling
 * still holds, *and* every row says which kind of blank it is.
 */
describe('RobotsPanel — Units past the detail window', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  /**
   * More history than the window covers: 24 cancelled jobs, and one completed job older than all
   * of them. The completed one is therefore the row the background pass can never reach — and,
   * because a cancelled row no longer offers an output modal, the only "View output" on screen.
   */
  const OLD_JOB = {
    id: 'rjob_old',
    workflow: 'summarize',
    status: 'completed',
    created_at: 1_700_000_000,
  };

  const longHistory = () => [
    ...Array.from({ length: 24 }, (_, index) => ({
      id: `rjob_c${index}`,
      workflow: 'summarize',
      status: 'cancelled',
      created_at: 1_700_000_001 + index,
    })),
    OLD_JOB,
  ];

  const apiWithLongHistory = () =>
    apiThatReturns(longHistory(), {
      rjob_old: { ...OLD_JOB, units_consumed: 9, outputs: { title: 'A generated title' } },
    });

  /** The background pass has drained as far as the window lets it. */
  const settled = async (muxApi: ReturnType<typeof apiWithLongHistory>) => {
    await waitFor(() => expect(muxApi.getRobotsJob).toHaveBeenCalledTimes(20));
    await new Promise((resolve) => setTimeout(resolve, 50));
  };

  it('stops at the window, and says so rather than showing an em dash', async () => {
    const muxApi = apiWithLongHistory();
    renderPanel({ muxApi });

    await settled(muxApi);
    // The ceiling held: 25 terminal jobs on the asset, 20 detail reads, never the oldest.
    expect(muxApi.getRobotsJob).toHaveBeenCalledTimes(20);
    expect(muxApi.getRobotsJob).not.toHaveBeenCalledWith('summarize', 'rjob_old');

    // And the row it never reached says which kind of blank it is.
    expect(screen.getByTestId('robots-load-units-rjob_old')).toHaveTextContent('Not loaded');
  });

  it('answers a cancelled row without spending a read on it', async () => {
    const muxApi = apiWithLongHistory();
    renderPanel({ muxApi });

    await settled(muxApi);
    // Known from the status alone, so it reads the same inside the window or outside it.
    expect(screen.getByTestId('robots-units-rjob_c0')).toHaveTextContent('Not charged');
    expect(screen.getByTestId('robots-units-rjob_c23')).toHaveTextContent('Not charged');
    // And there is nothing to open on it — the one modal on screen belongs to the completed job.
    expect(screen.getAllByRole('button', { name: 'View output' })).toHaveLength(1);
  });

  it('fills one row on demand, and only that row', async () => {
    const muxApi = apiWithLongHistory();
    renderPanel({ muxApi });

    await settled(muxApi);
    fireEvent.click(screen.getByTestId('robots-load-units-rjob_old'));

    await waitFor(() => expect(screen.getByTestId('robots-units-rjob_old')).toHaveTextContent('9'));
    // Exactly one more request than the bounded pass made: volume tracks interest, not history.
    expect(muxApi.getRobotsJob).toHaveBeenCalledTimes(21);
    expect(muxApi.getRobotsJob).toHaveBeenCalledWith('summarize', 'rjob_old');
  });

  it('keeps what the output modal already paid for', async () => {
    // The modal reads the whole job to show the result. Until this, that record died with the
    // modal and the row behind it went straight back to saying it knew nothing about its units.
    const muxApi = apiWithLongHistory();
    renderPanel({ muxApi });

    await settled(muxApi);
    fireEvent.click(screen.getByRole('button', { name: 'View output' }));

    await waitFor(() => expect(screen.getByTestId('robots-units-rjob_old')).toHaveTextContent('9'));
    expect(screen.queryByTestId('robots-load-units-rjob_old')).not.toBeInTheDocument();
    // One read, not one per open: the row is filled by the fetch the modal was making anyway.
    expect(muxApi.getRobotsJob).toHaveBeenCalledTimes(21);
  });

  it('keeps no summary from past the window until its row is read, and keeps it then', async () => {
    // Outputs come from this same bounded read, whoever started the job, so the window bounds
    // them too — a summary past it waits for the click that reads it.
    let stored: MuxContentfulObject | undefined = value();
    const updateField = vi.fn(async (mutate: (current: any) => any) => {
      stored = mutate(stored);
    });
    const muxApi = apiThatReturns(longHistory(), {
      rjob_old: {
        ...OLD_JOB,
        parameters: { asset_id: 'asset-1' },
        outputs: { title: 'A generated title' },
      },
    });
    renderPanel({ muxApi, updateField });

    await settled(muxApi);
    expect(stored?.robotsOutputs).toBeUndefined();

    fireEvent.click(screen.getByTestId('robots-load-units-rjob_old'));
    await waitFor(() => expect(stored?.robotsOutputs?.summarize?.jobId).toBe('rjob_old'));
  });
});

describe('RobotsPanel — directive runs', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  it('opens a run whose listing omits node_states, so its steps can be shown', async () => {
    // A safety net rather than a normal path: the list does carry node_states.
    const getRobotsDirectiveRun = vi.fn(async () => ({
      data: {
        run_id: 'drvrun_1',
        subject_id: 'asset-1',
        status: 'completed',
        node_states: [{ job_id: 'rjob_auto', workflow_name: 'summarize' }],
      },
    }));

    let stored: any = value();
    const updateField = vi.fn(async (mutate: (current: any) => any) => {
      stored = mutate(stored);
    });

    renderPanel({
      muxApi: {
        listRobotsJobs: vi.fn(async () => ({
          data: [{ id: 'rjob_auto', workflow: 'summarize', status: 'completed', created_at: 1 }],
        })),
        getRobotsJob: vi.fn(async () => ({
          data: { id: 'rjob_auto', workflow: 'summarize', status: 'completed' },
        })),
        listRobotsDirectives: vi.fn(async () => ({ data: [] })),
        // Summary only — no node_states.
        listRobotsDirectiveRuns: vi.fn(async () => ({
          data: [{ run_id: 'drvrun_1', subject_id: 'asset-1' }],
        })),
        getRobotsDirectiveRun,
      },
      defaultDirectiveIds: ['drv_1'],
      value: stored,
      updateField,
    });

    await waitFor(() => expect(getRobotsDirectiveRun).toHaveBeenCalledWith('drv_1', 'drvrun_1'));
    const table = await screen.findByTestId('robots_directive_run_table');
    await waitFor(() =>
      expect(within(table).getByRole('button', { name: 'Show steps' })).toBeEnabled()
    );
  });

  it('does not open a run that already carries its node_states', async () => {
    const getRobotsDirectiveRun = vi.fn();

    renderPanel({
      muxApi: {
        ...apiThatReturns([]),
        listRobotsDirectiveRuns: vi.fn(async () => ({
          data: [
            {
              run_id: 'drvrun_1',
              subject_id: 'asset-1',
              node_states: [{ job_id: 'rjob_auto' }],
            },
          ],
        })),
        getRobotsDirectiveRun,
      },
      defaultDirectiveIds: ['drv_1'],
    });

    await waitFor(() =>
      expect(screen.getByTestId('robots_directive_run_table')).toBeInTheDocument()
    );
    expect(getRobotsDirectiveRun).not.toHaveBeenCalled();
  });
});

/**
 * The shape `GET /robots/v0/directives/{id}/runs` really returns.
 *
 * Mux serialises a run two ways and the difference is load-bearing: the *webhook* payload nests
 * `{ id, directive_id, asset_id, … }`, the *REST* response uses `run_id` and `subject_id` and
 * names no directive at all. The tab was written against the webhook shape, so its
 * `run.asset_id === assetId` filter matched nothing and the runs table was empty forever — and
 * every fixture in this file hand-supplied `asset_id`, which is exactly why it passed.
 *
 * Confirmed against `@mux/mux-node`'s generated `DirectiveRunDetail`; the API reference documents
 * these endpoints with no response schema.
 */
describe('RobotsPanel — the shape the runs endpoint actually returns', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  const wireRun = (overrides: Record<string, unknown> = {}) => ({
    run_id: 'drvrun_1',
    subject_id: 'asset-1',
    status: 'completed',
    started_at: 1_700_000_000,
    completed_at: 1_700_000_100,
    node_states: [
      { reference_id: 'sum', status: 'dispatched', workflow_name: 'summarize', job_id: 'rjob_a' },
    ],
    ...overrides,
  });

  it('lists a run the API returns, which names the asset in subject_id', async () => {
    renderPanel({
      muxApi: {
        ...apiThatReturns([]),
        listRobotsDirectives: vi.fn(async () => ({ data: [{ id: 'drv_1', name: 'Ingest' }] })),
        listRobotsDirectiveRuns: vi.fn(async () => ({ data: [wireRun()] })),
      },
      defaultDirectiveIds: ['drv_1'],
    });

    await waitFor(() =>
      expect(screen.getByTestId('robots_directive_run_table')).toBeInTheDocument()
    );
    expect(screen.queryByText('No directive runs for this video yet.')).not.toBeInTheDocument();
  });

  it('names the directive from the request, because the run never names its own', async () => {
    renderPanel({
      muxApi: {
        ...apiThatReturns([]),
        listRobotsDirectives: vi.fn(async () => ({ data: [{ id: 'drv_1', name: 'Ingest' }] })),
        listRobotsDirectiveRuns: vi.fn(async () => ({ data: [wireRun()] })),
      },
      defaultDirectiveIds: ['drv_1'],
    });

    // Two "Ingest" on screen would be the picker plus the row; the row is the one under test, so
    // assert on the table specifically.
    const table = await screen.findByTestId('robots_directive_run_table');
    await waitFor(() => expect(within(table).getByText('Ingest')).toBeInTheDocument());
  });

  it('drops runs for another asset, which is the only filtering there is', async () => {
    // The API cannot filter runs by asset, so every run of the directive comes back and the
    // narrowing happens here.
    renderPanel({
      muxApi: {
        ...apiThatReturns([]),
        listRobotsDirectiveRuns: vi.fn(async () => ({
          data: [
            wireRun(),
            wireRun({ run_id: 'drvrun_2', subject_id: 'asset-2', status: 'errored' }),
          ],
        })),
      },
      defaultDirectiveIds: ['drv_1'],
    });

    const table = await screen.findByTestId('robots_directive_run_table');
    expect(within(table).getByText('completed')).toBeInTheDocument();
    expect(within(table).queryByText('errored')).not.toBeInTheDocument();
  });

  it('renders rows collapsed, which needs a run id that exists', async () => {
    // `expandedId === run.id` on a run that has no `id` is `undefined === undefined` — every row
    // would come up pre-expanded, and clicking one would collapse all of them.
    renderPanel({
      muxApi: {
        ...apiThatReturns([]),
        listRobotsDirectiveRuns: vi.fn(async () => ({ data: [wireRun()] })),
      },
      defaultDirectiveIds: ['drv_1'],
    });

    const table = await screen.findByTestId('robots_directive_run_table');
    expect(within(table).queryByText('Summarize')).not.toBeInTheDocument();

    fireEvent.click(within(table).getByRole('button', { name: 'Show steps' }));
    expect(within(table).getByText('Summarize')).toBeInTheDocument();
  });

  it('records a directive-dispatched job from a run in the real wire shape', async () => {
    let stored: any = value();
    const updateField = vi.fn(async (mutate: (current: any) => any) => {
      stored = mutate(stored);
    });

    renderPanel({
      muxApi: {
        ...apiThatReturns([
          { id: 'rjob_a', workflow: 'summarize', status: 'completed', created_at: 1_700_000_000 },
        ]),
        listRobotsDirectiveRuns: vi.fn(async () => ({ data: [wireRun()] })),
      },
      defaultDirectiveIds: ['drv_1'],
      value: stored,
      updateField,
    });

    await waitFor(() => expect(stored?.robotsJobs).toHaveLength(1));
    expect(stored?.robotsJobs?.[0].id).toBe('rjob_a');
  });
});

/**
 * Polling across the gap a directive leaves between its workflows.
 *
 * A directive dispatches in sequence, so between job N finishing and job N+1 starting there are
 * zero non-terminal jobs on the asset. Gating the loop on in-flight jobs alone stops it dead in
 * that window, and the rest of the sequence then only appears on a page reload — which is exactly
 * the workaround this was reported with.
 */
describe("RobotsPanel — polling between a directive's workflows", () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  const nowSeconds = Math.floor(Date.now() / 1000);

  /** Recent, because `activeJobs` and `activeDirectiveRuns` both drop anything stale. */
  const liveRun = (overrides: Record<string, unknown> = {}) => ({
    run_id: 'drvrun_1',
    subject_id: 'asset-1',
    status: 'running',
    started_at: nowSeconds,
    node_states: [
      { reference_id: 'one', status: 'dispatched', workflow_name: 'summarize', job_id: 'rjob_a' },
    ],
    ...overrides,
  });

  const finishedJob = {
    id: 'rjob_a',
    workflow: 'summarize',
    status: 'completed',
    created_at: nowSeconds,
  };
  const nextJob = {
    id: 'rjob_b',
    workflow: 'ask-questions',
    status: 'processing',
    created_at: nowSeconds,
  };

  const tick = async (times = 1) => {
    for (let n = 0; n < times; n += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ROBOTS_POLL_INTERVAL_MS + 100);
      });
    }
  };

  it('keeps re-reading the job list while a run is live but no job is in flight', async () => {
    // The whole window: job one is terminal, job two has not been dispatched yet. Nothing is in
    // flight, and only the run knows more work is coming.
    let jobs: unknown[] = [finishedJob];
    const muxApi = {
      listRobotsJobs: vi.fn(async () => ({ data: jobs.map((job) => ({ ...(job as object) })) })),
      getRobotsJob: vi.fn(async (_workflow: string, id: string) => ({
        data: jobs.find((job: any) => job.id === id),
      })),
      listRobotsDirectives: vi.fn(async () => ({ data: [] })),
      listRobotsDirectiveRuns: vi.fn(async () => ({ data: [liveRun()] })),
    };

    vi.useFakeTimers();
    try {
      renderPanel({ muxApi, defaultDirectiveIds: ['drv_1'] });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });

      const afterFirstLoad = muxApi.listRobotsJobs.mock.calls.length;
      await tick(2);
      expect(muxApi.listRobotsJobs.mock.calls.length).toBeGreaterThan(afterFirstLoad);

      // And the job the directive dispatches next shows up without a page reload.
      jobs = [finishedJob, nextJob];
      await tick(2);
      expect(screen.getByText('Ask questions')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops on a run that is stuck, rather than polling an open tab forever', async () => {
    // The terminal condition that keeps the fix above from becoming an unbounded spend: a run
    // still claiming to be `running` six hours on has silently died, and every tick costs an
    // app-action round trip per directive.
    const muxApi = {
      listRobotsJobs: vi.fn(async () => ({ data: [{ ...finishedJob }] })),
      getRobotsJob: vi.fn(async () => ({ data: finishedJob })),
      listRobotsDirectives: vi.fn(async () => ({ data: [] })),
      listRobotsDirectiveRuns: vi.fn(async () => ({
        data: [liveRun({ started_at: nowSeconds - 24 * 3600 })],
      })),
    };

    vi.useFakeTimers();
    try {
      renderPanel({ muxApi, defaultDirectiveIds: ['drv_1'] });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });

      const settled = muxApi.listRobotsJobs.mock.calls.length;
      await tick(3);
      expect(muxApi.listRobotsJobs.mock.calls.length).toBe(settled);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not read a transient failure of the runs list as "the run finished"', async () => {
    // The loop is gated on this list, so dropping a live run because one call threw ends the poll
    // exactly the way an always-empty list did.
    let failNext = false;
    const muxApi = {
      listRobotsJobs: vi.fn(async () => ({ data: [{ ...finishedJob }] })),
      getRobotsJob: vi.fn(async () => ({ data: finishedJob })),
      listRobotsDirectives: vi.fn(async () => ({ data: [] })),
      listRobotsDirectiveRuns: vi.fn(async () => {
        if (failNext) throw new Error('502 from the app-action bridge');
        return { data: [liveRun()] };
      }),
    };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    vi.useFakeTimers();
    try {
      renderPanel({ muxApi, defaultDirectiveIds: ['drv_1'] });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });

      failNext = true;
      await tick(1);
      const afterFailure = muxApi.listRobotsJobs.mock.calls.length;
      await tick(2);
      expect(muxApi.listRobotsJobs.mock.calls.length).toBeGreaterThan(afterFailure);
      // The run is still on screen, too — a failed read is not news about the run.
      expect(screen.getByTestId('robots_directive_run_table')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
      consoleError.mockRestore();
    }
  });

  it('arms the poll from the create response, before the run is listable', async () => {
    // `POST .../runs` answers 202 with the run's id and `pending` before the run is necessarily
    // visible to `GET .../runs`. Without an optimistic row there is nothing non-terminal anywhere
    // and the loop never starts.
    const muxApi = {
      listRobotsJobs: vi.fn(async () => ({ data: [] })),
      listRobotsDirectives: vi.fn(async () => ({ data: [{ id: 'drv_1', name: 'Ingest' }] })),
      listRobotsDirectiveRuns: vi.fn(async () => ({ data: [] })),
      createRobotsDirectiveRun: vi.fn(async () => ({
        data: { run_id: 'drvrun_new', subject_id: 'asset-1', status: 'pending' },
      })),
    };

    vi.useFakeTimers();
    try {
      renderPanel({ muxApi, defaultDirectiveIds: ['drv_1'] });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'drv_1' } });
      fireEvent.click(screen.getByRole('button', { name: 'Run directive' }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });

      expect(muxApi.createRobotsDirectiveRun).toHaveBeenCalledWith('drv_1', 'asset-1');
      // The optimistic row is what the poll gate reads, so it has to be there immediately.
      expect(screen.getByTestId('robots_directive_run_table')).toBeInTheDocument();

      const afterClick = muxApi.listRobotsJobs.mock.calls.length;
      await tick(1);
      expect(muxApi.listRobotsJobs.mock.calls.length).toBeGreaterThan(afterClick);
    } finally {
      vi.useRealTimers();
    }
  });
});

/**
 * The directive path: reconciliation, an in-flight guard, and a record on the entry.
 *
 * It is the more expensive of the two Run buttons — a directive dispatches several billable
 * workflows in sequence — and until now it was the less protected one. A failed create showed a
 * plain error toast, so a cold-start timeout invited the editor to pay for the whole directive
 * twice; and there was no in-flight disable at all, so a double click did it without any help.
 */
describe('RobotsPanel — starting a directive run', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  const nowSeconds = Math.floor(Date.now() / 1000);

  const withStoredValue = (initial: MuxContentfulObject | undefined) => {
    let stored = initial;
    const updateField = vi.fn(async (mutate: (current: any) => any) => {
      stored = mutate(stored);
    });
    return { updateField, value: initial, read: () => stored };
  };

  const directiveApi = (overrides: Record<string, any> = {}) => ({
    ...apiThatReturns([]),
    listRobotsDirectives: vi.fn(async () => ({ data: [{ id: 'drv_1', name: 'Ingest' }] })),
    listRobotsDirectiveRuns: vi.fn(async () => ({ data: [] })),
    createRobotsDirectiveRun: vi.fn(async () => ({
      data: {
        run_id: 'drvrun_1',
        subject_id: 'asset-1',
        status: 'pending',
        started_at: nowSeconds,
      },
    })),
    ...overrides,
  });

  const start = async (muxApi: Record<string, any>, extra: Record<string, any> = {}) => {
    renderPanel({ muxApi, defaultDirectiveIds: ['drv_1'], ...extra });
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'drv_1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run directive' }));
  };

  it('records the run on the entry at creation, in place of its placeholder', async () => {
    // The history of what this entry started, whether or not the run is still among the newest
    // 25 the API returns for that directive.
    const stored = withStoredValue(value());
    await start(directiveApi(), { updateField: stored.updateField, value: stored.value });

    await waitFor(() => expect(stored.read()?.robotsDirectiveRuns).toHaveLength(1));
    expect(stored.read()?.robotsPendingCreates).toBeUndefined();
    expect(stored.read()?.robotsDirectiveRuns?.[0]).toMatchObject({
      runId: 'drvrun_1',
      directiveId: 'drv_1',
      startedAt: nowSeconds,
    });
    // The value holds Robots data now, so the version says so — the same v4 every other Robots
    // key raises to, since they all ship together.
    expect(stored.read()?.version).toBe(4);
  });

  it('fills in the dispatched job ids as the run reports them', async () => {
    const stored = withStoredValue(value());
    let runs: unknown[] = [];
    const muxApi = directiveApi({
      listRobotsDirectiveRuns: vi.fn(async () => ({ data: runs })),
    });

    await start(muxApi, { updateField: stored.updateField, value: stored.value });
    await waitFor(() => expect(stored.read()?.robotsDirectiveRuns).toHaveLength(1));

    // The create response is a run id and `pending`; the jobs arrive over the next few minutes.
    runs = [
      {
        run_id: 'drvrun_1',
        subject_id: 'asset-1',
        status: 'running',
        started_at: nowSeconds,
        node_states: [{ job_id: 'rjob_a', workflow_name: 'summarize' }],
      },
    ];
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => expect(stored.read()?.robotsDirectiveRuns?.[0].jobIds).toEqual(['rjob_a']));
  });

  it('saves the placeholder before the run is asked for', async () => {
    let release: () => void = () => undefined;
    const muxApi = directiveApi();
    const store = renderWithStore(value(), {
      muxApi,
      defaultDirectiveIds: ['drv_1'],
      land: (write: PanelWrite, apply: () => void) =>
        write.options?.save && !store.read()?.robotsPendingCreates
          ? new Promise<void>((resolve) => {
              release = () => {
                apply();
                resolve();
              };
            })
          : apply(),
    });
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'drv_1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run directive' }));

    await waitFor(() => expect(store.savedWrites()).toHaveLength(1));
    expect(store.savedWrites()[0].mutate(value())?.robotsPendingCreates).toEqual([
      expect.objectContaining({ kind: 'directive-run', directiveId: 'drv_1' }),
    ]);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(muxApi.createRobotsDirectiveRun).not.toHaveBeenCalled();

    await act(async () => release());
    await waitFor(() => expect(muxApi.createRobotsDirectiveRun).toHaveBeenCalledTimes(1));
  });

  it('holds a guard instead of an error when Mux never confirms the run', async () => {
    vi.useFakeTimers();
    try {
      const muxApi = directiveApi({
        createRobotsDirectiveRun: vi.fn(async () => {
          throw new Error('The app action response is taking longer than expected to process.');
        }),
      });

      const store = renderWithStore(value(), { muxApi, defaultDirectiveIds: ['drv_1'] });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'drv_1' } });
      fireEvent.click(screen.getByRole('button', { name: 'Run directive' }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });

      expect(screen.getByTestId('robots-directive-run-unconfirmed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Run directive' })).toBeDisabled();
      expect(sdk.notifier.error).not.toHaveBeenCalled();
      expect(pendingCreatesIn(store.read())).toEqual([
        expect.objectContaining({ kind: 'directive-run', directiveId: 'drv_1' }),
      ]);
      // The create is never retried on the app's own initiative.
      expect(muxApi.createRobotsDirectiveRun).toHaveBeenCalledTimes(1);

      // And the way out is the editor's decision, with the situation explained, and it is saved.
      const writesBefore = store.writes.length;
      fireEvent.click(
        screen.getByRole('button', { name: 'Nothing is running — let me try again' })
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10);
      });
      expect(screen.getByRole('button', { name: 'Run directive' })).toBeEnabled();
      expect(store.read()?.robotsPendingCreates).toBeUndefined();
      expect(store.writes.slice(writesBefore).map(({ options }) => options)).toEqual([
        { save: true },
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('resolves the placeholder from the runs list when the run did start', async () => {
    vi.useFakeTimers();
    try {
      const muxApi = directiveApi({
        createRobotsDirectiveRun: vi.fn(async () => {
          throw new Error('taking longer than expected');
        }),
        listRobotsDirectiveRuns: vi.fn(async () => ({
          data: [
            {
              run_id: 'drvrun_started',
              subject_id: 'asset-1',
              status: 'pending',
              started_at: Math.floor(Date.now() / 1000),
            },
          ],
        })),
      });

      const store = renderWithStore(value(), { muxApi, defaultDirectiveIds: ['drv_1'] });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'drv_1' } });
      fireEvent.click(screen.getByRole('button', { name: 'Run directive' }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });

      expect(screen.queryByTestId('robots-directive-run-unconfirmed')).not.toBeInTheDocument();
      expect(store.read()?.robotsDirectiveRuns?.[0].runId).toBe('drvrun_started');
      expect(store.read()?.robotsPendingCreates).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('disables the button while a run is starting, so a double click cannot pay twice', async () => {
    let release: (value: unknown) => void = () => undefined;
    const createRobotsDirectiveRun = vi.fn(
      () =>
        new Promise((resolve) => {
          release = resolve;
        })
    );
    const muxApi = directiveApi({ createRobotsDirectiveRun });
    renderWithStore(value(), { muxApi, defaultDirectiveIds: ['drv_1'] });
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'drv_1' } });
    // Twice in one frame: the second is refused by the ref, before any state has rendered.
    fireEvent.click(screen.getByRole('button', { name: 'Run directive' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run directive' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Run directive' })).toBeDisabled()
    );
    await waitFor(() => expect(createRobotsDirectiveRun).toHaveBeenCalledTimes(1));

    await act(async () => {
      release({
        data: {
          run_id: 'drvrun_1',
          subject_id: 'asset-1',
          status: 'pending',
          started_at: nowSeconds,
        },
      });
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Run directive' })).toBeEnabled()
    );
  });

  it('shows no warning while its own run is still on its way', async () => {
    const store = renderWithStore(value(), {
      muxApi: directiveApi({ createRobotsDirectiveRun: vi.fn(() => new Promise(() => undefined)) }),
      defaultDirectiveIds: ['drv_1'],
    });
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'drv_1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run directive' }));

    await waitFor(() => expect(pendingCreatesIn(store.read())).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByTestId('robots-directive-run-unconfirmed')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run directive' })).toBeDisabled();
  });

  it('reports success even if recording the run on the entry fails', async () => {
    // Same rule as the job path: the run has started and is billing, so a failed *write* must
    // never be reported as a failed *run*. The placeholder lands; the resolution does not.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let saves = 0;
    await start(directiveApi(), {
      updateField: vi.fn(async (_mutate: unknown, options?: { save?: boolean }) => {
        if (options?.save && (saves += 1) === 2) throw new Error('version conflict');
      }),
    });

    await waitFor(() =>
      expect(sdk.notifier.success).toHaveBeenCalledWith('Directive run started.')
    );
    expect(sdk.notifier.error).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('reports a 409 as "already running", and removes the placeholder', async () => {
    const muxApi = directiveApi({
      createRobotsDirectiveRun: vi.fn(async () => {
        throw new MuxApiError('Already running', 409);
      }),
    });
    const store = renderWithStore(value(), { muxApi, defaultDirectiveIds: ['drv_1'] });
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'drv_1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run directive' }));

    await waitFor(() =>
      expect(sdk.notifier.warning).toHaveBeenCalledWith(
        'That directive is already running on this video.'
      )
    );
    await waitFor(() => expect(store.read()?.robotsPendingCreates).toBeUndefined());
    expect(screen.queryByTestId('robots-directive-run-unconfirmed')).not.toBeInTheDocument();
  });

  it('lists the runs of a directive with a create pending, even one that is not configured', async () => {
    const muxApi = directiveApi();
    renderWithStore(
      value({
        version: 4,
        robotsPendingCreates: [
          {
            requestId: 'req_run',
            kind: 'directive-run',
            directiveId: 'drv_elsewhere',
            requestedAt: nowSeconds,
          },
        ],
      }),
      { muxApi, defaultDirectiveIds: [] }
    );

    await waitFor(() =>
      expect(muxApi.listRobotsDirectiveRuns).toHaveBeenCalledWith('drv_elsewhere', {
        limit: 25,
      })
    );
  });
});

/**
 * The reported bug: an `edit-captions` job finishes and its new track only shows up after an F5
 * or a manual Resync. Two causes, both here.
 */
describe('RobotsPanel — a finished job reaching the rest of the editor', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  it('keeps polling a live job after the editor leaves the Robots tab', async () => {
    // The natural thing to do after starting a caption edit is to go and watch the Captions tab
    // for the new track. The poll loop was gated on `isActive`, so that was exactly where nothing
    // was ever polled, nothing was ever seen to finish, and no resync ever fired.
    const running = {
      id: 'rjob_edit',
      workflow: 'edit-captions',
      status: 'processing',
      created_at: Math.floor(Date.now() / 1000),
    };
    const muxApi = apiThatReturns([running]);

    vi.useFakeTimers();
    try {
      const { rerender } = renderPanel({ muxApi });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });
      const afterFirstLoad = muxApi.listRobotsJobs.mock.calls.length;

      // Switch away to the Captions tab.
      rerender(
        <RobotsPanel
          sdk={sdk}
          muxApi={muxApi as any}
          value={value()}
          isActive={false}
          updateField={vi.fn(async () => undefined)}
          resync={vi.fn(async () => undefined)}
          defaultDirectiveIds={[]}
          canRunRobots
        />
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(ROBOTS_POLL_INTERVAL_MS * 2 + 200);
      });

      expect(muxApi.listRobotsJobs.mock.calls.length).toBeGreaterThan(afterFirstLoad);
    } finally {
      vi.useRealTimers();
    }
  });

  it('never starts polling for a tab nobody has opened', async () => {
    // The other half of the same rule: `isActive` still gates the *first* load, so Robots stays
    // free for editors who never touch it.
    const muxApi = apiThatReturns([]);
    vi.useFakeTimers();
    try {
      renderPanel({ muxApi, isActive: false });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ROBOTS_POLL_INTERVAL_MS * 3);
      });
      expect(muxApi.listRobotsJobs).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('reloads the player for a job that finished while the editor was here', async () => {
    // `skipPlayerResync: true` was unconditional, so the player kept its old text tracks and the
    // edited caption only appeared after an F5.
    const nowSeconds = Math.floor(Date.now() / 1000);
    const resync = vi.fn(async () => undefined);
    let status = 'processing';
    const muxApi = {
      listRobotsJobs: vi.fn(async () => ({
        data: [{ id: 'rjob_edit', workflow: 'edit-captions', status, created_at: nowSeconds }],
      })),
      getRobotsJob: vi.fn(async (_workflow: string, id: string) => ({
        data: { id, workflow: 'edit-captions', status },
      })),
      listRobotsDirectives: vi.fn(async () => ({ data: [] })),
      listRobotsDirectiveRuns: vi.fn(async () => ({ data: [] })),
    };

    vi.useFakeTimers();
    try {
      renderPanel({ muxApi, resync });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });
      expect(resync).not.toHaveBeenCalled();

      status = 'completed';
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ROBOTS_POLL_INTERVAL_MS + 200);
      });

      expect(resync).toHaveBeenCalledWith({ silent: true, skipPlayerResync: false });
    } finally {
      vi.useRealTimers();
    }
  });

  it('leaves the player alone for jobs that were already finished before this session', async () => {
    // Otherwise every visit to the Robots tab on an entry with job history restarts whatever the
    // editor was watching.
    const resync = vi.fn(async () => undefined);
    renderPanel({
      muxApi: apiThatReturns([
        { id: 'rjob_old', workflow: 'edit-captions', status: 'completed', created_at: 1 },
      ]),
      resync,
    });

    await waitFor(() => expect(resync).toHaveBeenCalledTimes(1));
    expect(resync).toHaveBeenCalledWith({ silent: true, skipPlayerResync: true });
  });
});

describe('RobotsPanel — what the run form knows about the asset', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  const workflowOption = async (workflow: string) =>
    (await screen.findByLabelText('Workflow')).querySelector(
      `option[value="${workflow}"]`
    ) as HTMLOptionElement;

  it('tells the run form the video is audio-only, so the docs restrictions can apply', async () => {
    // The picker applies them, but only if the panel passes on what it knows.
    renderPanel({
      muxApi: apiThatReturns([]),
      value: value({ audioOnly: true } as Partial<MuxContentfulObject>),
    });

    await waitFor(() => expect(screen.getByText('Run a workflow')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Run a workflow' }));

    expect(await workflowOption('find-scenes')).toBeDisabled();
    expect(await workflowOption('find-best-thumbnails')).toBeDisabled();
  });

  it('does not invent a restriction for a video whose kind is not recorded', async () => {
    renderPanel({ muxApi: apiThatReturns([]), value: value() });

    await waitFor(() => expect(screen.getByText('Run a workflow')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Run a workflow' }));

    expect(await workflowOption('find-scenes')).toBeEnabled();
    await userEvent.selectOptions(await screen.findByLabelText('Workflow'), 'find-scenes');
    expect((screen.getByLabelText('Workflow') as HTMLSelectElement).value).toBe('find-scenes');
  });

  it('tells the run form how long the video is, so a scope past its end is refused', async () => {
    renderPanel({
      muxApi: apiThatReturns([]),
      value: value({ duration: 60 } as Partial<MuxContentfulObject>),
    });

    await waitFor(() => expect(screen.getByText('Run a workflow')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Run a workflow' }));
    fireEvent.change(await screen.findByLabelText('Start time (seconds)'), {
      target: { value: '90' },
    });

    expect(await screen.findByText(/past the end of the video/)).toBeInTheDocument();
  });

  it('does not give a live stream a length, since it is still growing', async () => {
    renderPanel({
      muxApi: apiThatReturns([]),
      value: value({ duration: 60, is_live: true } as Partial<MuxContentfulObject>),
    });

    await waitFor(() => expect(screen.getByText('Run a workflow')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Run a workflow' }));
    fireEvent.change(await screen.findByLabelText('Start time (seconds)'), {
      target: { value: '90' },
    });

    expect(screen.queryByText(/past the end of the video/)).not.toBeInTheDocument();
  });
});

/**
 * Opening a job's output the instant it completes.
 *
 * The reported bug: create an `ask-questions` job, wait for it to show as completed, click View
 * output straight away, and the modal reads "Loading the result from Mux…" forever. Refresh does
 * not clear it; only an F5 does. Wait a while before opening it and it works.
 *
 * What made it timing-dependent is the panel's own bounded detail read. The moment a job turns
 * terminal the panel fetches its full record in the background, and the viewer is handed
 * `jobDetails[id] ?? viewedJob`. Open the modal inside that window and the viewer starts its own
 * fetch against the summary row; when the panel's detail lands the `job` prop changes identity,
 * the viewer's effect re-runs and its cleanup cancels the request that was going to clear the
 * spinner. Nothing ever re-ran the effect after that, which is why only a reload helped.
 *
 * Nothing about this is specific to `ask-questions` — every workflow goes through the same two
 * fetches — so it is driven here over all twelve.
 */
describe('RobotsPanel — opening a job the moment it finishes', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  /** `activeJobs` drops anything older than `ROBOTS_STALE_JOB_MS`, so the poll only arms on a recent job. */
  const nowSeconds = () => Math.floor(Date.now() / 1000);

  const raceApi = (workflow: string, outputs: Record<string, unknown>) => {
    const created = nowSeconds();
    // Flipped by the test rather than counted off the call log, so the job finishes when this
    // test says it does and not on whichever read happens to be the nth.
    let watchedStatus = 'processing';
    /** Resolvers for each `getRobotsJob`, so the panel's read and the viewer's can be ordered by hand. */
    const detailReads: Array<(value: unknown) => void> = [];

    const muxApi = {
      listRobotsJobs: vi.fn(async () => ({
        data: [
          { id: 'rjob_watched', workflow, status: watchedStatus, created_at: created },
          // Something still in flight, so the poll loop stays armed exactly as it does in the
          // report — this bug only shows up while the panel is still polling.
          { id: 'rjob_other', workflow: 'summarize', status: 'processing', created_at: created },
        ],
      })),
      getRobotsJob: vi.fn(
        () => new Promise((resolve) => detailReads.push(resolve as (value: unknown) => void))
      ),
      listRobotsDirectives: vi.fn(async () => ({ data: [] })),
      listRobotsDirectiveRuns: vi.fn(async () => ({ data: [] })),
    };

    const full = {
      id: 'rjob_watched',
      workflow,
      status: 'completed',
      created_at: created,
      outputs,
    };
    return { muxApi, detailReads, full, finish: () => (watchedStatus = 'completed') };
  };

  it.each([
    ['ask-questions', { answers: [{ question: 'Who?', answer: 'The narrator' }] }, 'The narrator'],
    ['summarize', { title: 'A title Mux wrote' }, 'A title Mux wrote'],
    [
      'find-scenes',
      { scenes: [{ start_ms: 0, end_ms: 1000, title: 'Opening scene' }] },
      'Opening scene',
    ],
    ['generate-chapters', { chapters: [{ start_time: 0, title: 'Chapter one' }] }, 'Chapter one'],
    ['find-key-moments', { moments: [{ start_ms: 0, end_ms: 1, title: 'A moment' }] }, 'A moment'],
    [
      'find-best-thumbnails',
      { best_thumbnails: [{ timestamp_ms: 0, description: 'A frame' }] },
      'A frame',
    ],
    ['moderate', { max_scores: { nudity: 0.1 } }, 'nudity'],
    [
      'generate-engagement-insights',
      { overall_insight: { summary: 'Viewers dropped off' } },
      'Viewers dropped off',
    ],
    ['generate-premium-captions', { track_id: 'trk_1' }, 'trk_1'],
    ['edit-captions', { track_id: 'trk_2' }, 'trk_2'],
    ['translate-captions', { track_id: 'trk_3' }, 'trk_3'],
    ['translate-audio', { track_id: 'trk_4' }, 'trk_4'],
  ])('%s: the result is on screen, not a spinner', async (workflow, outputs, expected) => {
    const { muxApi, detailReads, full, finish } = raceApi(workflow, outputs);

    vi.useFakeTimers();
    try {
      renderPanel({ muxApi });

      // First list: nothing terminal yet, so no detail is read and the poll arms.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });
      expect(muxApi.getRobotsJob).not.toHaveBeenCalled();

      // The poll tick that flips the job to completed. The panel starts reading its detail in the
      // background on this same tick — that read is deliberately left in flight.
      finish();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ROBOTS_POLL_INTERVAL_MS + 100);
      });
      expect(muxApi.getRobotsJob).toHaveBeenCalledTimes(1);

      // The editor clicks View output straight away, inside that window.
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'View output' }));
      });
      expect(screen.getByText(/Loading the result from Mux/)).toBeInTheDocument();

      // The panel's background read lands, replacing the summary the viewer was fetching against.
      await act(async () => {
        detailReads[0]({ data: full });
        await vi.advanceTimersByTimeAsync(10);
      });

      // Let the loop go round again: a spinner that survives the poll is the reported bug.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ROBOTS_POLL_INTERVAL_MS + 100);
      });

      expect(screen.queryByText(/Loading the result from Mux/)).toBeNull();
      expect(screen.getByText(new RegExp(expected))).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

/**
 * Concurrency between the two poll loops, the create path and the publish gate.
 *
 * Each of these fails if its fix is reverted; none of them asserts anything about how the fix is
 * implemented, only that the loop keeps running and no read is dropped or applied out of order.
 */
describe('RobotsPanel concurrency', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  const runningJob = (id = 'rjob_live') => ({
    id,
    workflow: 'summarize',
    status: 'processing',
    created_at: Math.floor(Date.now() / 1000),
  });

  it('keeps polling while the parent re-renders', async () => {
    const muxApi = apiThatReturns([runningJob()]);
    vi.useFakeTimers();
    try {
      const props: any = {
        sdk,
        muxApi,
        value: value(),
        isActive: true,
        updateField: vi.fn(async () => undefined),
        resync: vi.fn(async () => undefined),
      };
      // A fresh array each time, exactly as `installation.muxDefaultDirectiveIds ?? []` yields on
      // an install with no directives configured.
      const { rerender } = render(<RobotsPanel {...props} defaultDirectiveIds={[]} />);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });
      const afterFirstLoad = muxApi.listRobotsJobs.mock.calls.length;

      // The asset poll re-renders the field editor every 500 ms while an asset prepares. If that
      // re-arms this timer, it never fires.
      for (let tick = 0; tick < 24; tick += 1) {
        rerender(<RobotsPanel {...props} defaultDirectiveIds={[]} />);
        await act(async () => {
          await vi.advanceTimersByTimeAsync(500);
        });
      }

      expect(muxApi.listRobotsJobs.mock.calls.length).toBeGreaterThan(afterFirstLoad);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps a just-created job on screen when the list has not caught up', async () => {
    const created = runningJob('rjob_new');
    const muxApi = {
      // The list genuinely does not have it yet — `POST` answers before `GET` lists it.
      listRobotsJobs: vi.fn(async () => ({ data: [] })),
      getRobotsJob: vi.fn(async () => ({ data: created })),
      createRobotsJob: vi.fn(async () => ({ data: created })),
      listRobotsDirectives: vi.fn(async () => ({ data: [] })),
      listRobotsDirectiveRuns: vi.fn(async () => ({ data: [] })),
    };

    vi.useFakeTimers();
    try {
      renderPanel({ muxApi });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });

      fireEvent.click(screen.getByText('Run a workflow'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10);
      });
      fireEvent.click(screen.getByText('Continue'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10);
      });
      fireEvent.click(screen.getByText('Run Summarize'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });

      const callsAfterCreate = muxApi.listRobotsJobs.mock.calls.length;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ROBOTS_POLL_INTERVAL_MS + 100);
      });

      // The row is what the poll loop arms on. Losing it to the refresh that runs right after the
      // create leaves a billable job running with nothing watching it.
      expect(screen.getByTestId('robots_job_table').textContent).toContain('Summarize');
      expect(muxApi.listRobotsJobs.mock.calls.length).toBeGreaterThan(callsAfterCreate);
    } finally {
      vi.useRealTimers();
    }
  });

  it('serves a Refresh asked for while a poll tick was already running', async () => {
    let releaseList: (value: unknown) => void = () => undefined;
    const listCalls: number[] = [];
    const muxApi = {
      listRobotsJobs: vi.fn(() => {
        listCalls.push(Date.now());
        // The first read is the one that paints the tab — and it is also the capability check,
        // which is why there is no probe in front of it to account for. Only a later poll tick
        // blocks.
        if (listCalls.length <= 1) return Promise.resolve({ data: [runningJob()] });
        return new Promise((resolve) => {
          releaseList = resolve;
        });
      }),
      getRobotsJob: vi.fn(async () => ({ data: runningJob() })),
      listRobotsDirectives: vi.fn(async () => ({ data: [] })),
      listRobotsDirectiveRuns: vi.fn(async () => ({ data: [] })),
    };

    vi.useFakeTimers();
    try {
      renderPanel({ muxApi });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });

      // A poll tick starts and hangs.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ROBOTS_POLL_INTERVAL_MS + 100);
      });
      expect(muxApi.listRobotsJobs).toHaveBeenCalledTimes(2);

      // The editor presses Refresh while that tick is still in flight. Dropping it silently is
      // the bug: no spinner, no data, nothing.
      fireEvent.click(screen.getByText('Refresh'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10);
      });

      await act(async () => {
        releaseList({ data: [runningJob()] });
        await vi.advanceTimersByTimeAsync(50);
      });

      expect(muxApi.listRobotsJobs.mock.calls.length).toBeGreaterThanOrEqual(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it('reads the runs for one directive one pass at a time', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const muxApi = {
      listRobotsJobs: vi.fn(async () => ({ data: [runningJob()] })),
      getRobotsJob: vi.fn(async () => ({ data: runningJob() })),
      listRobotsDirectives: vi.fn(async () => ({ data: [] })),
      listRobotsDirectiveRuns: vi.fn(async () => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((resolve) => setTimeout(resolve, 200));
        inFlight -= 1;
        return { data: [] };
      }),
    };

    vi.useFakeTimers();
    try {
      renderPanel({ muxApi, defaultDirectiveIds: ['dir_1'] });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });

      // Refresh reads both lists, and so does the poll tick. Overlapping run reads resolve out of
      // order, and the loser puts back runs the newer pass had moved on from.
      fireEvent.click(screen.getByText('Refresh'));
      fireEvent.click(screen.getByText('Refresh'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ROBOTS_POLL_INTERVAL_MS + 400);
      });

      expect(maxInFlight).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('applies the newest read when a parked write is released later', async () => {
    const mutators: Array<(current: any) => any> = [];
    // Stands in for the publish gate: the mutator is held, not applied.
    const updateField = vi.fn(async (mutate: (current: any) => any) => {
      mutators.push(mutate);
    });

    const job = { id: 'rjob_p', workflow: 'summarize', created_at: Math.floor(Date.now() / 1000) };
    let status = 'processing';
    const muxApi = {
      listRobotsJobs: vi.fn(async () => ({ data: [{ ...job, status }] })),
      getRobotsJob: vi.fn(async () => ({
        data: { ...job, status },
      })),
      listRobotsDirectives: vi.fn(async () => ({ data: [] })),
      listRobotsDirectiveRuns: vi.fn(async () => ({ data: [] })),
    };

    vi.useFakeTimers();
    try {
      renderPanel({ muxApi, updateField });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });
      expect(mutators.length).toBeGreaterThan(0);

      // The job finishes while the gate is shut.
      status = 'completed';
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ROBOTS_POLL_INTERVAL_MS + 100);
      });

      // The gate opens and the *oldest* parked mutator is re-applied first. It must not write the
      // `processing` it was queued with over the `completed` that has since been read.
      const applied = mutators[0](value({ robotsJobs: [{ ...job, status: 'completed' }] } as any));
      expect(applied.robotsJobs.find((record: any) => record.id === 'rjob_p').status).toBe(
        'completed'
      );
    } finally {
      vi.useRealTimers();
    }
  });
});

/**
 * Picking a running job back up on an entry that is merely opened.
 *
 * `isActive` keeps Robots free for editors who never open the tab, but an entry reopened while a
 * job it started is still running has to resume on its own — otherwise a publish re-publishes the
 * stale `processing` record. See ADR-0013.
 */
describe('RobotsPanel — resuming a job without opening the tab', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  const nowSeconds = () => Math.floor(Date.now() / 1000);

  const recordedJob = (status: string, createdAt = nowSeconds()) => ({
    id: 'rjob_recorded',
    workflow: 'summarize',
    status,
    created_at: createdAt,
  });

  it('loads and polls for an entry whose record says a job is still running', async () => {
    const muxApi = apiThatReturns([recordedJob('processing')]);

    vi.useFakeTimers();
    try {
      renderPanel({
        muxApi,
        isActive: false,
        value: value({ robotsJobs: [recordedJob('processing')] } as any),
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });
      expect(muxApi.listRobotsJobs).toHaveBeenCalled();

      const afterFirstLoad = muxApi.listRobotsJobs.mock.calls.length;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ROBOTS_POLL_INTERVAL_MS + 100);
      });
      expect(muxApi.listRobotsJobs.mock.calls.length).toBeGreaterThan(afterFirstLoad);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stays silent for an entry whose recorded jobs have all finished', async () => {
    const muxApi = apiThatReturns([recordedJob('completed')]);

    renderPanel({
      muxApi,
      isActive: false,
      value: value({ robotsJobs: [recordedJob('completed')] } as any),
    });
    await new Promise((resolve) => setTimeout(resolve, 50));

    // The whole point of the `isActive` gate: an editor who never opens this tab pays nothing.
    expect(muxApi.listRobotsJobs).not.toHaveBeenCalled();
  });

  it('gives up on a record that has been stuck for longer than the staleness window', async () => {
    const stale = recordedJob('processing', nowSeconds() - 7 * 60 * 60);
    const muxApi = apiThatReturns([stale]);

    renderPanel({ muxApi, isActive: false, value: value({ robotsJobs: [stale] } as any) });
    await new Promise((resolve) => setTimeout(resolve, 50));

    // A job Mux purged, or a session that died mid-run, must not make every open of this entry
    // fetch forever.
    expect(muxApi.listRobotsJobs).not.toHaveBeenCalled();
  });
});

describe('RobotsPanel — when the asset goes away', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  const runningJob = () => ({
    id: 'rjob_running',
    workflow: 'summarize',
    status: 'processing',
    created_at: Math.floor(Date.now() / 1000),
  });

  it('holds nothing once the asset is gone, so nothing survives to be polled or written', async () => {
    const muxApi = apiThatReturns([runningJob()]);
    const updateField = vi.fn(async () => undefined);
    const { rerender } = render(
      <RobotsPanel
        sdk={sdk}
        muxApi={muxApi as never}
        value={value()}
        isActive
        updateField={updateField}
        resync={vi.fn(async () => undefined)}
        defaultDirectiveIds={[]}
        canRunRobots
      />
    );
    await waitFor(() => expect(screen.getByTestId('robots_job_table')).toBeInTheDocument());

    // The asset is deleted and the publish function clears the field.
    rerender(
      <RobotsPanel
        sdk={sdk}
        muxApi={muxApi as never}
        value={undefined}
        isActive
        updateField={updateField}
        resync={vi.fn(async () => undefined)}
        defaultDirectiveIds={[]}
        canRunRobots
      />
    );

    expect(screen.getByText('Add a video before running Robots workflows.')).toBeInTheDocument();
    // Not merely hidden: the job table is gone, which is the only observable proof that the
    // component holding the list, the detail cache and the poll timer is gone with it.
    expect(screen.queryByTestId('robots_job_table')).not.toBeInTheDocument();
  });

  it("never writes one asset's jobs onto another asset's entry", async () => {
    // Pasting a different Mux asset ID replaces the whole value without unmounting this panel.
    const oldJob = {
      id: 'rjob_old',
      workflow: 'summarize',
      status: 'completed',
      created_at: Math.floor(Date.now() / 1000),
    };
    const muxApi = {
      listRobotsJobs: vi.fn(async (query: { asset_id?: string }) =>
        query.asset_id === 'asset-1' ? { data: [oldJob] } : { data: [] }
      ),
      getRobotsJob: vi.fn(async () => ({ data: oldJob })),
      listRobotsDirectives: vi.fn(async () => ({ data: [] })),
      listRobotsDirectiveRuns: vi.fn(async () => ({ data: [] })),
    };
    const updateField = vi.fn(async () => undefined);
    const props = (assetId: string) => ({
      sdk,
      muxApi: muxApi as never,
      value: { assetId } as MuxContentfulObject,
      isActive: true,
      updateField,
      resync: vi.fn(async () => undefined),
      defaultDirectiveIds: [],
      canRunRobots: true,
    });

    const { rerender } = render(<RobotsPanel {...props('asset-1')} />);
    await waitFor(() => expect(muxApi.getRobotsJob).toHaveBeenCalled());

    updateField.mockClear();
    const swapped = { assetId: 'asset-2' } as MuxContentfulObject;
    rerender(<RobotsPanel {...props('asset-2')} />);
    await waitFor(() =>
      expect(muxApi.listRobotsJobs).toHaveBeenCalledWith(
        expect.objectContaining({ asset_id: 'asset-2' })
      )
    );

    // Every mutator queued after the swap, applied to the new asset's value, must be a no-op.
    const queued = updateField.mock.calls as unknown as Array<[(v: unknown) => unknown]>;
    for (const [mutate] of queued) {
      expect(mutate(swapped)).toBe(swapped);
    }
  });

  it('a mutator queued before an asset swap writes nothing when applied after it', async () => {
    const oldJob = {
      id: 'rjob_old',
      workflow: 'summarize',
      status: 'completed',
      created_at: Math.floor(Date.now() / 1000),
    };
    // Held, the way the publish gate holds a write: applied later, to whatever is stored then.
    const held: Array<(current: MuxContentfulObject | undefined) => unknown> = [];
    const updateField = vi.fn(async (mutate: (current: any) => any) => {
      held.push(mutate);
    });
    renderPanel({ muxApi: apiThatReturns([oldJob]), updateField });

    await waitFor(() => expect(held.length).toBeGreaterThan(0));
    const swapped = value({ assetId: 'asset-2' });
    for (const mutate of held) {
      expect(mutate(swapped)).toBe(swapped);
    }
  });
});

describe('RobotsPanel — what the first open costs', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  const jobRow = () => ({
    id: 'rjob_1',
    workflow: 'summarize',
    status: 'completed',
    created_at: Math.floor(Date.now() / 1000),
  });

  /**
   * Every call here is an app-action round trip — two CMA requests, against a function that may
   * cold-start — so the number of them, and how many are serialized, is the whole of how this tab
   * feels on first open. These are the figures, pinned.
   */
  it('reads the job list once, not twice, because the list is the capability check', async () => {
    const muxApi = apiThatReturns([jobRow()]);
    renderPanel({ muxApi });

    await waitFor(() => expect(screen.getByTestId('robots_job_table')).toBeInTheDocument());
    // Was two: a `listRobotsJobs({ limit: 1 })` probe, awaited, then the real read.
    expect(muxApi.listRobotsJobs).toHaveBeenCalledTimes(1);
    expect(muxApi.listRobotsJobs).toHaveBeenCalledWith({ asset_id: 'asset-1', limit: 100 });
  });

  it('does not wait for the directive list before showing the jobs', async () => {
    let releaseDirectives: (value: unknown) => void = () => undefined;
    const muxApi = {
      ...apiThatReturns([jobRow()]),
      listRobotsDirectives: vi.fn(
        () =>
          new Promise((resolve) => {
            releaseDirectives = resolve;
          })
      ),
    };
    renderPanel({ muxApi });

    // The names are cosmetic, so a slow — or cold-starting — directive list must not be in front
    // of the table the editor opened the tab for.
    await waitFor(() => expect(screen.getByTestId('robots_job_table')).toBeInTheDocument());
    releaseDirectives({ data: [] });
  });

  it('reads runs for the configured directives only, not for every directive in the account', async () => {
    // The listing exists to label the picker. Polling the runs of all fifty directives in an
    // account, one app-action round trip each, to find the one that touched this asset is what
    // it used to cost — and the runs endpoint cannot filter by asset, so the only lever is
    // asking fewer directives.
    //
    // The names are released only after the first run-read pass has finished, which is both the
    // realistic ordering — the directive list is the slower, later read — and the one that
    // actually exercises the widening. Released early it collides with the pass already in
    // flight and `isLoadingRef` drops it, so the old code looked correct for timing reasons
    // rather than for the right reason.
    let releaseDirectives: (value: unknown) => void = () => undefined;
    const muxApi = {
      ...apiThatReturns([jobRow()]),
      listRobotsDirectives: vi.fn(
        () =>
          new Promise((resolve) => {
            releaseDirectives = resolve;
          })
      ),
      listRobotsDirectiveRuns: vi.fn(async () => ({ data: [] })),
    };
    renderPanel({ muxApi, defaultDirectiveIds: ['drv_configured'] });

    await waitFor(() => expect(muxApi.listRobotsDirectiveRuns).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId('robots_job_table')).toBeInTheDocument());

    releaseDirectives({
      data: Array.from({ length: 50 }, (_, index) => ({
        id: `drv_${index}`,
        name: `Directive ${index}`,
      })),
    });
    await waitFor(() => expect(screen.getByText('Directive 0')).toBeInTheDocument());
    // Settle every effect the names could have re-armed before counting.
    for (let turn = 0; turn < 5; turn += 1) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
    }

    const runReads = muxApi.listRobotsDirectiveRuns.mock.calls as unknown as Array<[string]>;
    expect(runReads.length).toBeGreaterThan(0);
    for (const [directiveId] of runReads) {
      expect(directiveId).toBe('drv_configured');
    }
  });

  it("lists a directive's runs once on first open, however many effects ask", async () => {
    // Activation asks, and so does the first load finishing. The second asks for exactly what the
    // first is already reading, so it is dropped rather than queued behind it.
    const muxApi = {
      ...apiThatReturns([jobRow()]),
      listRobotsDirectiveRuns: vi.fn(async () => ({ data: [] })),
    };
    renderPanel({ muxApi, defaultDirectiveIds: ['drv_configured'] });

    await waitFor(() => expect(screen.getByTestId('robots_job_table')).toBeInTheDocument());
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(muxApi.listRobotsDirectiveRuns).toHaveBeenCalledTimes(1);
  });
  it('still polls a directive the entry records but the config has since dropped', async () => {
    const muxApi = {
      ...apiThatReturns([]),
      listRobotsDirectiveRuns: vi.fn(async () => ({ data: [] })),
    };
    renderPanel({
      muxApi,
      defaultDirectiveIds: [],
      value: value({
        robotsDirectiveRuns: [{ runId: 'drvrun_1', directiveId: 'drv_removed' }],
      } as Partial<MuxContentfulObject>),
    });

    await waitFor(() =>
      expect(muxApi.listRobotsDirectiveRuns).toHaveBeenCalledWith('drv_removed', { limit: 25 })
    );
  });
});

/**
 * Rendering what is ready, and saying what is not.
 *
 * Measured before this pass, the tab painted nothing — not the Run button, not the headings —
 * until the job list *and* an asset resync had both come back, because the resync the list
 * triggers was awaited inside the list read: two serialized app-action round trips, three for a
 * signed or DRM asset. Every Mux read is a round trip through `muxProxy`, so the list itself is
 * the floor; what these pin is that nothing else is in front of it.
 */
describe('RobotsPanel — what the tab shows before everything is read', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  const completed = (id: string, created_at = 1_700_000_000) => ({
    id,
    workflow: 'summarize',
    status: 'completed',
    created_at,
  });

  it('shows the jobs without waiting for the asset resync they trigger', async () => {
    const resync = vi.fn(() => new Promise<void>(() => undefined));
    renderPanel({ muxApi: apiThatReturns([completed('rjob_1')]), resync });

    await waitFor(() => expect(screen.getByTestId('robots_job_table')).toBeInTheDocument());
    expect(resync).toHaveBeenCalled();
  });

  it('does not read a failed resync as an answer about Robots', async () => {
    // The resync is an asset GET. Awaited inside the list read, a 401 from it reached the
    // capability classifier and replaced a working tab with the scope explainer.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const resync = vi.fn(async () => {
      throw new MuxApiError('Unauthorized', 401);
    });
    renderPanel({ muxApi: apiThatReturns([completed('rjob_1')]), resync });

    await waitFor(() => expect(screen.getByTestId('robots_job_table')).toBeInTheDocument());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByTestId('robots-scope-missing')).not.toBeInTheDocument();
    expect(cachedRobotsCapability()).toEqual({ state: 'enabled' });
    consoleError.mockRestore();
  });

  it('draws the tab at once when the session already knows Robots is on', async () => {
    recordRobotsCapability({ state: 'enabled' });
    const muxApi = {
      ...apiThatReturns([]),
      listRobotsJobs: vi.fn(() => new Promise(() => undefined)),
    };
    renderPanel({ muxApi });

    // Before the list answers: the controls and headings, and loading rows where the jobs go.
    expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeEnabled();
    expect(screen.getByText('Directives')).toBeInTheDocument();
    expect(screen.getByTestId('robots_job_table_loading')).toBeInTheDocument();
    expect(screen.queryByText(/No Robots jobs have run/)).not.toBeInTheDocument();
  });

  it('shows only a placeholder while it does not know whether Robots is on', () => {
    // Most installs never enable Robots; their tab is about to become a note, not a table.
    const muxApi = {
      ...apiThatReturns([]),
      listRobotsJobs: vi.fn(() => new Promise(() => undefined)),
    };
    renderPanel({ muxApi });

    expect(screen.queryByRole('button', { name: 'Run a workflow' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('robots_job_table_loading')).not.toBeInTheDocument();
  });

  it('keeps an unopened tab inert, even when the session knows Robots is on', () => {
    recordRobotsCapability({ state: 'enabled' });
    const muxApi = apiThatReturns([]);
    renderPanel({ muxApi, isActive: false });

    expect(screen.queryByRole('button', { name: 'Run a workflow' })).not.toBeInTheDocument();
    expect(muxApi.listRobotsJobs).not.toHaveBeenCalled();
    expect(muxApi.listRobotsDirectives).not.toHaveBeenCalled();
  });

  it('says a Units cell is loading while the background read is on its way to it', async () => {
    const reads: Array<(value: unknown) => void> = [];
    const muxApi = {
      ...apiThatReturns([completed('rjob_1')]),
      getRobotsJob: vi.fn(() => new Promise((resolve) => reads.push(resolve))),
    };
    renderPanel({ muxApi });

    const cell = await screen.findByTestId('robots-load-units-rjob_1');
    // Not "Not loaded", which offers a read that is already happening.
    expect(cell).toHaveTextContent('Loading…');
    expect(cell).toBeDisabled();

    await act(async () => {
      reads[0]({ data: { ...completed('rjob_1'), units_consumed: 12 } });
    });
    expect(await screen.findByTestId('robots-units-rjob_1')).toHaveTextContent('12');
  });

  it('still offers the read for a row the background pass will never reach', async () => {
    // The newest twenty are read in the background; the twenty-first is only read on a click.
    const jobs = Array.from({ length: 21 }, (_, index) =>
      completed(`rjob_${index}`, 1_700_000_000 - index)
    );
    const muxApi = {
      ...apiThatReturns(jobs),
      getRobotsJob: vi.fn(() => new Promise(() => undefined)),
    };
    renderPanel({ muxApi });

    const outside = await screen.findByTestId('robots-load-units-rjob_20');
    expect(outside).toHaveTextContent('Not loaded');
    expect(outside).toBeEnabled();
    expect(screen.getByTestId('robots-load-units-rjob_0')).toHaveTextContent('Loading…');
  });

  it('does not say "no directive runs" until it has read them', async () => {
    let release: (value: unknown) => void = () => undefined;
    const muxApi = {
      ...apiThatReturns([]),
      listRobotsDirectiveRuns: vi.fn(() => new Promise((resolve) => (release = resolve))),
    };
    renderPanel({ muxApi, defaultDirectiveIds: ['drv_configured'] });

    await screen.findByText(/No Robots jobs have run/);
    expect(screen.getByTestId('robots_directive_run_table_loading')).toBeInTheDocument();
    expect(screen.queryByText(/No directive runs for this video yet/)).not.toBeInTheDocument();

    await act(async () => {
      release({ data: [] });
    });
    expect(await screen.findByText(/No directive runs for this video yet/)).toBeInTheDocument();
  });

  it('says there are no directive runs straight away when there is nothing to read', async () => {
    renderPanel({ muxApi: apiThatReturns([]) });
    expect(await screen.findByText(/No directive runs for this video yet/)).toBeInTheDocument();
  });

  it('lists directives alongside the jobs once Robots is known to be on', async () => {
    recordRobotsCapability({ state: 'enabled' });
    const muxApi = {
      ...apiThatReturns([]),
      listRobotsJobs: vi.fn(() => new Promise(() => undefined)),
    };
    renderPanel({ muxApi });

    await waitFor(() => expect(muxApi.listRobotsDirectives).toHaveBeenCalled());
  });

  it('does not claim the video has no jobs when the list could not be read', async () => {
    const muxApi = {
      ...apiThatReturns([]),
      listRobotsJobs: vi.fn(async () => {
        throw new MuxApiError('Mux is down', 500);
      }),
    };
    renderPanel({ muxApi });

    expect(await screen.findByText('Mux is down')).toBeInTheDocument();
    expect(screen.queryByText(/No Robots jobs have run/)).not.toBeInTheDocument();
  });
});

/**
 * The directive picker, and where its choices come from. The configured ids are a snapshot of the
 * installation parameters taken when this iframe loaded; the listing is Mux, now, through the
 * saved credentials. See ADR-0009's 2026-09-24 amendment.
 */
describe('RobotsPanel — the directive picker', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  const picker = () => screen.getByLabelText('Directive') as HTMLSelectElement;
  const optionValues = () =>
    Array.from(picker().querySelectorAll('option')).map((option) => option.value);

  it('offers what Mux lists, not the configured ids, once the listing is in', async () => {
    // The reported case: A was configured and deleted, B created. The iframe's parameters still
    // say A; Mux says B.
    const muxApi = {
      ...apiThatReturns([]),
      listRobotsDirectives: vi.fn(async () => ({ data: [{ id: 'drv_B', name: 'B' }] })),
    };
    renderPanel({ muxApi, defaultDirectiveIds: ['drv_A'] });

    await waitFor(() => expect(optionValues()).toEqual(['', 'drv_B']));
  });

  it('offers nothing while the listing is on its way, rather than the snapshot', async () => {
    const muxApi = {
      ...apiThatReturns([]),
      listRobotsDirectives: vi.fn(() => new Promise(() => undefined)),
    };
    renderPanel({ muxApi, defaultDirectiveIds: ['drv_A'] });

    await screen.findByText('Directives');
    expect(optionValues()).toEqual(['']);
    expect(picker()).toBeDisabled();
    expect(picker()).toHaveTextContent('Loading directives…');
  });

  it('falls back to the configured ids only when the listing fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const muxApi = {
      ...apiThatReturns([]),
      listRobotsDirectives: vi.fn(async () => {
        throw new MuxApiError('Down', 500);
      }),
    };
    renderPanel({ muxApi, defaultDirectiveIds: ['drv_A'] });

    await waitFor(() => expect(optionValues()).toEqual(['', 'drv_A']));
    consoleError.mockRestore();
  });

  it('takes an empty listing at its word', async () => {
    const muxApi = {
      ...apiThatReturns([]),
      listRobotsDirectives: vi.fn(async () => ({ data: [] })),
    };
    renderPanel({ muxApi, defaultDirectiveIds: ['drv_A'] });

    await waitFor(() => expect(picker()).toHaveTextContent('No directives in this Mux account'));
    expect(optionValues()).toEqual(['']);
  });

  it('re-lists directives on Refresh, and drops a choice Mux no longer has', async () => {
    let listed = [
      { id: 'drv_A', name: 'A' },
      { id: 'drv_B', name: 'B' },
    ];
    const muxApi = {
      ...apiThatReturns([]),
      listRobotsDirectives: vi.fn(async () => ({ data: listed })),
    };
    renderPanel({ muxApi });

    await waitFor(() => expect(optionValues()).toEqual(['', 'drv_A', 'drv_B']));
    await userEvent.selectOptions(picker(), 'drv_A');
    expect(screen.getByRole('button', { name: 'Run directive' })).toBeEnabled();

    listed = [{ id: 'drv_B', name: 'B' }];
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => expect(optionValues()).toEqual(['', 'drv_B']));
    expect(picker().value).toBe('');
    expect(screen.getByRole('button', { name: 'Run directive' })).toBeDisabled();
  });

  it('keeps the listing it had when a re-list fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let fail = false;
    const muxApi = {
      ...apiThatReturns([]),
      listRobotsDirectives: vi.fn(async () => {
        if (fail) throw new MuxApiError('Down', 500);
        return { data: [{ id: 'drv_B', name: 'B' }] };
      }),
    };
    renderPanel({ muxApi, defaultDirectiveIds: ['drv_A'] });

    await waitFor(() => expect(optionValues()).toEqual(['', 'drv_B']));
    fail = true;
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(muxApi.listRobotsDirectives).toHaveBeenCalledTimes(2));
    expect(optionValues()).toEqual(['', 'drv_B']);
    consoleError.mockRestore();
  });
});

describe('RobotsPanel — an unconfirmed create does not block every workflow forever', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  /**
   * A placeholder blocks **Run a workflow** outright, for every workflow in the catalog, and its
   * only automatic exit is a list read that finds its job. With nothing in flight the loop would
   * not tick, so the placeholder arms it — for a bounded number of ticks.
   */
  const created = () => Math.floor(Date.now() / 1000);

  const settle = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  /** Drives the modal all the way to a create whose outcome Mux never confirms. */
  const startAnUnconfirmedRun = async () => {
    await settle(50);
    fireEvent.click(screen.getByRole('button', { name: 'Run a workflow' }));
    await settle(10);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await settle(10);
    fireEvent.click(screen.getByRole('button', { name: 'Run Summarize' }));
    await settle(50);
    expect(screen.getByTestId('robots-job-unconfirmed')).toBeInTheDocument();
  };

  const timingOut = () =>
    vi.fn(async () => {
      throw new Error('The app action response is taking longer than expected to process.');
    });

  it('keeps looking for the job with nothing in flight, and lifts the guard when it appears', async () => {
    /** The job Mux did create, but had not listed when the create timed out. */
    let listed: unknown[] = [];
    const muxApi = {
      ...apiThatReturns([]),
      listRobotsJobs: vi.fn(async () => ({ data: listed.map((row) => ({ ...(row as object) })) })),
      createRobotsJob: timingOut(),
    };

    vi.useFakeTimers();
    try {
      const store = renderWithStore(value(), { muxApi });
      await startAnUnconfirmedRun();

      // Nothing is in flight — the whole point. The loop has to keep ticking on the guard alone.
      const afterCreate = muxApi.listRobotsJobs.mock.calls.length;
      await settle(ROBOTS_POLL_INTERVAL_MS + 100);
      expect(muxApi.listRobotsJobs.mock.calls.length).toBeGreaterThan(afterCreate);

      // Mux catches up and lists it. The guard lifts without the editor touching anything, and
      // in particular without the one button that would create a second billable job.
      listed = [
        { id: 'rjob_late', workflow: 'summarize', status: 'processing', created_at: created() },
      ];
      await settle(ROBOTS_POLL_INTERVAL_MS + 100);
      expect(screen.queryByTestId('robots-job-unconfirmed')).toBeNull();
      expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeEnabled();
      expect(store.read()?.robotsPendingCreates).toBeUndefined();
      expect(store.read()?.robotsJobs?.map(({ id }) => id)).toEqual(['rjob_late']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops looking after a bounded number of ticks, rather than polling an open tab forever', async () => {
    const muxApi = { ...apiThatReturns([]), createRobotsJob: timingOut() };

    vi.useFakeTimers();
    try {
      renderWithStore(value(), { muxApi });
      await startAnUnconfirmedRun();

      const afterCreate = muxApi.listRobotsJobs.mock.calls.length;
      for (let tick = 0; tick < ROBOTS_UNCONFIRMED_RECHECK_TICKS + 5; tick += 1) {
        await settle(ROBOTS_POLL_INTERVAL_MS + 100);
      }

      const ticksSpent = muxApi.listRobotsJobs.mock.calls.length - afterCreate;
      expect(ticksSpent).toBeGreaterThan(0);
      expect(ticksSpent).toBeLessThanOrEqual(ROBOTS_UNCONFIRMED_RECHECK_TICKS);
      // And the guard is still up: the bound ends the looking, never the protection.
      expect(screen.getByTestId('robots-job-unconfirmed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeDisabled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('gives a placeholder from another tab its own budget to be looked for on', async () => {
    const muxApi = { ...apiThatReturns([]), createRobotsJob: timingOut() };

    vi.useFakeTimers();
    try {
      const store = renderWithStore(value(), { muxApi });
      await startAnUnconfirmedRun();
      for (let tick = 0; tick < ROBOTS_UNCONFIRMED_RECHECK_TICKS + 2; tick += 1) {
        await settle(ROBOTS_POLL_INTERVAL_MS + 100);
      }
      const spent = muxApi.listRobotsJobs.mock.calls.length;

      store.replace({
        ...(store.read() as MuxContentfulObject),
        robotsPendingCreates: [
          ...pendingCreatesIn(store.read()),
          pendingJob({ requestId: 'from_another_tab', requestedAt: created() }),
        ],
      });
      for (let tick = 0; tick < 3; tick += 1) {
        await settle(ROBOTS_POLL_INTERVAL_MS + 100);
      }
      expect(muxApi.listRobotsJobs.mock.calls.length).toBeGreaterThan(spent);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('RobotsPanel — an unconfirmed directive run does not block the button forever', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  /** The job guard's twin: the placeholder arms the loop, for a bounded number of ticks. */
  const settle = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  /** A run that started just now, whenever "now" is. */
  const runStartedNow = () => ({
    run_id: 'drvrun_late',
    subject_id: 'asset-1',
    status: 'pending',
    started_at: Math.floor(Date.now() / 1000),
  });

  /** A directive whose run never comes back confirmed, over a run list the test controls. */
  const unconfirmedApi = (listRuns: () => unknown[]) => ({
    ...apiThatReturns([]),
    listRobotsDirectives: vi.fn(async () => ({ data: [{ id: 'drv_1', name: 'Ingest' }] })),
    listRobotsDirectiveRuns: vi.fn(async () => ({ data: listRuns() })),
    getRobotsDirectiveRun: vi.fn(async (_id: string, runId: string) => ({
      data: listRuns().find((run) => (run as any).run_id === runId),
    })),
    createRobotsDirectiveRun: vi.fn(async () => {
      throw new Error('The app action response is taking longer than expected to process.');
    }),
  });

  /** Drives the picker all the way to a run whose outcome Mux never confirms. */
  const startAnUnconfirmedDirectiveRun = async () => {
    await settle(50);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'drv_1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run directive' }));
    await settle(50);
    expect(screen.getByTestId('robots-directive-run-unconfirmed')).toBeInTheDocument();
  };

  it('keeps looking for the run with nothing in flight, and adopts it when it appears', async () => {
    /** The run Mux did start, but had not listed when the create timed out. */
    let listed: unknown[] = [];
    const muxApi = unconfirmedApi(() => listed);

    vi.useFakeTimers();
    try {
      const stored = renderWithStore(value(), { muxApi, defaultDirectiveIds: ['drv_1'] });
      await startAnUnconfirmedDirectiveRun();

      // Nothing is in flight — the whole point. The loop has to keep ticking on the guard alone.
      const afterCreate = muxApi.listRobotsDirectiveRuns.mock.calls.length;
      await settle(ROBOTS_POLL_INTERVAL_MS + 100);
      expect(muxApi.listRobotsDirectiveRuns.mock.calls.length).toBeGreaterThan(afterCreate);

      // Mux catches up and lists it. The guard lifts without the editor touching anything, and
      // in particular without the one button that would start a second billable run.
      listed = [runStartedNow()];
      await settle(ROBOTS_POLL_INTERVAL_MS + 100);
      expect(screen.queryByTestId('robots-directive-run-unconfirmed')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Run directive' })).toBeEnabled();
      // Recorded on the entry in place of its placeholder, and on screen.
      expect(stored.read()?.robotsDirectiveRuns?.[0].runId).toBe('drvrun_late');
      expect(stored.read()?.robotsPendingCreates).toBeUndefined();
      expect(screen.queryByText('No directive runs for this video yet.')).toBeNull();
      // And never retried on the app's own initiative.
      expect(muxApi.createRobotsDirectiveRun).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops looking after a bounded number of ticks, and the guard survives it', async () => {
    const muxApi = unconfirmedApi(() => []);

    vi.useFakeTimers();
    try {
      renderWithStore(value(), { muxApi, defaultDirectiveIds: ['drv_1'] });
      await startAnUnconfirmedDirectiveRun();

      const afterGuard = muxApi.listRobotsDirectiveRuns.mock.calls.length;
      for (let tick = 0; tick < ROBOTS_UNCONFIRMED_RECHECK_TICKS + 5; tick += 1) {
        await settle(ROBOTS_POLL_INTERVAL_MS + 100);
      }

      const passesSpent = muxApi.listRobotsDirectiveRuns.mock.calls.length - afterGuard;
      expect(passesSpent).toBeGreaterThan(0);
      expect(passesSpent).toBeLessThanOrEqual(ROBOTS_UNCONFIRMED_RECHECK_TICKS);
      // The bound ends the looking, never the protection: ADR-0003's invariant is that nothing
      // time-based re-enables a billable Run.
      expect(screen.getByTestId('robots-directive-run-unconfirmed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Run directive' })).toBeDisabled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('gives a second unconfirmed run its own budget to be looked for on', async () => {
    // The budget is per guard, not per session. Without the reset, an editor who exhausted one
    // bound and then dismissed the guard by hand would get a second guard that never looks at
    // all — back to the original bug, one escape-hatch click later.
    const muxApi = unconfirmedApi(() => []);

    vi.useFakeTimers();
    try {
      renderWithStore(value(), { muxApi, defaultDirectiveIds: ['drv_1'] });
      await startAnUnconfirmedDirectiveRun();

      for (let tick = 0; tick < ROBOTS_UNCONFIRMED_RECHECK_TICKS + 2; tick += 1) {
        await settle(ROBOTS_POLL_INTERVAL_MS + 100);
      }
      fireEvent.click(
        screen.getByRole('button', { name: 'Nothing is running — let me try again' })
      );
      await settle(10);

      fireEvent.click(screen.getByRole('button', { name: 'Run directive' }));
      await settle(50);
      expect(screen.getByTestId('robots-directive-run-unconfirmed')).toBeInTheDocument();

      const afterSecondGuard = muxApi.listRobotsDirectiveRuns.mock.calls.length;
      await settle(ROBOTS_POLL_INTERVAL_MS + 100);
      expect(muxApi.listRobotsDirectiveRuns.mock.calls.length).toBeGreaterThan(afterSecondGuard);
    } finally {
      vi.useRealTimers();
    }
  });

  it('never adopts a run with no start time, however long it keeps looking', async () => {
    // The directive match is asset + recency, with no token to make it exact — so the one thing
    // holding it closed is that a run without `started_at` is not a candidate.
    const muxApi = unconfirmedApi(() => [
      { run_id: 'drvrun_no_start', subject_id: 'asset-1', status: 'pending' },
    ]);

    vi.useFakeTimers();
    try {
      renderWithStore(value(), { muxApi, defaultDirectiveIds: ['drv_1'] });
      await startAnUnconfirmedDirectiveRun();

      for (let tick = 0; tick < ROBOTS_UNCONFIRMED_RECHECK_TICKS + 2; tick += 1) {
        await settle(ROBOTS_POLL_INTERVAL_MS + 100);
      }

      expect(screen.getByTestId('robots-directive-run-unconfirmed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Run directive' })).toBeDisabled();
    } finally {
      vi.useRealTimers();
    }
  });
});

/** Drives the run modal to a summarize create. What the create answers is up to the test. */
const runSummarize = async () => {
  await waitFor(() => expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Run a workflow' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Continue' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Run Summarize' }));
};

const finishedJob = () => ({
  id: 'rjob_done',
  workflow: 'summarize',
  status: 'completed',
  created_at: Math.floor(Date.now() / 1000),
});

/**
 * A refused create is a failed run. It used to be read as an answer about the account: any 401 or
 * 403 on a create replaced the whole tab — so `translate-audio`, which the free plan refuses while
 * running every other workflow, reported its own error and then told the editor Robots was not
 * enabled at all. Only the job list read decides that now.
 */
describe('RobotsPanel — a refused run is a failed run, not a lost account', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  /** Mux's answer to `translate-audio` on the free plan. Which workflow the form picked is moot. */
  const workflowRefused = () =>
    new MuxApiError(
      'Workflow is not available on the free plan',
      403,
      'robots_workflow_not_available'
    );

  it('reports a workflow the plan does not include on that run, and leaves the tab as it was', async () => {
    renderPanel({
      muxApi: {
        ...apiThatReturns([finishedJob()]),
        createRobotsJob: vi.fn(async () => {
          throw workflowRefused();
        }),
      },
    });
    await runSummarize();

    await waitFor(() =>
      expect(sdk.notifier.error).toHaveBeenCalledWith('Workflow is not available on the free plan')
    );
    expect(screen.queryByTestId('robots-not-enabled')).not.toBeInTheDocument();
    expect(screen.getByTestId('robots_job_table')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeEnabled();
    // Nor is it remembered as one, so the next entry opened in this tab loads normally.
    expect(cachedRobotsCapability()?.state).toBe('enabled');
  });

  it('does not re-read the list for it, because it says nothing about the account', async () => {
    const muxApi = {
      ...apiThatReturns([finishedJob()]),
      createRobotsJob: vi.fn(async () => {
        throw workflowRefused();
      }),
    };
    renderPanel({ muxApi });
    await waitFor(() => expect(screen.getByTestId('robots_job_table')).toBeInTheDocument());
    const before = muxApi.listRobotsJobs.mock.calls.length;

    await runSummarize();
    await waitFor(() => expect(sdk.notifier.error).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(muxApi.listRobotsJobs.mock.calls.length).toBe(before);
  });

  it('asks the list when a refusal could mean the account lost Robots, and lets it decide', async () => {
    // Terms withdrawn since the tab loaded: the create is refused, and the list now is too.
    const page = 'https://dashboard.mux.com/organizations/org-1/environments/env-1/robots/jobs';
    const withdrawn = new MuxApiError(`Accept the terms: ${page}`, 403, 'forbidden');
    let listRefuses = false;
    renderPanel({
      muxApi: {
        ...apiThatReturns([finishedJob()]),
        listRobotsJobs: vi.fn(async () => {
          if (listRefuses) throw withdrawn;
          return { data: [finishedJob()] };
        }),
        createRobotsJob: vi.fn(async () => {
          listRefuses = true;
          throw withdrawn;
        }),
      },
    });
    await runSummarize();

    const note = await screen.findByTestId('robots-not-enabled');
    expect(within(note).getByRole('link', { name: /Accept the Robots terms/ })).toHaveAttribute(
      'href',
      page
    );
  });

  it('keeps the tab when the list still answers, since a token can read Robots and not run it', async () => {
    // Mux has separate `robots:read` and `robots:write` scopes. A create refused for scope, on a
    // token whose list read works, is a failed run with Mux's reason on it — not a tab to hide.
    const said = "This token hasn't been granted the correct scope for this operation.";
    const muxApi = {
      ...apiThatReturns([finishedJob()]),
      createRobotsJob: vi.fn(async () => {
        throw new MuxApiError(said, 401, 'unauthorized');
      }),
    };
    renderPanel({ muxApi });
    await waitFor(() => expect(screen.getByTestId('robots_job_table')).toBeInTheDocument());
    const before = muxApi.listRobotsJobs.mock.calls.length;

    await runSummarize();

    await waitFor(() => expect(muxApi.listRobotsJobs.mock.calls.length).toBeGreaterThan(before));
    await waitFor(() => expect(sdk.notifier.error).toHaveBeenCalledWith(said));
    expect(screen.queryByTestId('robots-scope-missing')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeEnabled();
  });
});

/**
 * Running out of units is not a reason the tab cannot work. It used to replace all of it — job
 * history, directives, Run — and, because the poll loop is gated on capability, stop watching the
 * jobs already running. Mux checks units per run, against what that run would cost, so a cheaper
 * workflow can still fit: the limit is a warning over a working tab.
 */
describe('RobotsPanel — units running out is a warning over a working tab', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  const unitsRefused = () =>
    new MuxApiError('Robots units limit exceeded', 403, 'robots_units_limit_exceeded');

  it('keeps the whole tab, and says why the run was refused', async () => {
    renderPanel({
      muxApi: {
        ...apiThatReturns([finishedJob()]),
        listRobotsDirectives: vi.fn(async () => ({ data: [{ id: 'drv_1', name: 'Ingest' }] })),
        createRobotsJob: vi.fn(async () => {
          throw unitsRefused();
        }),
      },
      defaultDirectiveIds: ['drv_1'],
    });
    await runSummarize();

    const note = await screen.findByTestId('robots-units-exhausted');
    expect(within(note).getByText(/100,000 AI units a month/)).toBeInTheDocument();
    expect(within(note).getByRole('link', { name: /see Robots pricing/ })).toBeInTheDocument();
    // Everything else is still there and still works.
    expect(screen.getByTestId('robots_job_table')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Run directive' })).toBeInTheDocument();
    // The run says it failed, as any refused run does; the note does not repeat Mux under it.
    expect(sdk.notifier.error).toHaveBeenCalledWith('Robots units limit exceeded');
    expect(screen.queryByText(/Mux said/)).not.toBeInTheDocument();
    expect(screen.queryByText('Robots units limit exceeded')).not.toBeInTheDocument();
  });

  it('keeps watching a job that was already running', async () => {
    const running = { ...finishedJob(), id: 'rjob_live', status: 'processing' };
    const muxApi = {
      ...apiThatReturns([running]),
      createRobotsJob: vi.fn(async () => {
        throw unitsRefused();
      }),
    };

    vi.useFakeTimers();
    try {
      renderPanel({ muxApi });
      const settle = async (ms: number) => {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(ms);
        });
      };
      await settle(50);
      fireEvent.click(screen.getByRole('button', { name: 'Run a workflow' }));
      await settle(10);
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      await settle(10);
      fireEvent.click(screen.getByRole('button', { name: 'Run Summarize' }));
      await settle(50);
      expect(screen.getByTestId('robots-units-exhausted')).toBeInTheDocument();

      const afterRefusal = muxApi.listRobotsJobs.mock.calls.length;
      await settle(ROBOTS_POLL_INTERVAL_MS + 100);
      expect(muxApi.listRobotsJobs.mock.calls.length).toBeGreaterThan(afterRefusal);
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears when Mux accepts the next run, which is the only evidence units are back', async () => {
    const createRobotsJob = vi
      .fn()
      .mockImplementationOnce(async () => {
        throw unitsRefused();
      })
      .mockImplementationOnce(async () => ({
        data: { id: 'rjob_fits', workflow: 'summarize', status: 'pending' },
      }));
    renderPanel({ muxApi: { ...apiThatReturns([finishedJob()]), createRobotsJob } });

    await runSummarize();
    expect(await screen.findByTestId('robots-units-exhausted')).toBeInTheDocument();

    await runSummarize();
    await waitFor(() => expect(sdk.notifier.success).toHaveBeenCalled());
    expect(screen.queryByTestId('robots-units-exhausted')).not.toBeInTheDocument();
  });

  it("is not the list read's to clear, and not the session's to remember", async () => {
    // The list says nothing about units — only a create is checked against them — so a Refresh
    // proves nothing either way. And the session cache holds what the tab *is*, not what one run
    // ran into: the next entry opens normally.
    const muxApi = {
      ...apiThatReturns([finishedJob()]),
      createRobotsJob: vi.fn(async () => {
        throw unitsRefused();
      }),
    };
    const { unmount } = renderPanel({ muxApi });
    await runSummarize();
    expect(await screen.findByTestId('robots-units-exhausted')).toBeInTheDocument();

    const before = muxApi.listRobotsJobs.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(muxApi.listRobotsJobs.mock.calls.length).toBeGreaterThan(before));
    expect(screen.getByTestId('robots-units-exhausted')).toBeInTheDocument();

    unmount();
    expect(cachedRobotsCapability()?.state).toBe('enabled');
    const next = apiThatReturns([finishedJob()]);
    renderPanel({ muxApi: next });
    await waitFor(() => expect(screen.getByTestId('robots_job_table')).toBeInTheDocument());
    expect(next.listRobotsJobs).toHaveBeenCalled();
    expect(screen.queryByTestId('robots-units-exhausted')).not.toBeInTheDocument();
  });

  it('clears when Mux accepts a directive run, too', async () => {
    const createRobotsDirectiveRun = vi
      .fn()
      .mockImplementationOnce(async () => {
        throw unitsRefused();
      })
      .mockImplementationOnce(async () => ({
        data: { run_id: 'drvrun_fits', subject_id: 'asset-1', status: 'pending' },
      }));
    renderPanel({
      muxApi: {
        ...apiThatReturns([finishedJob()]),
        listRobotsDirectives: vi.fn(async () => ({ data: [{ id: 'drv_1', name: 'Ingest' }] })),
        createRobotsDirectiveRun,
      },
      defaultDirectiveIds: ['drv_1'],
    });
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'drv_1' } });

    fireEvent.click(screen.getByRole('button', { name: 'Run directive' }));
    expect(await screen.findByTestId('robots-units-exhausted')).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Run directive' })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Run directive' }));
    await waitFor(() =>
      expect(sdk.notifier.success).toHaveBeenCalledWith('Directive run started.')
    );
    expect(screen.queryByTestId('robots-units-exhausted')).not.toBeInTheDocument();
  });

  it('says the same when a directive run is refused for units', async () => {
    renderPanel({
      muxApi: {
        ...apiThatReturns([finishedJob()]),
        listRobotsDirectives: vi.fn(async () => ({ data: [{ id: 'drv_1', name: 'Ingest' }] })),
        createRobotsDirectiveRun: vi.fn(async () => {
          throw unitsRefused();
        }),
      },
      defaultDirectiveIds: ['drv_1'],
    });
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'drv_1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run directive' }));

    expect(await screen.findByTestId('robots-units-exhausted')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run a workflow' })).toBeEnabled();
    expect(sdk.notifier.error).toHaveBeenCalledWith('Robots units limit exceeded');
  });
});

/**
 * A directive run nobody here started, on a directive nobody here configured — an ingest
 * directive on a video imported from Mux, typically. The run poll reads only directives this
 * entry has a reason to know about, so it never saw one; the fan-out over every directive in the
 * account used to, at one round trip per directive.
 *
 * The job's own single-job GET names the run that dispatched it, so the run is found through the
 * asset's jobs instead: one read per run they name.
 */
describe('RobotsPanel — a directive run started outside Contentful', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  const nowSeconds = Math.floor(Date.now() / 1000);
  const importedJobs = () => [
    { id: 'rjob_a', workflow: 'summarize', status: 'completed', created_at: nowSeconds - 60 },
    {
      id: 'rjob_b',
      workflow: 'generate-chapters',
      status: 'completed',
      created_at: nowSeconds - 30,
    },
  ];
  const importedRun = (overrides: Record<string, unknown> = {}) => ({
    run_id: 'drvrun_mux',
    subject_id: 'asset-1',
    status: 'completed',
    started_at: nowSeconds - 90,
    completed_at: nowSeconds - 10,
    node_states: [
      { reference_id: 'one', status: 'dispatched', workflow_name: 'summarize', job_id: 'rjob_a' },
      {
        reference_id: 'two',
        status: 'dispatched',
        workflow_name: 'generate-chapters',
        job_id: 'rjob_b',
      },
    ],
    ...overrides,
  });

  /** An account with fifty directives, none of them configured or recorded here. */
  const importedApi = (
    named: { id: string; run_id: string } = { id: 'drv_mux', run_id: 'drvrun_mux' },
    run: () => Record<string, unknown> = () => importedRun()
  ) => ({
    listRobotsJobs: vi.fn(async () => ({ data: importedJobs() })),
    // The list is a summary; the single-job GET is the only place a job names its run.
    getRobotsJob: vi.fn(async (_workflow: string, id: string) => ({
      data: { ...importedJobs().find((job) => job.id === id), directive: named },
    })),
    listRobotsDirectives: vi.fn(async () => ({
      data: [
        { id: 'drv_mux', name: 'Mux ingest' },
        ...Array.from({ length: 49 }, (_, index) => ({ id: `drv_${index}`, name: `D${index}` })),
      ],
    })),
    listRobotsDirectiveRuns: vi.fn(async () => ({ data: [] })),
    getRobotsDirectiveRun: vi.fn(async () => ({ data: run() })),
  });

  const withStoredValue = (initial: MuxContentfulObject | undefined) => {
    let stored = initial;
    const updateField = vi.fn(async (mutate: (current: any) => any) => {
      stored = mutate(stored);
    });
    return { updateField, value: initial, read: () => stored };
  };

  it('shows the run its jobs name', async () => {
    renderPanel({ muxApi: importedApi() });

    const table = await screen.findByTestId('robots_directive_run_table');
    expect(within(table).getByText('completed')).toBeInTheDocument();
    await waitFor(() => expect(within(table).getByText('Mux ingest')).toBeInTheDocument());
    expect(screen.queryByText('No directive runs for this video yet.')).not.toBeInTheDocument();
  });

  it('reads that one run by id, bounded by the asset — never by the account', async () => {
    const muxApi = importedApi();
    renderPanel({ muxApi });
    await screen.findByTestId('robots_directive_run_table');

    // More passes, which is what Refresh and activation cost: a finished run is not read again.
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(muxApi.getRobotsDirectiveRun).toHaveBeenCalledTimes(1);
    expect(muxApi.getRobotsDirectiveRun).toHaveBeenCalledWith('drv_mux', 'drvrun_mux');
    // Not one of the fifty directives in the account was listed to find it.
    expect(muxApi.listRobotsDirectiveRuns).not.toHaveBeenCalled();
    // And not reading it again is not forgetting it.
    expect(
      within(screen.getByTestId('robots_directive_run_table')).getByText('completed')
    ).toBeInTheDocument();
  });

  it('does not read by id a run the listing already returns', async () => {
    const muxApi = {
      ...importedApi({ id: 'drv_cfg', run_id: 'drvrun_mux' }),
      listRobotsDirectiveRuns: vi.fn(async () => ({ data: [importedRun()] })),
    };
    renderPanel({ muxApi, defaultDirectiveIds: ['drv_cfg'] });

    await screen.findByTestId('robots_directive_run_table');
    await waitFor(() => expect(muxApi.getRobotsJob).toHaveBeenCalledTimes(2));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(muxApi.getRobotsDirectiveRun).not.toHaveBeenCalled();
  });

  it('never shows a run that turns out to be on another asset', async () => {
    // The same narrowing the listing applies by `subject_id`, applied to a run read by id.
    const stored = withStoredValue(value());
    const muxApi = importedApi({ id: 'drv_cfg', run_id: 'drvrun_mux' }, () =>
      importedRun({ subject_id: 'asset-2' })
    );
    renderPanel({
      muxApi,
      defaultDirectiveIds: ['drv_cfg'],
      updateField: stored.updateField,
      value: stored.value,
    });

    await waitFor(() => expect(muxApi.getRobotsDirectiveRun).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByText('No directive runs for this video yet.')).toBeInTheDocument();
    expect(stored.read()?.robotsDirectiveRuns).toBeUndefined();
  });

  it('shows the jobs and no run when the run cannot be read', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const muxApi = {
      ...importedApi(),
      getRobotsDirectiveRun: vi.fn(async () => {
        throw new Error('404 — run purged');
      }),
    };
    renderPanel({ muxApi });

    await waitFor(() => expect(muxApi.getRobotsDirectiveRun).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByText('No directive runs for this video yet.')).toBeInTheDocument();
    expect(screen.getByTestId('robots_job_table')).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('stores the jobs it dispatched and not the run', async () => {
    // ADR-0009: a run reaches the entry only at creation, from this tab. Its jobs are recorded
    // like every other job on the asset.
    const stored = withStoredValue(value());
    renderPanel({ muxApi: importedApi(), updateField: stored.updateField, value: stored.value });

    await screen.findByTestId('robots_directive_run_table');
    await waitFor(() =>
      expect(
        stored
          .read()
          ?.robotsJobs?.map((record) => record.id)
          .sort()
      ).toEqual(['rjob_a', 'rjob_b'])
    );
    expect(stored.read()?.robotsDirectiveRuns).toBeUndefined();
  });

  it('keeps reading a run that is still going, and stops once it has finished', async () => {
    // Nothing else is in flight: the run alone keeps the loop alive, as a listed one would.
    let status = 'running';
    const muxApi = importedApi(undefined, () =>
      importedRun({ status, started_at: Math.floor(Date.now() / 1000), completed_at: null })
    );

    vi.useFakeTimers();
    try {
      renderPanel({ muxApi });
      const tick = async () => {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(ROBOTS_POLL_INTERVAL_MS + 100);
        });
      };
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });
      expect(muxApi.getRobotsDirectiveRun).toHaveBeenCalledTimes(1);

      await tick();
      expect(muxApi.getRobotsDirectiveRun).toHaveBeenCalledTimes(2);

      status = 'completed';
      await tick();
      const whenFinished = muxApi.getRobotsDirectiveRun.mock.calls.length;
      await tick();
      await tick();
      expect(muxApi.getRobotsDirectiveRun.mock.calls.length).toBe(whenFinished);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps a run it has seen when a later read of it fails', async () => {
    // A failed read is not news about the run. Dropping it would read as "finished", and the run
    // is what keeps the loop alive — so one bad tick would end the loop.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let failNext = false;
    const muxApi = importedApi(undefined, () => {
      if (failNext) throw new Error('502 from the app-action bridge');
      return importedRun({
        status: 'running',
        started_at: Math.floor(Date.now() / 1000),
        completed_at: null,
      });
    });

    vi.useFakeTimers();
    try {
      renderPanel({ muxApi });
      const tick = async () => {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(ROBOTS_POLL_INTERVAL_MS + 100);
        });
      };
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });
      expect(
        within(screen.getByTestId('robots_directive_run_table')).getByText('running')
      ).toBeInTheDocument();

      failNext = true;
      await tick();
      const afterFailure = muxApi.getRobotsDirectiveRun.mock.calls.length;
      await tick();
      expect(
        within(screen.getByTestId('robots_directive_run_table')).getByText('running')
      ).toBeInTheDocument();
      expect(muxApi.getRobotsDirectiveRun.mock.calls.length).toBeGreaterThan(afterFailure);
    } finally {
      vi.useRealTimers();
      consoleError.mockRestore();
    }
  });

  it('reads a named run that turns up while the first pass is still listing', async () => {
    // Job detail routinely lands before a slow runs listing does. That request used to be dropped
    // by the one-pass-at-a-time guard, and nothing asked again.
    let releaseListing: () => void = () => undefined;
    const muxApi = {
      ...importedApi(),
      listRobotsDirectiveRuns: vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              releaseListing = () => resolve({ data: [] });
            })
        )
        .mockImplementation(async () => ({ data: [] })),
    };
    renderPanel({ muxApi, defaultDirectiveIds: ['drv_cfg'] });

    await waitFor(() => expect(muxApi.getRobotsJob).toHaveBeenCalledTimes(2));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(muxApi.getRobotsDirectiveRun).not.toHaveBeenCalled();

    releaseListing();
    await waitFor(() =>
      expect(muxApi.getRobotsDirectiveRun).toHaveBeenCalledWith('drv_mux', 'drvrun_mux')
    );
    expect(await screen.findByTestId('robots_directive_run_table')).toBeInTheDocument();
  });
});

/** Stable across renders, as `App`'s are, so the panel's effects do not re-arm on every write. */
const noResync = async () => undefined;
const noDirectives: string[] = [];

/** The field editor's half of the loop: what `updateField` writes is what the panel renders next. */
const StatefulPanel: FC<{
  sdk: FieldExtensionSDK;
  muxApi: unknown;
  initial: MuxContentfulObject;
}> = ({ sdk: panelSdk, muxApi, initial }) => {
  const [stored, setStored] = useState<MuxContentfulObject | undefined>(initial);
  const storedRef = useRef(stored);
  const updateField = useCallback(
    async (
      mutate: (current: MuxContentfulObject | undefined) => MuxContentfulObject | undefined
    ) => {
      storedRef.current = mutate(storedRef.current);
      setStored(storedRef.current);
    },
    []
  );
  return (
    <RobotsPanel
      sdk={panelSdk}
      muxApi={muxApi as never}
      value={stored}
      isActive
      updateField={updateField}
      resync={noResync}
      defaultDirectiveIds={noDirectives}
      canRunRobots
    />
  );
};

/** `robotsOutputs` describes the video, so a summarize or moderate job reaches it whoever started it. */
describe('RobotsPanel — outputs of jobs started elsewhere', () => {
  beforeEach(() => {
    resetRobotsCapabilityCache();
    vi.clearAllMocks();
  });

  const withStoredValue = (initial: MuxContentfulObject | undefined) => {
    let stored = initial;
    const updateField = vi.fn(async (mutate: (current: any) => any) => {
      stored = mutate(stored);
    });
    return { updateField, value: initial, read: () => stored };
  };

  /** A list row: no `parameters`, no `outputs`. */
  const listed = (overrides: Record<string, unknown> = {}) => ({
    id: 'rjob_theirs',
    workflow: 'summarize',
    status: 'completed',
    created_at: 1_700_000_000,
    updated_at: 1_700_000_060,
    ...overrides,
  });

  /**
   * The same job from the single-job GET, which names its asset and carries its outputs. `null`
   * for a record that names no asset — `undefined` would take the default.
   */
  const detailed = (
    row: Record<string, unknown>,
    outputs: Record<string, unknown>,
    assetId: string | null = 'asset-1'
  ) => ({
    ...row,
    units_consumed: 1,
    ...(assetId !== null && { parameters: { asset_id: assetId } }),
    outputs,
  });

  it('keeps the summary of a job run from the Mux dashboard, and records the job', async () => {
    const row = listed();
    const muxApi = apiThatReturns([row], {
      rjob_theirs: detailed(row, { title: 'A dashboard title', tags: ['alpha'] }),
    });
    const stored = withStoredValue(value());
    renderPanel({ muxApi, updateField: stored.updateField, value: stored.value });

    await waitFor(() =>
      expect(stored.read()?.robotsOutputs?.summarize).toMatchObject({
        jobId: 'rjob_theirs',
        title: 'A dashboard title',
        tags: ['alpha'],
      })
    );
    expect(stored.read()?.robotsJobs?.map(({ id }) => id)).toEqual(['rjob_theirs']);
    expect(stored.read()?.version).toBe(4);
    // The reads the Units column was already making, and no others.
    expect(muxApi.listRobotsJobs).toHaveBeenCalledTimes(1);
    expect(muxApi.getRobotsJob).toHaveBeenCalledTimes(1);
  });

  it('keeps the moderation result of a job run from the Mux dashboard', async () => {
    const row = listed({ id: 'rjob_mod', workflow: 'moderate' });
    const muxApi = apiThatReturns([row], {
      rjob_mod: detailed(row, {
        exceeds_threshold: false,
        max_scores: { sexual: 0.02, violence: 0.4 },
      }),
    });
    const stored = withStoredValue(value());
    renderPanel({ muxApi, updateField: stored.updateField, value: stored.value });

    await waitFor(() =>
      expect(stored.read()?.robotsOutputs?.moderate).toEqual({
        jobId: 'rjob_mod',
        completedAt: 1_700_000_060,
        exceedsThreshold: false,
        maxScores: { sexual: 0.02, violence: 0.4 },
      })
    );
    expect(stored.read()?.robotsJobs?.map(({ id }) => id)).toEqual(['rjob_mod']);
  });

  it('keeps the summary a directive run nobody here started produced, and records its job', async () => {
    // A directive this entry neither started nor runs on upload: the run is shown and not
    // recorded (ADR-0009); its job is recorded like any other.
    const row = listed({ id: 'rjob_auto' });
    const run = {
      run_id: 'drvrun_mux',
      subject_id: 'asset-1',
      status: 'completed',
      started_at: 1_700_000_000,
      completed_at: 1_700_000_100,
      node_states: [
        {
          reference_id: 'one',
          status: 'dispatched',
          workflow_name: 'summarize',
          job_id: 'rjob_auto',
        },
      ],
    };
    const muxApi = {
      ...apiThatReturns([row], {
        rjob_auto: {
          ...detailed(row, { title: 'Automated title' }),
          directive: { id: 'drv_mux', run_id: 'drvrun_mux' },
        },
      }),
      getRobotsDirectiveRun: vi.fn(async () => ({ data: run })),
    };
    const stored = withStoredValue(value());
    renderPanel({ muxApi, updateField: stored.updateField, value: stored.value });

    await screen.findByTestId('robots_directive_run_table');
    await waitFor(() =>
      expect(stored.read()?.robotsOutputs?.summarize?.title).toBe('Automated title')
    );
    expect(stored.read()?.robotsJobs?.map(({ id }) => id)).toEqual(['rjob_auto']);
    expect(stored.read()?.robotsDirectiveRuns).toBeUndefined();
  });

  it('keeps no output from a listed job whose own record names another asset, or none', async () => {
    // The list is filtered by asset and the panel is keyed by it. Neither is taken on trust.
    const elsewhere = listed({ id: 'rjob_other_asset' });
    const unnamed = listed({ id: 'rjob_unnamed', workflow: 'moderate' });
    const muxApi = apiThatReturns([elsewhere, unnamed], {
      rjob_other_asset: detailed(elsewhere, { title: 'Another video' }, 'asset-2'),
      rjob_unnamed: detailed(unnamed, { exceeds_threshold: true }, null),
    });
    const stored = withStoredValue(value());
    renderPanel({ muxApi, updateField: stored.updateField, value: stored.value });

    await waitFor(() => expect(muxApi.getRobotsJob).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(stored.read()?.robotsJobs).toHaveLength(2));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(stored.read()?.robotsOutputs).toBeUndefined();
  });

  it('lets the newest completed summary win, and records every job', async () => {
    const ours = {
      id: 'rjob_ours',
      workflow: 'summarize',
      status: 'completed',
      created_at: 1_700_000_000,
      updated_at: 1_700_000_100,
    };
    const theirsLater = listed({
      id: 'rjob_later',
      created_at: 1_700_000_200,
      updated_at: 1_700_000_300,
    });
    const theirsEarlier = listed({
      id: 'rjob_earlier',
      created_at: 1_699_999_000,
      updated_at: 1_699_999_060,
    });
    const stored = withStoredValue(
      value({
        robotsJobs: [{ ...ours } as any],
        robotsOutputs: {
          summarize: { jobId: 'rjob_ours', completedAt: 1_700_000_100, title: 'Ours' },
        },
      })
    );
    const muxApi = apiThatReturns([theirsLater, ours, theirsEarlier], {
      rjob_ours: detailed(ours, { title: 'Ours' }),
      rjob_later: detailed(theirsLater, { title: 'Theirs, later' }),
      rjob_earlier: detailed(theirsEarlier, { title: 'Theirs, earlier' }),
    });
    renderPanel({ muxApi, updateField: stored.updateField, value: stored.value });

    await waitFor(() => expect(muxApi.getRobotsJob).toHaveBeenCalledTimes(3));
    await waitFor(() =>
      expect(stored.read()?.robotsOutputs?.summarize?.title).toBe('Theirs, later')
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(stored.read()?.robotsOutputs?.summarize?.jobId).toBe('rjob_later');
    expect(stored.read()?.robotsJobs?.map((record) => record.id)).toEqual([
      'rjob_later',
      'rjob_ours',
      'rjob_earlier',
    ]);
  });

  it('enables Apply summary with a summary from elsewhere, and says what is already applied', async () => {
    const row = listed();
    const muxApi = apiThatReturns([row], {
      rjob_theirs: detailed(row, {
        title: 'A dashboard title',
        description: 'A dashboard description',
      }),
    });
    const setSummary = vi.fn(async () => undefined);
    const entrySdk = {
      ...sdk,
      contentType: {
        fields: [
          { id: 'title', name: 'Title' },
          { id: 'summary', name: 'Summary' },
        ],
      },
      entry: {
        fields: {
          title: {
            id: 'title',
            type: 'Symbol',
            locales: ['en-US'],
            getValue: () => 'A dashboard title',
            setValue: vi.fn(async () => undefined),
          },
          summary: {
            id: 'summary',
            type: 'Text',
            locales: ['en-US'],
            getValue: () => undefined,
            setValue: setSummary,
          },
        },
      },
    } as unknown as FieldExtensionSDK;

    render(<StatefulPanel sdk={entrySdk} muxApi={muxApi} initial={value()} />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Apply summary' })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Apply summary' }));

    expect(
      await screen.findByText('Title already holds this value. Nothing to apply.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Apply 1' }));
    await waitFor(() =>
      expect(setSummary).toHaveBeenCalledWith('A dashboard description', 'en-US')
    );
  });

  it('reads and writes nothing on an entry whose Robots tab is never opened', async () => {
    const row = listed();
    const muxApi = apiThatReturns([row], {
      rjob_theirs: detailed(row, { title: 'A dashboard title' }),
    });
    const updateField = vi.fn(async () => undefined);
    renderPanel({ muxApi, updateField, isActive: false });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(muxApi.listRobotsJobs).not.toHaveBeenCalled();
    expect(updateField).not.toHaveBeenCalled();
  });

  it('keeps it without the tab only on an entry already polling a job of its own', async () => {
    // ADR-0013's resumed poll reads the list for an entry that records a job still running,
    // whether or not the tab is open. That entry already holds Robots data.
    const running = {
      id: 'rjob_running',
      workflow: 'generate-chapters',
      status: 'processing',
      created_at: Math.floor(Date.now() / 1000),
    };
    const row = listed();
    const muxApi = apiThatReturns([running, row], {
      rjob_theirs: detailed(row, { title: 'A dashboard title' }),
    });
    const stored = withStoredValue(value({ robotsJobs: [running as any] }));
    renderPanel({ muxApi, updateField: stored.updateField, value: stored.value, isActive: false });

    await waitFor(() => expect(stored.read()?.robotsOutputs?.summarize?.jobId).toBe('rjob_theirs'));
  });
});
