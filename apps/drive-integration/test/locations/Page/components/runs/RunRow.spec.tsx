import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RunRow } from '../../../../../src/locations/Page/components/runs/RunRow';
import type { RunWithStatus } from '../../../../../src/types/runs';
import { DisplayStatus } from '../../../../../src/types/runs';
import { createMockSDK } from '../../../../mocks';

const mockSdk = createMockSDK() as any;

const makeRun = (overrides?: Partial<RunWithStatus>): RunWithStatus => ({
  runId: 'run-1',
  documentTitle: 'My Document',
  documentId: 'doc-1',
  contentTypeIds: ['blogPost', 'article'],
  documentSelection: { includeImages: false, selectedTabIds: [] },
  startedAt: new Date().toISOString(),
  displayStatus: DisplayStatus.RUNNING,
  ...overrides,
});

describe('RunRow', () => {
  it('renders document title', () => {
    render(<RunRow run={makeRun()} sdk={mockSdk} onReview={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByText('My Document')).toBeTruthy();
  });

  it('shows In progress badge for running status', () => {
    render(
      <RunRow
        run={makeRun({ displayStatus: DisplayStatus.RUNNING })}
        sdk={mockSdk}
        onReview={vi.fn()}
        onRetry={vi.fn()}
      />
    );
    expect(screen.getByText('In progress')).toBeTruthy();
  });

  it('shows Ready for review badge for needs-review status', () => {
    render(
      <RunRow
        run={makeRun({ displayStatus: DisplayStatus.NEEDS_REVIEW })}
        sdk={mockSdk}
        onReview={vi.fn()}
        onRetry={vi.fn()}
      />
    );
    expect(screen.getByText('Ready for review')).toBeTruthy();
  });

  it('shows Completed badge for completed status', () => {
    render(
      <RunRow
        run={makeRun({ displayStatus: DisplayStatus.COMPLETED, createdEntryIds: ['entry-1'] })}
        sdk={mockSdk}
        onReview={vi.fn()}
        onRetry={vi.fn()}
      />
    );
    expect(screen.getByText(/Complete/)).toBeTruthy();
  });

  it('shows entry count in completed badge when createdEntryIds present', () => {
    render(
      <RunRow
        run={makeRun({
          displayStatus: DisplayStatus.COMPLETED,
          createdEntryIds: ['entry-1', 'entry-2'],
        })}
        sdk={mockSdk}
        onReview={vi.fn()}
        onRetry={vi.fn()}
      />
    );
    expect(screen.getByText('Complete - 2 entries')).toBeTruthy();
  });

  it('shows Failed badge for failed status', () => {
    render(
      <RunRow
        run={makeRun({ displayStatus: DisplayStatus.FAILED, errorMessage: 'Timed out' })}
        sdk={mockSdk}
        onReview={vi.fn()}
        onRetry={vi.fn()}
      />
    );
    expect(screen.getByText('Failed')).toBeTruthy();
  });

  it('shows Expired badge for expired status', () => {
    render(
      <RunRow
        run={makeRun({ displayStatus: DisplayStatus.EXPIRED })}
        sdk={mockSdk}
        onReview={vi.fn()}
        onRetry={vi.fn()}
      />
    );
    expect(screen.getByText('Expired')).toBeTruthy();
  });

  it('shows Review button for needs-review and calls onReview', () => {
    const onReview = vi.fn();
    render(
      <RunRow
        run={makeRun({ displayStatus: DisplayStatus.NEEDS_REVIEW })}
        sdk={mockSdk}
        onReview={onReview}
        onRetry={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Review'));
    expect(onReview).toHaveBeenCalledWith('run-1');
  });

  it('shows Retry button for failed and calls onRetry', () => {
    const onRetry = vi.fn().mockResolvedValue(undefined);
    render(
      <RunRow
        run={makeRun({ displayStatus: DisplayStatus.FAILED, errorMessage: 'err' })}
        sdk={mockSdk}
        onReview={vi.fn()}
        onRetry={onRetry}
      />
    );
    fireEvent.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledWith('run-1');
  });

  it('shows Retry button for expired and calls onRetry', () => {
    const onRetry = vi.fn().mockResolvedValue(undefined);
    render(
      <RunRow
        run={makeRun({ displayStatus: DisplayStatus.EXPIRED })}
        sdk={mockSdk}
        onReview={vi.fn()}
        onRetry={onRetry}
      />
    );
    fireEvent.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledWith('run-1');
  });

  it('shows View button for completed runs with createdEntryIds', () => {
    render(
      <RunRow
        run={makeRun({
          displayStatus: DisplayStatus.COMPLETED,
          createdEntryIds: ['entry-abc', 'entry-def'],
        })}
        sdk={mockSdk}
        onReview={vi.fn()}
        onRetry={vi.fn()}
      />
    );
    expect(screen.getByText('View')).toBeTruthy();
  });

  it('does not show Review or Retry for running status', () => {
    render(
      <RunRow
        run={makeRun({ displayStatus: DisplayStatus.RUNNING })}
        sdk={mockSdk}
        onReview={vi.fn()}
        onRetry={vi.fn()}
      />
    );
    expect(screen.queryByText('Review')).toBeNull();
    expect(screen.queryByText('Retry')).toBeNull();
  });
});
