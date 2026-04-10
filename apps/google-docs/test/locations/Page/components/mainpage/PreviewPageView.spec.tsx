import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Layout } from '@contentful/f36-components';
import { describe, expect, it, vi } from 'vitest';

import { PreviewPageView } from '../../../../../src/locations/Page/components/mainpage/PreviewPageView';
import type { MappingReviewSuspendPayload, PreviewPayload } from '@types';

const loadGoogleDocsReviewData = vi.fn();
const mockGoogleDocsMappingReviewScreen = vi.fn((_props: unknown) => (
  <div>Mock mapping review</div>
));

vi.mock('../../../../../src/fixtures/googleDocsReview', () => ({
  loadGoogleDocsReviewData: () => loadGoogleDocsReviewData(),
}));

vi.mock(
  '../../../../../src/locations/Page/components/review-prototype/GoogleDocsMappingReviewScreen',
  () => ({
    GoogleDocsMappingReviewScreen: (props: unknown) => mockGoogleDocsMappingReviewScreen(props),
  })
);

const buildMappingReviewPayload = (): MappingReviewSuspendPayload => ({
  suspendStepId: 'mapping-review',
  reason: 'Mapping review required before CMA payload generation continues',
  documentId: 'doc-1',
  documentTitle: 'Mapping review document',
  normalizedDocument: {
    documentId: 'doc-1',
    title: 'Mapping review document',
    designValues: [],
    contentBlocks: [
      {
        id: 'block-0',
        position: 0,
        type: 'paragraph',
        textRuns: [{ text: 'Overview', styles: {} }],
        flattenedTextRuns: [{ text: 'Overview', start: 0, end: 8, styles: {} }],
        designValueIds: [],
        imageIds: [],
      },
    ],
    images: [],
    tables: [],
    assets: [],
  },
  entryBlockGraph: {
    entries: [
      {
        contentTypeId: 'page',
        tempId: 'page_1',
        fieldMappings: [
          {
            fieldId: 'title',
            fieldType: 'Text',
            sourceRefs: [
              {
                kind: 'blockText',
                blockId: 'block-0',
                start: 0,
                end: 8,
                flattenedRuns: [{ text: 'Overview', start: 0, end: 8, styles: {} }],
              },
            ],
            sourceEntryIds: [],
            confidence: 0.99,
          },
        ],
      },
    ],
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
      sys: { id: 'page' },
      name: 'Page',
      displayField: 'title',
      fields: [],
    },
  ],
});

const buildWorkflowPayload = (): PreviewPayload => ({
  entries: [
    {
      tempId: 'page_1',
      contentTypeId: 'page',
      fields: {
        title: {
          'en-US': 'Example page',
        },
      },
    },
  ],
  assets: [],
  referenceGraph: {
    edges: [],
    creationOrder: [],
    deferredFields: [],
    hasCircularDependency: false,
  },
  normalizedDocument: buildMappingReviewPayload().normalizedDocument,
  entryBlockGraph: buildMappingReviewPayload().entryBlockGraph,
});

describe('PreviewPageView', () => {
  const renderInLayout = (element: React.ReactElement) =>
    render(
      <Layout withBoxShadow={true} offsetTop={10}>
        {element}
      </Layout>
    );

  it('logs a warning when fixture mode cannot load a review fixture', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    loadGoogleDocsReviewData.mockReturnValue(null);

    renderInLayout(<PreviewPageView mode="fixture" onCancel={vi.fn()} />);

    expect(warnSpy).toHaveBeenCalledWith(
      '[google-docs][preview]',
      'Fixture review screen could not be rendered because no valid fixture was loaded.'
    );
  });

  it('renders the fixture review screen inside the preview layout', async () => {
    mockGoogleDocsMappingReviewScreen.mockClear();
    loadGoogleDocsReviewData.mockReturnValue({
      entries: [],
      assets: [],
      originalNormalizedDocument: { contentBlocks: [], tables: [] },
      editableNormalizedDocument: { contentBlocks: [], tables: [] },
      entryBlockGraph: { entries: [], excludedSourceRefs: [] },
    });

    renderInLayout(<PreviewPageView mode="fixture" onCancel={vi.fn()} />);

    expect(screen.getByText('Create from fixture preview')).toBeTruthy();
    expect(screen.getByText('Mock mapping review')).toBeTruthy();
  });

  it('renders workflow preview payloads with the mapping review screen', async () => {
    mockGoogleDocsMappingReviewScreen.mockClear();

    renderInLayout(
      <PreviewPageView mode="workflow" payload={buildWorkflowPayload()} onCancel={vi.fn()} />
    );

    expect(screen.getByText('Create from document "Mapping review document"')).toBeTruthy();
    expect(screen.getByText('Mock mapping review')).toBeTruthy();

    expect(mockGoogleDocsMappingReviewScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        fixture: expect.objectContaining({
          entries: expect.arrayContaining([
            expect.objectContaining({
              contentTypeId: 'page',
              tempId: 'page_1',
            }),
          ]),
        }),
      })
    );
  });

  it('adapts mapping review suspend payloads for the review screen and resumes with the current graph', async () => {
    mockGoogleDocsMappingReviewScreen.mockClear();
    const onContinue = vi.fn();
    const payload = buildMappingReviewPayload();

    renderInLayout(
      <PreviewPageView
        mode="mappingReview"
        payload={payload}
        onCancel={vi.fn()}
        onContinue={onContinue}
      />
    );

    expect(screen.getByText('Review document "Mapping review document"')).toBeTruthy();
    expect(screen.getByText('Mock mapping review')).toBeTruthy();

    expect(mockGoogleDocsMappingReviewScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        fixture: expect.objectContaining({
          entries: expect.arrayContaining([
            expect.objectContaining({
              contentTypeId: 'page',
              fields: {
                title: { 'en-US': 'Page' },
              },
            }),
          ]),
        }),
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledWith({
        editedNormalizedDocument: payload.normalizedDocument,
        entryBlockGraph: payload.entryBlockGraph,
      });
    });
  });

  it('shows fixture guidance when no review fixture is available', async () => {
    loadGoogleDocsReviewData.mockReturnValue(null);

    renderInLayout(<PreviewPageView mode="fixture" onCancel={vi.fn()} />);

    expect(screen.getByText('Fixture not found or invalid')).toBeTruthy();
    expect(screen.getByText(/debug-review-payload-latest\.json/i)).toBeTruthy();
  });

  it('uses the standard preview cancel flow in fixture mode', async () => {
    loadGoogleDocsReviewData.mockReturnValue({
      entries: [],
      assets: [],
      originalNormalizedDocument: { contentBlocks: [], tables: [] },
      editableNormalizedDocument: { contentBlocks: [], tables: [] },
      entryBlockGraph: { entries: [], excludedSourceRefs: [] },
    });

    const onCancel = vi.fn();
    renderInLayout(<PreviewPageView mode="fixture" onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel preview' }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: "You're about to lose your progress" })
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel without creating' }));

    await waitFor(() => {
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});
