import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Layout } from '@contentful/f36-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PageAppSDK } from '@contentful/app-sdk';
import type { MappingReviewSuspendPayload } from '@types';
import { RunStatus } from '@types';
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
  MappingView: ({ selectedEntryIndex }: { selectedEntryIndex: number | null }) => (
    <div>{`selected-index:${selectedEntryIndex ?? 'none'}`}</div>
  ),
}));

const createTextSourceRef = (blockId: string, text: string) => ({
  type: 'blockText' as const,
  blockId,
  start: 0,
  end: text.length,
  flattenedRuns: [{ text, start: 0, end: text.length }],
});

const createPayload = (): MappingReviewSuspendPayload => ({
  suspendStepId: 'mapping-review',
  reason: 'Mapping review required before CMA payload generation continues',
  documentId: 'doc-review',
  documentTitle: 'Review document',
  normalizedDocument: {
    documentId: 'doc-review',
    title: 'Review document',
    designValues: [],
    contentBlocks: [],
    images: [],
    tables: [],
    assets: [],
  },
  entryBlockGraph: {
    entries: [
      {
        tempId: 'page-1',
        contentTypeId: 'article',
        fieldMappings: [
          {
            fieldId: 'title',
            fieldType: 'Symbol',
            sourceRefs: [createTextSourceRef('block-1', 'First title')],
            confidence: 0.9,
          },
          {
            fieldId: 'related',
            fieldType: 'Array',
            sourceRefs: [],
            sourceEntryIds: ['hero-1'],
            confidence: 0.9,
          },
        ],
      },
      {
        tempId: 'hero-1',
        contentTypeId: 'article',
        fieldMappings: [
          {
            fieldId: 'title',
            fieldType: 'Symbol',
            sourceRefs: [createTextSourceRef('block-2', 'Second title')],
            confidence: 0.9,
          },
        ],
      },
    ],
    excludedSourceRefs: [],
  },
  referenceGraph: {
    edges: [{ from: 'page-1', to: 'hero-1', fieldId: 'related' }],
    creationOrder: ['hero-1', 'page-1'],
    deferredFields: [],
    hasCircularDependency: false,
  },
  contentTypes: [
    {
      sys: { id: 'article' },
      name: 'Article',
      displayField: 'title',
      fields: [
        { id: 'title', name: 'Title', type: 'Symbol' },
        {
          id: 'related',
          name: 'Related entries',
          type: 'Array',
          items: { type: 'Link', linkType: 'Entry' },
        },
      ],
    },
  ],
});

let sdk: PageAppSDK;

const renderReviewPage = (payload: MappingReviewSuspendPayload = createPayload()) =>
  render(
    <Layout>
      <ReviewPage
        sdk={sdk}
        payload={payload}
        runId="run-1"
        onCancelReview={vi.fn()}
        onExitReview={vi.fn()}
      />
    </Layout>
  );

describe('ReviewPage entry selection', () => {
  beforeEach(() => {
    sdk = createMockSDK() as PageAppSDK;
    vi.clearAllMocks();
    mockResumeWorkflow.mockResolvedValue({
      status: RunStatus.COMPLETED,
      runId: 'run-1',
      messages: [],
      googleDocPayload: { entries: [], assets: [], referenceGraph: {} },
    });
    mockCreateEntriesFromPreviewPayload.mockResolvedValue({ createdEntries: [], errors: [] });
  });

  afterEach(() => {
    cleanup();
  });

  it('selects all entries by default and toggles checkboxes independently from row focus', () => {
    renderReviewPage();

    const firstCheckbox = screen.getByRole('checkbox', {
      name: 'Create entry Article (First title)',
    });
    const secondCheckbox = screen.getByRole('checkbox', {
      name: 'Create entry Article (Second title)',
    });

    expect(firstCheckbox).toBeChecked();
    expect(secondCheckbox).toBeChecked();
    expect(screen.getByText('2 of 2 entries selected')).toBeTruthy();
    expect(screen.getByText('selected-index:none')).toBeTruthy();

    fireEvent.click(secondCheckbox);

    expect(secondCheckbox).not.toBeChecked();
    expect(screen.getByText('1 of 2 entries selected')).toBeTruthy();
    expect(screen.getByText('selected-index:none')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Article \(First title\)/ }));
    expect(screen.getByText('selected-index:0')).toBeTruthy();
  });

  it('disables create when no entries are selected', () => {
    renderReviewPage();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Create entry Article (First title)' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Create entry Article (Second title)' }));

    expect(screen.getByRole('button', { name: 'Create selected entries' })).toBeDisabled();
    expect(screen.getByText('0 of 2 entries selected')).toBeTruthy();
  });

  it('resumes the workflow with only selected entries and pruned sourceEntryIds', async () => {
    renderReviewPage();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Create entry Article (Second title)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create selected entries' }));

    await waitFor(() => expect(mockResumeWorkflow).toHaveBeenCalledTimes(1));

    const resumePayload = mockResumeWorkflow.mock.calls[0][1];
    expect(resumePayload.entryBlockGraph.entries).toHaveLength(1);
    expect(resumePayload.entryBlockGraph.entries[0].tempId).toBe('page-1');
    expect(resumePayload.entryBlockGraph.entries[0].fieldMappings[1].sourceEntryIds).toEqual([]);
  });
});
