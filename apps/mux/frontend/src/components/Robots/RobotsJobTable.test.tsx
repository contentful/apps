import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import RobotsJobTable, { RobotsJobDetailState, unitsCell } from './RobotsJobTable';
import { RobotsJob } from '../../util/robotsTypes';
import { PendingCreateRow } from '../../util/robotsField';

/**
 * Two things this table has to stop doing, and one rule that ties them together.
 *
 * A **cancelled** job stopped before it produced anything, so offering "View output" on it spends
 * an app-action round trip to be told there is nothing there.
 *
 * A row past the detail window has no `units_consumed` because nobody ever asked for it. Rendered
 * as an em dash that is indistinguishable from a job that consumed nothing — blank-because-unknown
 * against blank-because-empty, which is the shape of several bugs on this feature already.
 *
 * The rule: **no cell in this table is ever blank without saying why it is blank.** Both fixes are
 * that rule applied twice, and they have to agree — a cancelled row says "Not charged" in Units
 * and "cancelled before it produced output" in Actions, and neither contradicts the other.
 */

const job = (overrides: Partial<RobotsJob> = {}): RobotsJob =>
  ({
    id: 'rjob_1',
    workflow: 'summarize',
    status: 'completed',
    created_at: 1_700_000_000,
    ...overrides,
  } as RobotsJob);

const show = (jobs: RobotsJob[], overrides: Record<string, unknown> = {}) => {
  const props = {
    onCancel: vi.fn(),
    onViewOutput: vi.fn(),
    onLoadDetail: vi.fn(),
    ...overrides,
  };
  render(
    <RobotsJobTable
      jobs={jobs}
      pendingRows={(overrides.pendingRows as PendingCreateRow[]) ?? []}
      onDontStart={overrides.onDontStart as ((requestId: string) => void) | undefined}
      pointsToNote={(overrides.pointsToNote as boolean) ?? true}
      detailedJobIds={(overrides.detailedJobIds as Set<string>) ?? new Set()}
      unreadableJobIds={(overrides.unreadableJobIds as Set<string>) ?? new Set()}
      onCancel={props.onCancel as (j: RobotsJob) => void}
      onViewOutput={props.onViewOutput as (j: RobotsJob) => void}
      onLoadDetail={props.onLoadDetail as (j: RobotsJob) => void}
      cancellingIds={(overrides.cancellingIds as string[]) ?? []}
      loadingDetailIds={(overrides.loadingDetailIds as string[]) ?? []}
    />
  );
  return props;
};

describe('unitsCell', () => {
  const unread: RobotsJobDetailState = 'unread';

  it('says "Not charged" for a cancelled job, without needing to read anything', () => {
    // The point of putting status ahead of the number: Mux does not bill a cancelled or errored
    // job, so those rows are legible however far back they sit — no detail read, no ambiguity.
    expect(unitsCell(job({ status: 'cancelled' }), unread)).toEqual({
      label: 'Not charged',
      isLoadable: false,
    });
  });

  it('says "Not charged" for an errored job too', () => {
    expect(unitsCell(job({ status: 'errored' }), unread).label).toBe('Not charged');
  });

  it('shows the number when there is one', () => {
    expect(unitsCell(job({ units_consumed: 7 }), 'loaded')).toEqual({
      label: '7',
      isLoadable: false,
    });
  });

  it('shows a real zero as a zero, not as a blank', () => {
    // The whole reason this function exists. A job that genuinely consumed nothing and a job
    // nobody ever asked about used to render the same character.
    expect(unitsCell(job({ units_consumed: 0 }), 'loaded').label).toBe('0');
    expect(unitsCell(job(), unread).label).not.toBe('0');
  });

  it('distinguishes "we never asked" from "we asked and Mux did not say"', () => {
    expect(unitsCell(job(), unread)).toEqual({ label: 'Not loaded', isLoadable: true });
    expect(unitsCell(job(), 'loaded')).toEqual({ label: 'Not reported', isLoadable: false });
  });

  it('does not offer a read that already failed', () => {
    // Tombstoned in the panel as `failedDetailIds`. Offering the click again would just fail again.
    expect(unitsCell(job(), 'unreadable')).toEqual({ label: 'Unavailable', isLoadable: false });
  });

  it('says a running job has no final count yet, rather than leaving it blank', () => {
    expect(unitsCell(job({ status: 'processing' }), unread)).toEqual({
      label: 'Not counted yet',
      isLoadable: false,
    });
    expect(unitsCell(job({ status: 'pending' }), unread).label).toBe('Not counted yet');
  });

  it('never renders a bare em dash, whatever the status and whatever is known', () => {
    const states: RobotsJobDetailState[] = ['loaded', 'unreadable', 'unread'];
    for (const status of ['pending', 'processing', 'completed', 'errored', 'cancelled'] as const) {
      for (const detail of states) {
        expect(unitsCell(job({ status }), detail).label).not.toBe('—');
      }
    }
  });
});

