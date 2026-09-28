import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import RobotsDirectiveRunTable from './RobotsDirectiveRunTable';
import { RobotsDirectiveRun } from '../../util/robotsTypes';
import { PendingCreateRow } from '../../util/robotsField';

type TableProps = Parameters<typeof RobotsDirectiveRunTable>[0];

const showRuns = (runs: RobotsDirectiveRun[], props: Partial<TableProps> = {}) =>
  render(
    <RobotsDirectiveRunTable
      runs={runs}
      pendingRows={[]}
      pointsToNote
      directiveNames={{ drv_1: 'Ingest' }}
      {...props}
    />
  );

const run = (overrides: Partial<RobotsDirectiveRun> = {}): RobotsDirectiveRun => ({
  run_id: 'drvrun_1',
  directive_id: 'drv_1',
  subject_id: 'asset-1',
  status: 'completed',
  started_at: 1_700_000_000,
  node_states: [
    { reference_id: 'captions', workflow_name: 'generate-premium-captions', status: 'dispatched' },
    { reference_id: 'summary', workflow_name: 'summarize', status: 'failed', reason: 'Nope' },
  ],
  ...overrides,
});

describe('RobotsDirectiveRunTable', () => {
  it('centres a run row’s cells, the steps count with its arrow included', () => {
    showRuns([run()]);

    const cells = screen.getByTestId('robots_directive_run_table').querySelectorAll('tbody td');
    for (const cell of Array.from(cells)) expect(cell).toHaveStyle({ verticalAlign: 'middle' });
    // The count and its expand button sit on one centred line rather than on a shared baseline.
    const arrow = screen.getByRole('button', { name: 'Show steps' });
    expect(arrow.parentElement).toHaveStyle({ display: 'flex', alignItems: 'center' });
    expect(arrow.parentElement).toHaveTextContent('2');
  });

  it('centres the expanded steps too', () => {
    showRuns([run()]);
    fireEvent.click(screen.getByRole('button', { name: 'Show steps' }));

    const stepCell = screen.getByText('Nope').closest('td') as HTMLElement;
    expect(stepCell).toHaveStyle({ verticalAlign: 'middle' });
  });

  it('wraps a directive shown by its id, which has no spaces to break at', () => {
    const id = `drv_${'x'.repeat(80)}`;
    showRuns([run({ directive_id: id })], { directiveNames: {} });
    expect(screen.getByText(id).closest('td')).toHaveStyle({ wordBreak: 'break-word' });
  });

  it('says it is still reading rather than that there are no runs', () => {
    showRuns([], { isLoading: true });
    expect(screen.getByTestId('robots_directive_run_table_loading')).toBeInTheDocument();
    expect(screen.queryByText(/No directive runs for this video yet/)).not.toBeInTheDocument();
  });

  it('shows the runs it has, even while it is still reading', () => {
    showRuns([run()], { isLoading: true });
    expect(screen.getByTestId('robots_directive_run_table')).toBeInTheDocument();
  });
});

describe('a pending directive run', () => {
  const pendingRun = (phase: PendingCreateRow['phase']): PendingCreateRow => ({
    pending: {
      requestId: 'req_run',
      kind: 'directive-run',
      directiveId: 'drv_1',
      requestedAt: 1_700_000_500,
    },
    phase,
  });

  it.each([
    ['waiting-for-publish', 'Waiting for publish', 'Starts after the publish finishes'],
    ['starting', 'Starting…', 'Waiting for Mux'],
    ['unconfirmed', 'Not confirmed', 'See the note above'],
  ] as const)(
    'reads as %s, with its status in the Steps cell and no expander',
    (phase, badge, last) => {
      showRuns([], { pendingRows: [pendingRun(phase)] });

      const row = screen.getByText(badge).closest('tr') as HTMLElement;
      expect(within(row).getByText('Ingest')).toBeInTheDocument();
      expect(row).toHaveTextContent(/Requested /);
      expect(screen.getByTestId('robots-pending-req_run')).toHaveTextContent(last);
      expect(within(row).queryByRole('button', { name: 'Show steps' })).not.toBeInTheDocument();
    }
  );

  it('names a directive it has no name for by its id', () => {
    showRuns([], { pendingRows: [pendingRun('starting')], directiveNames: {} });
    expect(screen.getByText('drv_1')).toBeInTheDocument();
  });

  it('offers "Don’t start" only while waiting, only with the handler', () => {
    const onDontStart = vi.fn();
    showRuns([], { pendingRows: [pendingRun('waiting-for-publish')], onDontStart });
    fireEvent.click(screen.getByRole('button', { name: 'Don’t start' }));
    expect(onDontStart).toHaveBeenCalledWith('req_run');
  });

  it('is a row, not the empty state, and shows even while the runs are being read', () => {
    showRuns([], { pendingRows: [pendingRun('starting')], isLoading: true });
    expect(screen.getByTestId('robots_directive_run_table')).toBeInTheDocument();
    expect(screen.queryByText(/No directive runs for this video yet/)).not.toBeInTheDocument();
  });

  it('gives its place to the run that resolves it', () => {
    const older = run({ run_id: 'drvrun_older', started_at: 1_700_000_000 });
    const newer = run({ run_id: 'drvrun_newer', started_at: 1_700_001_000 });
    const { rerender } = showRuns([older, newer], { pendingRows: [pendingRun('starting')] });
    const rows = () =>
      screen.getByTestId('robots_directive_run_table').querySelectorAll('tbody tr');
    expect(rows()[1]).toHaveTextContent('Starting…');

    rerender(
      <RobotsDirectiveRunTable
        runs={[
          older,
          run({ run_id: 'drvrun_resolved', status: 'pending', started_at: 1_700_000_503 }),
          newer,
        ]}
        pendingRows={[]}
        pointsToNote
        directiveNames={{ drv_1: 'Ingest' }}
      />
    );
    expect(rows()).toHaveLength(3);
    expect(rows()[1]).toHaveTextContent('pending');
  });
});
