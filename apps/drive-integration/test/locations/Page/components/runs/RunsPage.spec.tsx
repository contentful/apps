import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RunRecord } from '../../../../../src/types/runs';

const mockRuns: RunRecord[] = [];
const mockAddRun = vi.fn();
const mockRemoveRun = vi.fn();
const mockMarkCompleted = vi.fn();
let mockStorageError: string | null = null;

vi.mock('../../../../../src/hooks/useRunStorage', () => ({
  useRunStorage: () => ({
    runs: mockRuns,
    addRun: mockAddRun,
    removeRun: mockRemoveRun,
    markCompleted: mockMarkCompleted,
    storageError: mockStorageError,
  }),
}));

const mockStatusMap = new Map<string, string>();
const mockErrorMap = new Map<string, string>();

vi.mock('../../../../../src/hooks/useRunsPolling', () => ({
  useRunsPolling: () => ({
    statusMap: mockStatusMap,
    errorMap: mockErrorMap,
  }),
}));

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => ({ ids: { space: 'sp-1', environment: 'env-1' } }),
}));

import { RunsPage } from '../../../../../src/locations/Page/components/runs/RunsPage';
import { createMockSDK } from '../../../../mocks';

const mockSdk = createMockSDK() as any;

beforeEach(() => {
  mockRuns.length = 0;
  mockStatusMap.clear();
  mockErrorMap.clear();
  mockStorageError = null;
  vi.clearAllMocks();
});

describe('RunsPage', () => {
  it('renders empty state when no runs', () => {
    render(<RunsPage sdk={mockSdk} onNewImport={vi.fn()} onReviewRun={vi.fn()} />);
    expect(screen.getByText(/no imports yet/i)).toBeTruthy();
  });

  it('shows New Import button and calls onNewImport', () => {
    const onNewImport = vi.fn();
    render(<RunsPage sdk={mockSdk} onNewImport={onNewImport} onReviewRun={vi.fn()} />);
    fireEvent.click(screen.getByText('New Import'));
    expect(onNewImport).toHaveBeenCalled();
  });

  it('renders a row per run', () => {
    mockRuns.push(
      {
        runId: 'run-1',
        documentTitle: 'Doc A',
        documentId: 'd1',
        contentTypeIds: ['ct-1'],
        startedAt: new Date().toISOString(),
      },
      {
        runId: 'run-2',
        documentTitle: 'Doc B',
        documentId: 'd2',
        contentTypeIds: ['ct-2'],
        startedAt: new Date().toISOString(),
      }
    );
    mockStatusMap.set('run-1', 'running');
    mockStatusMap.set('run-2', 'completed');

    render(<RunsPage sdk={mockSdk} onNewImport={vi.fn()} onReviewRun={vi.fn()} />);
    expect(screen.getByText('Doc A')).toBeTruthy();
    expect(screen.getByText('Doc B')).toBeTruthy();
  });

  it('clicking Review on a needs-review run calls onReviewRun', () => {
    mockRuns.push({
      runId: 'run-review',
      documentTitle: 'Review Me',
      documentId: 'd1',
      contentTypeIds: ['ct-1'],
      startedAt: new Date().toISOString(),
    });
    mockStatusMap.set('run-review', 'needs-review');

    const onReviewRun = vi.fn();
    render(<RunsPage sdk={mockSdk} onNewImport={vi.fn()} onReviewRun={onReviewRun} />);
    fireEvent.click(screen.getByText('Review'));
    expect(onReviewRun).toHaveBeenCalledWith('run-review');
  });

  it('clicking Dismiss on a failed run calls removeRun', () => {
    mockRuns.push({
      runId: 'run-fail',
      documentTitle: 'Failed Doc',
      documentId: 'd1',
      contentTypeIds: ['ct-1'],
      startedAt: new Date().toISOString(),
    });
    mockStatusMap.set('run-fail', 'failed');
    mockErrorMap.set('run-fail', 'Timed out');

    render(<RunsPage sdk={mockSdk} onNewImport={vi.fn()} onReviewRun={vi.fn()} />);
    fireEvent.click(screen.getByText('Dismiss'));
    expect(mockRemoveRun).toHaveBeenCalledWith('run-fail');
  });

  it('shows storage error note when storageError is set', () => {
    mockStorageError = 'Storage full';
    render(<RunsPage sdk={mockSdk} onNewImport={vi.fn()} onReviewRun={vi.fn()} />);
    expect(screen.getByText(/storage full/i)).toBeTruthy();
  });

  it('renders two concurrent runs with independent statuses', () => {
    mockRuns.push(
      {
        runId: 'concurrent-1',
        documentTitle: 'First Import',
        documentId: 'd1',
        contentTypeIds: ['ct-1'],
        startedAt: new Date().toISOString(),
      },
      {
        runId: 'concurrent-2',
        documentTitle: 'Second Import',
        documentId: 'd2',
        contentTypeIds: ['ct-2'],
        startedAt: new Date().toISOString(),
      }
    );
    mockStatusMap.set('concurrent-1', 'running');
    mockStatusMap.set('concurrent-2', 'needs-review');

    render(<RunsPage sdk={mockSdk} onNewImport={vi.fn()} onReviewRun={vi.fn()} />);

    expect(screen.getByText('First Import')).toBeTruthy();
    expect(screen.getByText('Second Import')).toBeTruthy();
    expect(screen.getByText('Running')).toBeTruthy();
    expect(screen.getByText('Needs Review')).toBeTruthy();
    // Only the needs-review run has a Review button
    expect(screen.getAllByText('Review').length).toBe(1);
  });

  it('one run transitioning status does not affect the other', () => {
    mockRuns.push(
      {
        runId: 'stable-run',
        documentTitle: 'Stable Doc',
        documentId: 'd1',
        contentTypeIds: ['ct-1'],
        startedAt: new Date().toISOString(),
      },
      {
        runId: 'transitioning-run',
        documentTitle: 'Transitioning Doc',
        documentId: 'd2',
        contentTypeIds: ['ct-2'],
        startedAt: new Date().toISOString(),
      }
    );
    mockStatusMap.set('stable-run', 'completed');
    mockStatusMap.set('transitioning-run', 'running');

    render(<RunsPage sdk={mockSdk} onNewImport={vi.fn()} onReviewRun={vi.fn()} />);

    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText('Running')).toBeTruthy();
    // Stable run has no action buttons (completed, no entries)
    expect(screen.queryByText('Dismiss')).toBeNull();
    expect(screen.queryByText('Review')).toBeNull();
  });
});