describe('a cancelled row', () => {
  it('does not offer "View output", because there is no output to view', () => {
    show([job({ status: 'cancelled' })]);

    expect(screen.queryByRole('button', { name: 'View output' })).not.toBeInTheDocument();
  });

  it('says why the button is missing, rather than leaving an empty cell', () => {
    // A button that silently vanishes reads as a rendering bug, and so does a disabled one with
    // no explanation. The cell states the reason instead.
    show([job({ status: 'cancelled' })]);

    expect(screen.getByTestId('robots-no-output-rjob_1')).toHaveTextContent(
      'Nothing to view — cancelled before it produced output'
    );
  });

  it('reads coherently across Units and Actions', () => {
    show([job({ status: 'cancelled' })]);

    expect(screen.getByTestId('robots-units-rjob_1')).toHaveTextContent('Not charged');
    expect(screen.getByTestId('robots-no-output-rjob_1')).toBeInTheDocument();
  });

  it('leaves errored jobs alone — their detail carries the failure reason', () => {
    show([job({ id: 'rjob_err', status: 'errored' })]);

    expect(screen.getByRole('button', { name: 'View output' })).toBeInTheDocument();
    expect(screen.queryByTestId('robots-no-output-rjob_err')).not.toBeInTheDocument();
  });

  it('still offers Cancel while the job is running', () => {
    const { onCancel } = show([job({ status: 'processing' })]);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('offers no Cancel without `onCancel`, and says what the row is waiting for', () => {
    // Someone who cannot run Robots (ADR-0016). The cell still is not blank.
    show([job({ status: 'processing' })], { onCancel: undefined });

    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.getByTestId('robots-running-rjob_1')).toHaveTextContent(
      'Output appears when it finishes'
    );
  });
});

describe('the Units column as an affordance', () => {
  it('offers a read for a row the background pass never reached', () => {
    const { onLoadDetail } = show([job()]);

    const link = screen.getByTestId('robots-load-units-rjob_1');
    expect(link).toHaveTextContent('Not loaded');
    fireEvent.click(link);
    expect(onLoadDetail).toHaveBeenCalledWith(expect.objectContaining({ id: 'rjob_1' }));
  });

  it('offers nothing once the number is in hand', () => {
    show([job({ units_consumed: 3 })], { detailedJobIds: new Set(['rjob_1']) });

    expect(screen.queryByTestId('robots-load-units-rjob_1')).not.toBeInTheDocument();
    expect(screen.getByTestId('robots-units-rjob_1')).toHaveTextContent('3');
  });

  it('offers nothing on a row whose read the panel already recorded as failed', () => {
    // `failedDetailIds` is the panel's tombstone for a purged job. Offering the click again would
    // re-request a 404 for as long as the entry stays open, which is the loop it exists to stop.
    show([job()], { unreadableJobIds: new Set(['rjob_1']) });

    expect(screen.queryByTestId('robots-load-units-rjob_1')).not.toBeInTheDocument();
    expect(screen.getByTestId('robots-units-rjob_1')).toHaveTextContent('Unavailable');
  });

  it('offers nothing for a cancelled row, whose answer needs no read', () => {
    // The two fixes meeting: "Not charged" is known from the status, so spending a round trip to
    // confirm it would be the same wasted read the View output button used to cost.
    show([job({ status: 'cancelled' })]);

    expect(screen.queryByTestId('robots-load-units-rjob_1')).not.toBeInTheDocument();
  });

  it('shows the read in flight and refuses a second click on it', () => {
    const { onLoadDetail } = show([job()], { loadingDetailIds: ['rjob_1'] });

    const link = screen.getByTestId('robots-load-units-rjob_1');
    expect(link).toHaveTextContent('Loading…');
    fireEvent.click(link);
    expect(onLoadDetail).not.toHaveBeenCalled();
  });
});

describe('an errored row', () => {
  const errored = () =>
    job({
      id: 'rjob_err',
      status: 'errored',
      errors: [{ type: 'invalid_input', message: 'The audio track was too quiet' }],
    });

  it('says it errored, and leaves why to View output', () => {
    // The reason used to be printed under the workflow name as well as in the modal. The status
    // badge is what the table says; the modal is where the editor goes for why.
    show([errored()]);

    const table = screen.getByTestId('robots_job_table');
    expect(within(table).getByText('errored')).toBeInTheDocument();
    expect(within(table).queryByText('The audio track was too quiet')).not.toBeInTheDocument();
    expect(within(table).getByRole('button', { name: 'View output' })).toBeInTheDocument();
  });
});

describe('RobotsJobTable — row alignment and loading', () => {
  it('centres every cell of a row on the row, not on its top edge', () => {
    // F36 tables align cells to the top; the Actions button is taller than the text beside it.
    show([job()]);
    const cells = screen.getByTestId('robots_job_table').querySelectorAll('tbody td');
    expect(cells.length).toBeGreaterThan(0);
    for (const cell of Array.from(cells)) expect(cell).toHaveStyle({ verticalAlign: 'middle' });
  });

  it('draws placeholder rows, not an empty state, while the list itself is loading', () => {
    render(
      <RobotsJobTable
        jobs={[]}
        pendingRows={[pendingRow('starting')]}
        pointsToNote
        isLoading
        detailedJobIds={new Set()}
        unreadableJobIds={new Set()}
        onCancel={vi.fn()}
        onViewOutput={vi.fn()}
        onLoadDetail={vi.fn()}
        cancellingIds={[]}
        loadingDetailIds={[]}
      />
    );
    expect(screen.getByTestId('robots_job_table_loading')).toBeInTheDocument();
    expect(screen.queryByText(/No Robots jobs have run/)).not.toBeInTheDocument();
  });
});

const pendingRow = (
  phase: PendingCreateRow['phase'],
  overrides: Partial<PendingCreateRow['pending']> = {}
): PendingCreateRow => ({
  pending: {
    requestId: 'req_1',
    kind: 'job',
    workflow: 'summarize',
    requestedAt: 1_700_000_500,
    ...overrides,
  } as PendingCreateRow['pending'],
  phase,
});

describe('a pending row', () => {
  const lastCell = (requestId = 'req_1') => screen.getByTestId(`robots-pending-${requestId}`);

  it.each([
    ['waiting-for-publish', 'Waiting for publish', 'Starts after the publish finishes'],
    ['starting', 'Starting…', 'Waiting for Mux'],
    ['unconfirmed', 'Not confirmed', 'See the note above'],
  ] as const)('reads as %s, with nothing that implies a job exists', (phase, badge, last) => {
    show([], { pendingRows: [pendingRow(phase)] });

    const row = screen.getByText(badge).closest('tr') as HTMLElement;
    expect(within(row).getByText('Summarize')).toBeInTheDocument();
    expect(row).toHaveTextContent(/Requested /);
    expect(within(row).getByText('Not counted yet')).toBeInTheDocument();
    expect(lastCell()).toHaveTextContent(last);
    for (const name of ['View output', 'Cancel']) {
      expect(within(row).queryByRole('button', { name })).not.toBeInTheDocument();
    }
    expect(within(row).queryByTestId(/robots-load-units/)).not.toBeInTheDocument();
  });

  it('offers "Don’t start" only while waiting for the publish, and only with the handler', () => {
    const onDontStart = vi.fn();
    show([], { pendingRows: [pendingRow('waiting-for-publish')], onDontStart });
    fireEvent.click(screen.getByRole('button', { name: 'Don’t start' }));
    expect(onDontStart).toHaveBeenCalledWith('req_1');
  });

  it('offers nothing to withdraw once the create is on its way, or to someone who cannot run', () => {
    show([], { pendingRows: [pendingRow('starting')], onDontStart: vi.fn() });
    expect(screen.queryByRole('button', { name: 'Don’t start' })).not.toBeInTheDocument();
  });

  it('offers nothing to withdraw without the handler', () => {
    show([], { pendingRows: [pendingRow('waiting-for-publish')] });
    expect(screen.queryByRole('button', { name: 'Don’t start' })).not.toBeInTheDocument();
  });

  it('points at the note only for someone the note is shown to', () => {
    show([], { pendingRows: [pendingRow('unconfirmed')], pointsToNote: false });
    expect(lastCell()).toHaveTextContent('Waiting for Mux');
  });

  it('is a row, not the empty state', () => {
    show([], { pendingRows: [pendingRow('starting')] });
    expect(screen.getByTestId('robots_job_table')).toBeInTheDocument();
    expect(screen.queryByText(/No Robots jobs have run/)).not.toBeInTheDocument();
  });

  it('gives its place to the job that resolves it', () => {
    const older = job({ id: 'rjob_older', created_at: 1_700_000_000 });
    const newer = job({ id: 'rjob_newer', created_at: 1_700_001_000 });
    const props = {
      detailedJobIds: new Set<string>(),
      unreadableJobIds: new Set<string>(),
      onViewOutput: vi.fn(),
      onLoadDetail: vi.fn(),
      cancellingIds: [],
      loadingDetailIds: [],
      pointsToNote: true,
    };
    const { rerender } = render(
      <RobotsJobTable jobs={[older, newer]} pendingRows={[pendingRow('starting')]} {...props} />
    );
    const rowIndex = (text: string) =>
      Array.from(screen.getByTestId('robots_job_table').querySelectorAll('tbody tr')).findIndex(
        (row) => row.textContent?.includes(text)
      );
    expect(rowIndex('Starting…')).toBe(1);

    const resolved = job({ id: 'rjob_resolved', status: 'pending', created_at: 1_700_000_502 });
    rerender(<RobotsJobTable jobs={[older, resolved, newer]} pendingRows={[]} {...props} />);
    const rows = screen.getByTestId('robots_job_table').querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent('pending');
  });
});
