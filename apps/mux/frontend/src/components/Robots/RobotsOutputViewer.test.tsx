import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RobotsOutputViewer, { prettyJson } from './RobotsOutputViewer';
import { ROBOTS_WORKFLOWS, RobotsJob } from '../../util/robotsTypes';

/**
 * What this file is really about: a shaped view that renders nothing is indistinguishable from a
 * job that produced nothing. That failure has already shipped once on this feature — the list
 * summary carries no `outputs`, so every result looked empty — and the shapes below are the ways
 * it can come back.
 */

const job = (overrides: Partial<RobotsJob> = {}): RobotsJob =>
  ({
    id: 'rjob_1',
    workflow: 'find-key-moments',
    status: 'completed',
    ...overrides,
  } as RobotsJob);

const show = (value: RobotsJob) =>
  render(<RobotsOutputViewer job={value} muxApi={undefined} onClose={vi.fn()} />);

describe('find-key-moments output', () => {
  it('shows the visual narrative, which a shots-driven run is the only one to fill', () => {
    // The reported bug: the Summary column read `audible_narrative` and nothing else, so a run
    // with `use_shots` on — where selection reads the picture — showed a blank column on a job
    // that had plenty to say, and `visual_narrative` was never rendered anywhere.
    show(
      job({
        outputs: {
          moments: [
            {
              start_ms: 15000,
              end_ms: 45000,
              title: 'The Pivotal Realization',
              overall_score: 0.92,
              audible_narrative: '',
              visual_narrative: 'The speaker gestures at a whiteboard diagram.',
            },
          ],
        },
      })
    );

    expect(screen.getByText('The Pivotal Realization')).toBeInTheDocument();
    expect(screen.getByText('The speaker gestures at a whiteboard diagram.')).toBeInTheDocument();
  });

  it('shows both narratives at once, labelled, when the job filled both', () => {
    show(
      job({
        outputs: {
          moments: [
            {
              start_ms: 0,
              end_ms: 1000,
              title: 'Both',
              audible_narrative: 'What was said.',
              visual_narrative: 'What was shown.',
              quotable_segment: { start_ms: 200, text: 'The quotable bit.' },
            },
          ],
        },
      })
    );

    expect(screen.getByText('What was said.')).toBeInTheDocument();
    expect(screen.getByText('What was shown.')).toBeInTheDocument();
    expect(screen.getByText('The quotable bit.')).toBeInTheDocument();
  });

  it('renders both notable-concept arrays, which have different shapes', () => {
    show(
      job({
        outputs: {
          moments: [
            {
              start_ms: 0,
              end_ms: 1000,
              title: 'Concepts',
              notable_audible_concepts: ['pivotal realization moment'],
              notable_visual_concepts: [
                { concept: 'whiteboard diagram', score: 0.88, rationale: 'because' },
              ],
            },
          ],
        },
      })
    );

    expect(screen.getByText('pivotal realization moment')).toBeInTheDocument();
    expect(screen.getByText(/whiteboard diagram/)).toBeInTheDocument();
  });

  it('falls back to the raw result rather than an empty table', () => {
    show(job({ outputs: { something_new: [{ start_ms: 1 }] } }));

    expect(screen.getByText(/not in the shape this view knows how to draw/)).toBeInTheDocument();
    expect(screen.getByText(/something_new/)).toBeInTheDocument();
  });
});

describe('the other shaped outputs', () => {
  it.each([
    ['summarize', { unexpected: 1 }],
    ['ask-questions', { unexpected: 1 }],
    ['generate-chapters', { unexpected: 1 }],
    ['find-scenes', { unexpected: 1 }],
    ['find-best-thumbnails', { unexpected: 1 }],
    ['generate-engagement-insights', { unexpected: 1 }],
    ['moderate', { unexpected: 1 }],
  ])('%s shows the raw result when its key is absent', (workflow, outputs) => {
    show(job({ workflow: workflow as RobotsJob['workflow'], outputs }));
    expect(screen.getByText(/not in the shape this view knows how to draw/)).toBeInTheDocument();
  });

  it('still draws the shaped view when the key is there', () => {
    show(
      job({
        workflow: 'find-scenes',
        outputs: { scenes: [{ start_ms: 0, end_ms: 1000, title: 'Opening' }] },
      })
    );
    expect(screen.getByText('Opening')).toBeInTheDocument();
    expect(screen.queryByText(/not in the shape this view knows how to draw/)).toBeNull();
  });

  it('reads a find-scenes summary from whichever narrative the job filled', () => {
    show(
      job({
        workflow: 'find-scenes',
        outputs: {
          scenes: [
            { start_ms: 0, end_ms: 1000, title: 'Silent', visual_narrative: 'Only visual.' },
          ],
        },
      })
    );
    expect(screen.getByText('Only visual.')).toBeInTheDocument();
  });

  it('keeps saying so when Mux really did return nothing', () => {
    show(job({ outputs: {} }));
    expect(screen.getByText(/returned no output for it/)).toBeInTheDocument();
  });
});

