import { render, screen, within } from '@testing-library/react';
import React from 'react';
import tokens from '@contentful/f36-tokens';
import { describe, expect, it, vi } from 'vitest';

import { GoogleDocsMappingReviewScreen } from '../../../../../src/locations/Page/components/review-prototype/GoogleDocsMappingReviewScreen';
import type { GoogleDocsReviewFixture } from '../../../../../src/fixtures/googleDocsReview';

function buildFixture(): GoogleDocsReviewFixture {
  const originalNormalizedDocument = {
    documentId: 'doc-1',
    title: 'Demo document',
    designValues: [],
    contentBlocks: [
      {
        id: 'block-0',
        position: 0,
        type: 'heading' as const,
        headingLevel: 1,
        textRuns: [{ text: 'Overview', styles: {} }],
        designValueIds: [],
        imageIds: [],
      },
      {
        id: 'block-1',
        position: 1,
        type: 'paragraph' as const,
        textRuns: [
          { text: 'Body ', styles: {} },
          { text: 'paragraph', styles: { bold: true } },
        ],
        designValueIds: [],
        imageIds: [],
      },
    ],
    images: [
      {
        id: 'img-0',
        url: 'https://images.ctfassets.net/example/header-image.png',
        title: 'Header image',
        tableId: 'table-0',
      },
    ],
    tables: [
      {
        id: 'table-0',
        position: 2,
        headers: [],
        rows: [
          {
            id: 'table-0-row-0',
            cells: [
              {
                id: 'table-0-row-0-cell-0',
                parts: [
                  {
                    id: 'table-0-row-0-cell-0-part-0',
                    type: 'text' as const,
                    textRuns: [{ text: 'Header image', styles: {} }],
                  },
                ],
              },
              {
                id: 'table-0-row-0-cell-1',
                parts: [
                  {
                    id: 'table-0-row-0-cell-1-part-0',
                    type: 'text' as const,
                    textRuns: [{ text: 'Left: Drupal ', styles: {} }],
                  },
                  {
                    id: 'table-0-row-0-cell-1-part-1',
                    type: 'image' as const,
                    imageId: 'img-0',
                  },
                  {
                    id: 'table-0-row-0-cell-1-part-2',
                    type: 'text' as const,
                    textRuns: [{ text: 'Right: Contentful', styles: { bold: true } }],
                  },
                ],
              },
            ],
          },
        ],
        designValueIds: [],
        imageIds: ['img-0'],
      },
    ],
    assets: [],
  };

  return {
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
      hasCircularDependency: false,
      deferredFields: [],
    },
    originalNormalizedDocument,
    editableNormalizedDocument: JSON.parse(JSON.stringify(originalNormalizedDocument)),
    entryBlockGraph: {
      entries: [
        {
          contentTypeId: 'page',
          tempId: 'page_1',
          fieldMappings: [
            {
              fieldId: 'body',
              fieldType: 'RichText',
              sourceRefs: [{ kind: 'blockText', blockId: 'block-1', start: 0, end: 5 }],
              sourceEntryIds: [],
              confidence: 0.98,
            },
            {
              fieldId: 'image',
              fieldType: 'Link',
              sourceRefs: [
                {
                  kind: 'tableImage',
                  tableId: 'table-0',
                  rowId: 'table-0-row-0',
                  cellId: 'table-0-row-0-cell-1',
                  partId: 'table-0-row-0-cell-1-part-1',
                  imageId: 'img-0',
                },
              ],
              sourceEntryIds: [],
              confidence: 0.92,
            },
            {
              fieldId: 'imageCaption',
              fieldType: 'Text',
              sourceRefs: [
                {
                  kind: 'tableText',
                  tableId: 'table-0',
                  rowId: 'table-0-row-0',
                  cellId: 'table-0-row-0-cell-1',
                  partId: 'table-0-row-0-cell-1-part-2',
                  start: 0,
                  end: 18,
                },
              ],
              sourceEntryIds: [],
              confidence: 0.88,
            },
          ],
        },
      ],
      excludedSourceRefs: [],
    },
  };
}

describe('GoogleDocsMappingReviewScreen', () => {
  it('renders highlighted block text spans from entryBlockGraph', () => {
    render(<GoogleDocsMappingReviewScreen fixture={buildFixture()} onBack={vi.fn()} />);

    expect(screen.getByTestId('section-surface-section-block-0')).toHaveStyle({
      backgroundColor: tokens.gray100,
    });
    expect(screen.getByTestId('block-segment-block-1-0')).toHaveAttribute(
      'data-highlighted',
      'true'
    );
    expect(screen.getByText('paragraph')).toBeTruthy();
  });

  it('renders mixed table cell text and image highlights independently', () => {
    render(<GoogleDocsMappingReviewScreen fixture={buildFixture()} onBack={vi.fn()} />);

    expect(screen.getByTestId('section-surface-section-table-0')).toHaveStyle({
      backgroundColor: tokens.gray100,
    });
    expect(screen.getByTestId('table-cell-table-0-row-0-cell-1').getAttribute('style')).toContain(
      'background-color: transparent'
    );
    expect(screen.getByTestId('table-text-segment-table-0-row-0-cell-1-part-0-0')).toHaveAttribute(
      'data-highlighted',
      'false'
    );
    expect(screen.getByTestId('table-text-segment-table-0-row-0-cell-1-part-2-0')).toHaveAttribute(
      'data-highlighted',
      'true'
    );
    expect(screen.getByTestId('table-image-part-table-0-row-0-cell-1-part-1')).toHaveAttribute(
      'data-highlighted',
      'true'
    );
  });

  it('renders compact annotation cards with content type, entry name, and field name', () => {
    render(<GoogleDocsMappingReviewScreen fixture={buildFixture()} onBack={vi.fn()} />);

    expect(screen.getByTestId('mapping-rail-section-block-0')).toHaveStyle({ maxWidth: '280px' });

    const card = screen.getByTestId('mapping-card-section-block-0-0-body');

    expect(card).toHaveStyle({ backgroundColor: tokens.green100 });
    expect(card).toHaveStyle({ padding: tokens.spacing2Xs });
    expect(within(card).getByText('Content type')).toBeTruthy();
    expect(within(card).getByText('Page')).toBeTruthy();
    expect(within(card).getByText('Entry name')).toBeTruthy();
    expect(within(card).getByText('Example page')).toBeTruthy();
    expect(within(card).getByText('Field')).toBeTruthy();
    expect(within(card).getByText('Body')).toBeTruthy();
  });
});
