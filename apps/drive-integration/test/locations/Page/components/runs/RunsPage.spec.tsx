import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RunRecord } from '../../../../../src/types/runs';
import { DisplayStatus } from '../../../../../src/types/runs';

const mockStatusMap = new Map<string, DisplayStatus>();
const mockErrorMap = new Map<string, string>();
const mockTitleMap = new Map<string, string>();

vi.mock('../../../../../src/hooks/useRunsPolling', () => ({
  useRunsPolling: () => ({
    statusMap: mockStatusMap,
    errorMap: mockErrorMap,
    titleMap: mockTitleMap,
  }),
}));

import { RunsPage } from '../../../../../src/locations/Page/components/runs/RunsPage';
import { createMockSDK } from '../../../../mocks';

const mockSdk = createMockSDK() as any;
const mockRemoveRun = vi.fn();

let mockRuns: RunRecord[] = [];
let mockStorageError: string | null = null;

beforeEach(() => {
  mockRuns = [];
  mockStatusMap.clear();
  mockErrorMap.clear();
  mockTitleMap.clear();
  mockStorageError = null;
  vi.clearAllMocks();
});

function renderRunsPage(
  overrides: { onStartImport?: () => void; onReviewRun?: (id: string) => void } = {}
) {
  return render(
    <RunsPage
      sdk={mockSdk}
      runs={mockRuns}
      removeRun={mockRemoveRun}
      storageError={mockStorageError}
      onStartImport={overrides.onStartImport ?? vi.fn()}
      onReviewRun={overrides.onReviewRun ?? vi.fn()}
      onRetryRun={vi.fn()}
      isOAuthConnected={true}
      isOAuthBusy={false}
      onConnectGoogleDrive={vi.fn()}
      onDisconnectGoogleDrive={vi.fn()}
    />
  );
}

describe('RunsPage', () => {
  it('renders empty state when no runs', () => {
    renderRunsPage();
    expect(screen.getByText(/no imports yet/i)).toBeTruthy();
  });

  it('shows Select file button', () => {
    renderRunsPage();
    expect(screen.getByText('Select file')).toBeTruthy();
  });

  it('renders a row per run', () => {
    mockRuns.push(
      {
        runId: 'run-1',
        documentTitle: 'Doc A',
        documentId: 'd1',
        contentTypeIds: ['ct-1'],
        documentSelection: { includeImages: false, selectedTabIds: [] },
        startedAt: new Date().toISOString(),
      },
      {
        runId: 'run-2',
        documentTitle: 'Doc B',
        documentId: 'd2',
        contentTypeIds: ['ct-2'],
        documentSelection: { includeImages: false, selectedTabIds: [] },
        startedAt: new Date().toISOString(),
      }
    );
    mockStatusMap.set('run-1', DisplayStatus.RUNNING);
    mockStatusMap.set('run-2', DisplayStatus.COMPLETED);

    renderRunsPage();
    expect(screen.getByText('Doc A')).toBeTruthy();
    expect(screen.getByText('Doc B')).toBeTruthy();
  });

  it('clicking Review on a needs-review run calls onReviewRun', () => {
    mockRuns.push({
      runId: 'run-review',
      documentTitle: 'Review Me',
      documentId: 'd1',
      contentTypeIds: ['ct-1'],
      documentSelection: { includeImages: false, selectedTabIds: [] },
      startedAt: new Date().toISOString(),
    });
    mockStatusMap.set('run-review', DisplayStatus.NEEDS_REVIEW);

    const onReviewRun = vi.fn();
    renderRunsPage({ onReviewRun });
    fireEvent.click(screen.getByText('Review'));
    expect(onReviewRun).toHaveBeenCalledWith('run-review');
  });

  it('shows storage error note when storageError is set', () => {
    mockStorageError = 'Storage full';
    renderRunsPage();
    expect(screen.getByText(/storage full/i)).toBeTruthy();
  });

  it('renders two concurrent runs with independent statuses', () => {
    mockRuns.push(
      {
        runId: 'concurrent-1',
        documentTitle: 'First Import',
        documentId: 'd1',
        contentTypeIds: ['ct-1'],
        documentSelection: { includeImages: false, selectedTabIds: [] },
        startedAt: new Date().toISOString(),
      },
      {
        runId: 'concurrent-2',
        documentTitle: 'Second Import',
        documentId: 'd2',
        contentTypeIds: ['ct-2'],
        documentSelection: { includeImages: false, selectedTabIds: [] },
        startedAt: new Date().toISOString(),
      }
    );
    mockStatusMap.set('concurrent-1', DisplayStatus.RUNNING);
    mockStatusMap.set('concurrent-2', DisplayStatus.NEEDS_REVIEW);

    renderRunsPage();

    expect(screen.getByText('First Import')).toBeTruthy();
    expect(screen.getByText('Second Import')).toBeTruthy();
    expect(screen.getByText('In progress')).toBeTruthy();
    expect(screen.getByText('Ready for review')).toBeTruthy();
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
        documentSelection: { includeImages: false, selectedTabIds: [] },
        startedAt: new Date().toISOString(),
      },
      {
        runId: 'transitioning-run',
        documentTitle: 'Transitioning Doc',
        documentId: 'd2',
        contentTypeIds: ['ct-2'],
        documentSelection: { includeImages: false, selectedTabIds: [] },
        startedAt: new Date().toISOString(),
      }
    );
    mockStatusMap.set('stable-run', DisplayStatus.COMPLETED);
    mockStatusMap.set('transitioning-run', DisplayStatus.RUNNING);

    renderRunsPage();

    expect(screen.getByText(/Complete/)).toBeTruthy();
    expect(screen.getByText('In progress')).toBeTruthy();
    // No Review or Retry buttons for these states
    expect(screen.queryByText('Review')).toBeNull();
  });
});