/**
 * The Raw JSON tab.
 *
 * The shaped views can only draw what someone anticipated, and three bugs on this feature have been
 * the same shape: the job populated a key the view does not read, and the modal showed a table with
 * no rows. These tests are about the escape hatch — that it exists for every workflow, that it
 * carries everything rather than the slice the shaped view happens to read, and that when there is
 * nothing to show it says so instead of rendering an empty box.
 */
const origClipboard = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard');

afterEach(() => {
  if (origClipboard) {
    Object.defineProperty(window.navigator, 'clipboard', origClipboard);
  } else {
    delete (window.navigator as unknown as Record<string, unknown>).clipboard;
  }
  vi.restoreAllMocks();
});

const openRaw = () => userEvent.click(screen.getByRole('tab', { name: 'Raw JSON' }));
const rawText = () => (screen.getByTestId('robots-raw-json') as HTMLTextAreaElement).value;

describe('the raw JSON view', () => {
  it.each(ROBOTS_WORKFLOWS)(
    'is reachable on %s, whatever the shaped view does',
    async (workflow) => {
      const value = job({ workflow, outputs: { anything: 'at all' } });
      show(value);

      expect(screen.getByRole('tab', { name: 'Result' })).toBeInTheDocument();
      await openRaw();

      expect(rawText()).toBe(JSON.stringify(value, null, 2));
    }
  );

  it('opens on the shaped view and keeps the raw one one click away', async () => {
    show(
      job({
        workflow: 'find-scenes',
        outputs: { scenes: [{ start_ms: 0, end_ms: 1000, title: 'Opening' }] },
      })
    );

    // The shaped view is what makes an output readable, so it is what the modal opens on.
    expect(screen.getByText('Opening')).toBeInTheDocument();
    expect(screen.queryByTestId('robots-raw-json')).toBeNull();

    await openRaw();
    expect(screen.getByTestId('robots-raw-json')).toBeInTheDocument();
    expect(screen.queryByText('Opening')).toBeNull();
  });

  it('shows the keys the shaped view never reads — the bug this tab exists for', async () => {
    show(
      job({
        outputs: {
          moments: [{ start_ms: 0, end_ms: 1000, title: 'Drawn' }],
          highlight_reel: { note: 'a key no shaped view reads' },
        },
      })
    );

    expect(screen.queryByText(/a key no shaped view reads/)).toBeNull();

    await openRaw();
    expect(rawText()).toContain('a key no shaped view reads');
    expect(rawText()).toContain('highlight_reel');
  });

  /**
   * Why the whole job and not just `outputs`: both of the bugs this tab is meant to shorten were
   * only legible from outside `outputs`. A summary row with no `outputs` key at all looks exactly
   * like an empty result, and an empty `audible_narrative` is explained by `parameters.use_shots`
   * — the run read the picture, not the transcript.
   */
  it('shows what sits outside outputs too, which is where the last two bugs were legible', async () => {
    show(
      job({
        status: 'completed',
        units_consumed: 7,
        parameters: { use_shots: true },
        errors: [{ messages: ['a partial failure'] }],
        outputs: { moments: [] },
      })
    );

    await openRaw();
    expect(rawText()).toContain('"use_shots": true');
    expect(rawText()).toContain('"units_consumed": 7');
    expect(rawText()).toContain('a partial failure');
  });

  it('copies exactly the JSON it is showing', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    });
    show(job({ outputs: { moments: [{ title: 'Copy me' }] } }));

    await openRaw();
    const shown = rawText();
    // The block's own button, not the one beside the job id.
    await userEvent.click(screen.getByRole('button', { name: 'Copy to clipboard' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(shown));
  });

  it('says a completed job carried no outputs, in both views', async () => {
    show(job({ outputs: {} }));

    expect(screen.getByText(/returned no output for it/)).toBeInTheDocument();

    await openRaw();
    // Not an empty block: the note says it, and the job is still there to show that `outputs` is
    // empty rather than the fetch having quietly returned the list summary.
    expect(screen.getByText(/came back with no outputs/)).toBeInTheDocument();
    expect(rawText()).toContain('"id": "rjob_1"');
  });

  it('says so rather than rendering an empty block when the payload cannot be read', async () => {
    const circular: Record<string, unknown> = { note: 'cycle' };
    circular.self = circular;
    show(job({ outputs: { circular } }));

    await openRaw();
    expect(screen.getByText(/nothing here to show as JSON/)).toBeInTheDocument();
    expect(screen.queryByTestId('robots-raw-json')).toBeNull();
  });

  /**
   * One way to show JSON, not two. Wherever the shaped view gives up and prints the payload — the
   * missing-shape fallback, and the caption workflows whose result is a track rather than a
   * document — it is the same block as the raw tab and as Player code, copy button and all.
   */
  it.each([
    ['the missing-shape fallback', 'find-key-moments', { unreadable_key: 'payload text' }],
    ['premium captions', 'generate-premium-captions', { track_id: 'payload text' }],
  ])('shows %s in the same block, not a bare pre', (_label, workflow, outputs) => {
    show(job({ workflow: workflow as RobotsJob['workflow'], outputs }));

    const block = screen.getByTestId('robots-output-json') as HTMLTextAreaElement;
    expect(block.tagName).toBe('TEXTAREA');
    expect(block).toHaveClass('copycodearea');
    expect(block.value).toContain('payload text');
    expect(screen.getByRole('button', { name: 'Copy to clipboard' })).toBeInTheDocument();
  });

  /**
   * The reported bug, at the level it actually lives.
   *
   * The panel fetches detail for every terminal job in the background and hands the viewer
   * `jobDetails[id] ?? viewedJob`. Open the modal in the window before that detail lands and the
   * viewer starts its own fetch; when the panel's detail arrives the `job` prop changes identity,
   * the effect re-runs, its cleanup cancels the in-flight request — and the new run takes the
   * "already complete" early path, which used to return without ever clearing the loading flag.
   * Nothing re-ran the effect afterwards, so the spinner was permanent: closing and reopening the
   * modal did not clear it, and only an F5 did.
   */
  it('resolves when the full job arrives from the panel while its own fetch is in flight', async () => {
    const pending = { getRobotsJob: () => new Promise<never>(() => undefined) } as never;
    const summaryRow = job({ id: 'rjob_race', workflow: 'ask-questions', outputs: undefined });

    const { rerender } = render(
      <RobotsOutputViewer job={summaryRow} muxApi={pending} onClose={vi.fn()} />
    );
    expect(screen.getByText(/Loading the result from Mux/)).toBeInTheDocument();

    // The panel's own bounded detail read lands: same job, now carrying its outputs.
    rerender(
      <RobotsOutputViewer
        job={job({
          id: 'rjob_race',
          workflow: 'ask-questions',
          outputs: { answers: [{ question: 'Who?', answer: 'The narrator' }] },
        })}
        muxApi={pending}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => expect(screen.getByText('The narrator')).toBeInTheDocument());
    expect(screen.queryByText(/Loading the result from Mux/)).toBeNull();
  });

  /**
   * The same latch, reached by closing the modal. `job` going undefined cleared the payload but
   * not the loading flag, so the next job opened in the same session inherited a spinner that
   * belonged to a request that had already been abandoned.
   */
  it('does not carry a spinner from one job over to the next', async () => {
    const pending = { getRobotsJob: () => new Promise<never>(() => undefined) } as never;
    const { rerender } = render(
      <RobotsOutputViewer
        job={job({ id: 'rjob_first', outputs: undefined })}
        muxApi={pending}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/Loading the result from Mux/)).toBeInTheDocument();

    // Closed.
    rerender(<RobotsOutputViewer job={undefined} muxApi={pending} onClose={vi.fn()} />);
    // Reopened on a job whose outputs are already in hand.
    rerender(
      <RobotsOutputViewer
        job={job({
          id: 'rjob_second',
          workflow: 'find-scenes',
          outputs: { scenes: [{ title: 'Opening' }] },
        })}
        muxApi={pending}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => expect(screen.getByText('Opening')).toBeInTheDocument());
    expect(screen.queryByText(/Loading the result from Mux/)).toBeNull();
  });

  it('fetches the job it was only handed a summary of, and shows what came back', async () => {
    const getRobotsJob = vi.fn(async () => ({
      data: job({ id: 'rjob_fetch', workflow: 'summarize', outputs: { title: 'Fetched title' } }),
    }));
    render(
      <RobotsOutputViewer
        job={job({ id: 'rjob_fetch', workflow: 'summarize', outputs: undefined })}
        muxApi={{ getRobotsJob } as never}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => expect(screen.getByText('Fetched title')).toBeInTheDocument());
    expect(getRobotsJob).toHaveBeenCalledWith('summarize', 'rjob_fetch');
  });

  /**
   * The fetch answered, but with no job in it. The summary row is all there is, and it is rendered
   * as what it is — "no output" — rather than left spinning on a request that has already come back.
   */
  it('settles on a fetch that answered with nothing, rather than spinning on it', async () => {
    render(
      <RobotsOutputViewer
        job={job({ id: 'rjob_empty', workflow: 'summarize', outputs: undefined })}
        muxApi={{ getRobotsJob: vi.fn(async () => ({ data: undefined })) } as never}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => expect(screen.getByText(/returned no output for it/)).toBeInTheDocument());
    expect(screen.queryByText(/Loading the result from Mux/)).toBeNull();
  });

  /** A result belongs to the job it was fetched for, and to no other. */
  it("never shows one job's output under another job's header", async () => {
    const muxApi = {
      getRobotsJob: vi.fn((_workflow: string, id: string) =>
        id === 'rjob_a'
          ? Promise.resolve({
              data: job({
                id: 'rjob_a',
                workflow: 'find-scenes',
                outputs: { scenes: [{ start_ms: 0, end_ms: 1, title: 'A scene' }] },
              }),
            })
          : new Promise(() => undefined)
      ),
    } as never;

    const { rerender } = render(
      <RobotsOutputViewer
        job={job({ id: 'rjob_a', workflow: 'find-scenes', outputs: undefined })}
        muxApi={muxApi}
        onClose={vi.fn()}
      />
    );
    await waitFor(() => expect(screen.getByText('A scene')).toBeInTheDocument());

    // Closed, then reopened on a different job whose fetch has not answered yet.
    rerender(<RobotsOutputViewer job={undefined} muxApi={muxApi} onClose={vi.fn()} />);
    rerender(
      <RobotsOutputViewer
        job={job({ id: 'rjob_b', workflow: 'find-scenes', outputs: undefined })}
        muxApi={muxApi}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText('A scene')).toBeNull();
    expect(screen.getByTestId('robots-job-id')).toHaveTextContent('rjob_b');
    expect(screen.getByText(/Loading the result from Mux/)).toBeInTheDocument();
  });

  it('says so, rather than spinning, when there is no client to fetch with', async () => {
    render(
      <RobotsOutputViewer
        job={job({ id: 'rjob_noclient', outputs: undefined })}
        muxApi={undefined}
        onClose={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(screen.getByText(/The Mux client is not ready yet/)).toBeInTheDocument()
    );
    expect(screen.queryByText(/Loading the result from Mux/)).toBeNull();
  });

  it('still shows the three modal states it had', async () => {
    // Nothing fetched yet: no tabs to offer, because the payload has not arrived.
    const { rerender } = render(
      <RobotsOutputViewer
        job={job({ outputs: undefined })}
        muxApi={{ getRobotsJob: () => new Promise(() => undefined) } as never}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/Loading the result from Mux/)).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Raw JSON' })).toBeNull();

    // The fetch failed: the message, not a raw view of the summary row that has no outputs.
    rerender(
      <RobotsOutputViewer
        job={job({ id: 'rjob_2', outputs: undefined })}
        muxApi={{ getRobotsJob: () => Promise.reject(new Error('Mux is down')) } as never}
        onClose={vi.fn()}
      />
    );
    await waitFor(() => expect(screen.getByText('Mux is down')).toBeInTheDocument());
    expect(screen.queryByRole('tab', { name: 'Raw JSON' })).toBeNull();
  });
});

