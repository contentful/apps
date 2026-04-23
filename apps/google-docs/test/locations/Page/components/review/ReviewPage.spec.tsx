import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PageAppSDK } from '@contentful/app-sdk';
import { Layout } from '@contentful/f36-components';
import type { EntryProps } from 'contentful-management';
import type { CompletedWorkflowPayload, MappingReviewSuspendPayload } from '@types';
import { RunStatus } from '@types';
import React from 'react';
import { createMockSDK } from '../../../../mocks';
import { ReviewPage } from '../../../../../src/locations/Page/components/review/ReviewPage';

const { mockResumeWorkflow, mockCreateEntriesFromPreviewPayload } = vi.hoisted(() => ({
  mockResumeWorkflow: vi.fn(),
  mockCreateEntriesFromPreviewPayload: vi.fn(),
}));

vi.mock('@hooks/useWorkflowAgent', () => ({
  useWorkflowAgent: () => ({
    resumeWorkflow: mockResumeWorkflow,
  }),
}));

vi.mock('../../../../../src/services/entryService', () => ({
  createEntriesFromPreviewPayload: mockCreateEntriesFromPreviewPayload,
}));

vi.mock('../../../../../src/locations/Page/components/review/mapping/MappingView', () => ({
  MappingView: ({ isDisabled }: { isDisabled?: boolean }) => (
    <div>{isDisabled ? 'Mock MappingView disabled' : 'Mock MappingView enabled'}</div>
  ),
}));

const onCancelReview = vi.fn();
const onExitReview = vi.fn();

const reviewPayload: MappingReviewSuspendPayload = {
  suspendStepId: 'mapping-review',
  reason: 'Mapping review required before CMA payload generation continues',
  documentId: 'doc-test',
  documentTitle: 'Document mapping review',
  normalizedDocument: {
    documentId: 'doc-test',
    title: 'Document mapping review',
    designValues: [],
    contentBlocks: [],
    images: [],
    tables: [],
    assets: [],
  },
  entryBlockGraph: {
    entries: [],
    excludedSourceRefs: [],
  },
  referenceGraph: {
    edges: [],
    creationOrder: [],
    deferredFields: [],
    hasCircularDependency: false,
  },
  contentTypes: [
    {
      sys: { id: 'blogPost' },
      name: 'Blog Post',
      displayField: 'title',
      fields: [],
    },
  ],
};

const completedWorkflowPayload: CompletedWorkflowPayload = {
  entries: [],
  assets: [],
  referenceGraph: {},
};

const createdEntries: EntryProps[] = [
  {
    sys: {
      id: 'entry-1',
      type: 'Entry',
      contentType: { sys: { id: 'blogPost', type: 'Link', linkType: 'ContentType' } },
    },
    fields: {
      title: { 'en-US': 'Created entry' },
    },
  } as unknown as EntryProps,
];

function renderReviewPage(mockSdk: PageAppSDK) {
  return render(
    <Layout>
      <ReviewPage
        sdk={mockSdk}
        payload={reviewPayload}
        runId="run-123"
        onCancelReview={onCancelReview}
        onExitReview={onExitReview}
      />
    </Layout>
  );
}

describe('ReviewPage', () => {
  let mockSdk: PageAppSDK;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk = createMockSDK() as PageAppSDK;
    mockResumeWorkflow.mockResolvedValue({
      status: RunStatus.COMPLETED,
      runId: 'run-123',
      messages: [],
      googleDocPayload: completedWorkflowPayload,
    });
    mockCreateEntriesFromPreviewPayload.mockResolvedValue({
      createdEntries,
      errors: [],
    });
  });

  it('shows Create entries and Cancel before creation succeeds', () => {
    renderReviewPage(mockSdk);

    expect(screen.getByRole('button', { name: 'Create entries' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel review' })).toBeTruthy();
    expect(screen.getByText('Mock MappingView enabled')).toBeTruthy();
  });

  it('switches to View entries and Exit after a successful creation', async () => {
    renderReviewPage(mockSdk);

    fireEvent.click(screen.getByRole('button', { name: 'Create entries' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Entries created' })).toBeTruthy();
      expect(screen.getByText('Success! 1 entry has been created:', { exact: false })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Entries created' })).toBeNull();
      expect(screen.getByRole('button', { name: 'View entries' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Exit review' })).toBeTruthy();
      expect(screen.getByText('Mock MappingView disabled')).toBeTruthy();
    });

    expect(mockResumeWorkflow).toHaveBeenCalledWith('run-123', {
      entryBlockGraph: reviewPayload.entryBlockGraph,
    });
    expect(mockCreateEntriesFromPreviewPayload).toHaveBeenCalledWith(
      mockSdk,
      completedWorkflowPayload
    );
  });

  it('reopens the summary modal from View entries without creating again', async () => {
    renderReviewPage(mockSdk);

    fireEvent.click(screen.getByRole('button', { name: 'Create entries' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Entries created' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Entries created' })).toBeNull();
      expect(screen.getByRole('button', { name: 'View entries' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'View entries' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Entries created' })).toBeTruthy();
    });

    expect(mockResumeWorkflow).toHaveBeenCalledTimes(1);
    expect(mockCreateEntriesFromPreviewPayload).toHaveBeenCalledTimes(1);
  });

  it('calls onExitReview without reopening the cancel confirmation modal after creation', async () => {
    renderReviewPage(mockSdk);

    fireEvent.click(screen.getByRole('button', { name: 'Create entries' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Entries created' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Entries created' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Exit review' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Exit review' }));

    await waitFor(() => {
      expect(onExitReview).toHaveBeenCalledTimes(1);
    });

    expect(onCancelReview).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('heading', { name: "You're about to lose your progress" })
    ).toBeNull();
  });

  it('returns to the main page when create is attempted without a run id', async () => {
    render(
      <Layout>
        <ReviewPage
          sdk={mockSdk}
          payload={reviewPayload}
          onCancelReview={onCancelReview}
          onExitReview={onExitReview}
        />
      </Layout>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create entries' }));

    await waitFor(() => {
      expect(onExitReview).toHaveBeenCalledTimes(1);
    });

    expect(mockResumeWorkflow).not.toHaveBeenCalled();
    expect(mockCreateEntriesFromPreviewPayload).not.toHaveBeenCalled();
    expect(screen.queryByText('Failed to create entries')).toBeNull();
  });
});
