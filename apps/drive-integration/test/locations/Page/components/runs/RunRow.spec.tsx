import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RunRow } from '../../../../../src/locations/Page/components/runs/RunRow';
import type { RunWithStatus } from '../../../../../src/types/runs';

const makeRun = (overrides?: Partial<RunWithStatus>): RunWithStatus => ({
  runId: 'run-1',
  documentTitle: 'My Document',
  documentId: 'doc-1',
  contentTypeIds: ['blogPost', 'article'],
  startedAt: new Date().toISOString(),
  displayStatus: 'running',
  ...overrides,
});

describe('RunRow', () => {
  it('renders document title', () => {
    render(<RunRow run={makeRun()} onReview={vi.fn()} onDismiss={vi.fn()} spaceId="sp-1" />);
    expect(screen.getByText('My Document')).toBeTruthy();
  });

  it('renders content type IDs', () => {
    render(<RunRow run={makeRun()} onReview={vi.fn()} onDismiss={vi.fn()} spaceId="sp-1" />);
    expect(screen.getByText(/blogPost/)).toBeTruthy();
  });

  it('shows running badge for running status', () => {
    render(
      <RunRow
        run={makeRun({ displayStatus: 'running' })}
        onReview={vi.fn()}
        onDismiss={vi.fn()}
        spaceId="sp-1"
      />
    );
    expect(screen.getByText('Running')).toBeTruthy();
  });

  it('shows Needs Review badge for needs-review status', () => {
    render(
      <RunRow
        run={makeRun({ displayStatus: 'needs-review' })}
        onReview={vi.fn()}
        onDismiss={vi.fn()}
        spaceId="sp-1"
      />
    );
    expect(screen.getByText('Needs Review')).toBeTruthy();
  });

  it('shows Completed badge for completed status', () => {
    render(
      <RunRow
        run={makeRun({ displayStatus: 'completed', createdEntryIds: ['entry-1'] })}
        onReview={vi.fn()}
        onDismiss={vi.fn()}
        spaceId="sp-1"
      />
    );
    expect(screen.getByText('Completed')).toBeTruthy();
  });

  it('shows Failed badge for failed status', () => {
    render(
      <RunRow
        run={makeRun({ displayStatus: 'failed', errorMessage: 'Timed out' })}
        onReview={vi.fn()}
        onDismiss={vi.fn()}
        spaceId="sp-1"
      />
    );
    expect(screen.getByText('Failed')).toBeTruthy();
  });

  it('shows Expired badge for expired status', () => {
    render(
      <RunRow
        run={makeRun({ displayStatus: 'expired' })}
        onReview={vi.fn()}
        onDismiss={vi.fn()}
        spaceId="sp-1"
      />
    );
    expect(screen.getByText('Expired')).toBeTruthy();
  });

  it('shows Review button for needs-review and calls onReview', () => {
    const onReview = vi.fn();
    render(
      <RunRow
        run={makeRun({ displayStatus: 'needs-review' })}
        onReview={onReview}
        onDismiss={vi.fn()}
        spaceId="sp-1"
      />
    );
    fireEvent.click(screen.getByText('Review'));
    expect(onReview).toHaveBeenCalledWith('run-1');
  });

  it('shows Dismiss button for failed and calls onDismiss', () => {
    const onDismiss = vi.fn();
    render(
      <RunRow
        run={makeRun({ displayStatus: 'failed', errorMessage: 'err' })}
        onReview={vi.fn()}
        onDismiss={onDismiss}
        spaceId="sp-1"
      />
    );
    fireEvent.click(screen.getByText('Dismiss'));
    expect(onDismiss).toHaveBeenCalledWith('run-1');
  });

  it('shows Dismiss button for expired and calls onDismiss', () => {
    const onDismiss = vi.fn();
    render(
      <RunRow
        run={makeRun({ displayStatus: 'expired' })}
        onReview={vi.fn()}
        onDismiss={onDismiss}
        spaceId="sp-1"
      />
    );
    fireEvent.click(screen.getByText('Dismiss'));
    expect(onDismiss).toHaveBeenCalledWith('run-1');
  });

  it('renders entry links for completed runs with createdEntryIds', () => {
    render(
      <RunRow
        run={makeRun({ displayStatus: 'completed', createdEntryIds: ['entry-abc', 'entry-def'] })}
        onReview={vi.fn()}
        onDismiss={vi.fn()}
        spaceId="sp-1"
      />
    );
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(2);
    expect(links[0]).toHaveAttribute('href', expect.stringContaining('entry-abc'));
  });

  it('renders error message for failed runs', () => {
    render(
      <RunRow
        run={makeRun({ displayStatus: 'failed', errorMessage: 'Processing timed out' })}
        onReview={vi.fn()}
        onDismiss={vi.fn()}
        spaceId="sp-1"
      />
    );
    expect(screen.getByText('Processing timed out')).toBeTruthy();
  });

  it('does not show Review or Dismiss for running status', () => {
    render(
      <RunRow
        run={makeRun({ displayStatus: 'running' })}
        onReview={vi.fn()}
        onDismiss={vi.fn()}
        spaceId="sp-1"
      />
    );
    expect(screen.queryByText('Review')).toBeNull();
    expect(screen.queryByText('Dismiss')).toBeNull();
  });
});