/**
 * The one terminal status that still routes here from the table.
 *
 * A cancelled job no longer offers "View output" — it produced nothing, so the modal could only
 * ever say so after paying a round trip to find out. An errored one keeps the button precisely
 * because its detail carries something worth reading, and `errors` exists only on the single-job
 * GET. Nothing pinned that down before, so this is what stops the cancelled fix being widened
 * into a status whose detail is the whole point.
 */
describe('an errored job', () => {
  /** The row is a list summary; the full record with `errors` arrives from the fetch. */
  const showErrored = (full: RobotsJob) =>
    render(
      <RobotsOutputViewer
        job={{ id: full.id, workflow: full.workflow, status: full.status } as RobotsJob}
        muxApi={{ getRobotsJob: async () => ({ data: full }) } as never}
        onClose={vi.fn()}
      />
    );

  it('surfaces the failure reason, which is the reason the button is still offered', async () => {
    showErrored(
      job({
        status: 'errored',
        errors: [{ type: 'invalid_input', messages: ['The audio track was too quiet'] }],
      })
    );

    expect(await screen.findByText('The audio track was too quiet')).toBeInTheDocument();
  });

  it('says so in words when Mux gave no reason, rather than showing an empty box', async () => {
    showErrored(job({ status: 'errored' }));

    expect(await screen.findByText('This job failed without a message.')).toBeInTheDocument();
  });

  it('shows a reason it was handed without reading the job again, so a failed re-read cannot hide it', async () => {
    // The table no longer prints the reason, so this is the only place it appears — and the
    // panel usually already holds it, from the terminal detail it reads in the background.
    const getRobotsJob = vi.fn(async () => {
      throw new Error('502 from the app-action bridge');
    });
    render(
      <RobotsOutputViewer
        job={job({
          status: 'errored',
          errors: [{ type: 'invalid_input', message: 'The audio track was too quiet' }],
        })}
        muxApi={{ getRobotsJob } as never}
        onClose={vi.fn()}
      />
    );

    expect(await screen.findByText('The audio track was too quiet')).toBeInTheDocument();
    expect(screen.queryByText('502 from the app-action bridge')).toBeNull();
    expect(getRobotsJob).not.toHaveBeenCalled();
  });

  it('keeps every message on the raw tab, since the shaped note only shows the first', async () => {
    showErrored(
      job({
        status: 'errored',
        errors: [{ messages: ['The audio track was too quiet', 'No speech was detected'] }],
      })
    );

    expect(await screen.findByText('The audio track was too quiet')).toBeInTheDocument();
    expect(screen.queryByText('No speech was detected')).toBeNull();

    await openRaw();
    expect(rawText()).toContain('No speech was detected');
  });
});

describe('prettyJson', () => {
  it('pretty-prints, so a payload can be read and diffed', () => {
    expect(prettyJson({ a: [1] })).toBe('{\n  "a": [\n    1\n  ]\n}');
  });

  it.each([
    ['nothing at all', undefined],
    ['a value JSON drops', () => undefined],
  ])('returns undefined for %s, so the caller can say so in words', (_label, value) => {
    expect(prettyJson(value)).toBeUndefined();
  });

  it('returns undefined rather than throwing on a cycle', () => {
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    expect(prettyJson(cycle)).toBeUndefined();
  });
});

/**
 * The job table no longer routes a cancelled job here — there is nothing to view, so the row says
 * so instead of offering a button. That makes this branch unreachable from the one caller the app
 * has today, which is not the same as dead code: `OutputBody` matches on the whole of
 * `RobotsJobStatus`, and the viewer's props accept any job a future caller hands it.
 *
 * Deleting the branch is the tempting move and it is wrong. Without it a cancelled job falls
 * through to the non-terminal case and renders "This job is still cancelled." — a sentence that
 * says a finished job has not finished. So the branch stays, and this test is what keeps it
 * honest: reached through the component's own API rather than through the table.
 */
describe('a cancelled job, if something still opens it', () => {
  it('says it was cancelled, not that it is still being cancelled', async () => {
    const cancelled = job({ status: 'cancelled' });

    render(
      <RobotsOutputViewer
        job={{ id: cancelled.id, workflow: cancelled.workflow, status: 'cancelled' } as RobotsJob}
        muxApi={{ getRobotsJob: async () => ({ data: cancelled }) } as never}
        onClose={vi.fn()}
      />
    );

    expect(await screen.findByText('This job was cancelled.')).toBeInTheDocument();
    expect(screen.queryByText(/is still/)).toBeNull();
  });
});

/**
 * The facts above the result. They used to be one line — "Job rjob_… · 48 AI units" — that
 * the id alone overflowed, wrapping the units onto a line of their own and putting a horizontal
 * scrollbar on the modal. The overflow itself is checked in a browser; what is pinned here is the
 * structure that prevents it.
 */
describe('the job facts', () => {
  const LONG_ID = 'rjob_01K5ZQ4XH3N9M2R8T7V6W5Y4X3AB7C9D1E2F3G4H5J6K7M8N9P';

  const facts = () => {
    const list = screen.getByTestId('robots-job-facts');
    const pairs: Record<string, string> = {};
    const terms = Array.from(list.querySelectorAll('dt'));
    for (const term of terms) {
      pairs[term.textContent ?? ''] = term.nextElementSibling?.textContent ?? '';
    }
    return pairs;
  };

  it('lists status, units, start and id as a key/value list', () => {
    show(
      job({
        id: LONG_ID,
        created_at: 1_700_000_000,
        units_consumed: 48,
        outputs: { moments: [{ start_ms: 0, end_ms: 1, title: 'A moment' }] },
      })
    );
    const pairs = facts();
    expect(Object.keys(pairs)).toEqual(['Status', 'AI units', 'Started', 'Job ID']);
    expect(pairs.Status).toBe('completed');
    expect(pairs['AI units']).toBe('48');
    expect(pairs.Started).toBe(new Date(1_700_000_000 * 1000).toLocaleString());
    expect(pairs['Job ID']).toContain(LONG_ID);
    // Each label centred on its value: the id's row is as tall as its copy button.
    const list = screen.getByTestId('robots-job-facts');
    for (const cell of Array.from(list.querySelectorAll('dt, dd'))) {
      expect(cell).toHaveStyle({ display: 'flex', alignItems: 'center' });
    }
  });

  it('truncates the id rather than letting it widen the modal, and keeps it copyable', () => {
    show(job({ id: LONG_ID, outputs: { moments: [] } }));
    const id = screen.getByTestId('robots-job-id');
    expect(id).toHaveStyle({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
    // Readable in full on hover, and copied whole.
    expect(id).toHaveAttribute('title', LONG_ID);
    expect(screen.getByRole('button', { name: 'Copy job ID' })).toBeInTheDocument();
  });

  it('says what the units are in the job table’s words, not only as a number', () => {
    show(job({ status: 'errored', errors: [{ messages: ['Nope'] }] }));
    expect(facts()['AI units']).toBe('Not charged');
  });

  it('says the units are loading while the full record is being read', () => {
    render(
      <RobotsOutputViewer
        job={job({ id: 'rjob_pending_read', outputs: undefined })}
        muxApi={{ getRobotsJob: () => new Promise(() => undefined) } as never}
        onClose={vi.fn()}
      />
    );
    expect(facts()['AI units']).toBe('Loading…');
  });

  it('keeps the workflow in the title rather than repeating it in the list', () => {
    show(job({ outputs: { moments: [] } }));
    expect(screen.getByRole('heading', { name: 'Find key moments' })).toBeInTheDocument();
    expect(Object.keys(facts())).not.toContain('Workflow');
  });
});

describe('generate-chapters output', () => {
  const chaptersJob = (assetUpdate?: unknown) =>
    job({
      workflow: 'generate-chapters',
      outputs: {
        chapters: [{ start_time: 0, title: 'Intro' }],
        ...(assetUpdate !== undefined && { asset_update: assetUpdate }),
      },
    });

  it('says the chapters are on the video when Mux wrote them', () => {
    show(chaptersJob({ status: 'created', track_id: 'track_chapters_1' }));
    expect(screen.getByText(/added to the Mux video as its chapters track/)).toBeInTheDocument();
  });

  it('says the write failed, since a job completes even when it does', () => {
    // The write is best-effort: the job reports `completed` either way, so the outcome has to
    // come from `asset_update`, not from the status.
    show(chaptersJob({ status: 'failed' }));
    expect(screen.getByText(/could not add these chapters/)).toBeInTheDocument();
  });

  it('says nothing was written for a job run without the option', () => {
    show(chaptersJob());
    expect(screen.getByText(/were not added to the Mux video/)).toBeInTheDocument();
    expect(screen.getByText('Intro')).toBeInTheDocument();
  });
});
