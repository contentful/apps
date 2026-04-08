import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import tokens from '@contentful/f36-tokens';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GoogleDocsMappingReviewScreen } from '../../../../../src/locations/Page/components/review-prototype/GoogleDocsMappingReviewScreen';
import type { GoogleDocsReviewData } from '../../../../../src/fixtures/googleDocsReview';

function buildFixture(): GoogleDocsReviewData {
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
      {
        id: 'block-2',
        position: 3,
        type: 'heading' as const,
        headingLevel: 2,
        textRuns: [{ text: 'Unmapped section', styles: {} }],
        designValueIds: [],
        imageIds: [],
      },
      {
        id: 'block-3',
        position: 4,
        type: 'paragraph' as const,
        textRuns: [{ text: 'This section has no mappings.', styles: {} }],
        designValueIds: [],
        imageIds: [],
      },
      {
        id: 'block-4',
        position: 5,
        type: 'listItem' as const,
        textRuns: [{ text: 'First step', styles: {} }],
        designValueIds: [],
        imageIds: [],
        bullet: {
          nestingLevel: 0,
          ordered: true,
        },
      },
      {
        id: 'block-5',
        position: 6,
        type: 'listItem' as const,
        textRuns: [{ text: 'Nested detail', styles: {} }],
        designValueIds: [],
        imageIds: [],
        bullet: {
          nestingLevel: 1,
          ordered: false,
        },
      },
      {
        id: 'block-6',
        position: 7,
        type: 'listItem' as const,
        textRuns: [{ text: 'Second step', styles: {} }],
        designValueIds: [],
        imageIds: [],
        bullet: {
          nestingLevel: 0,
          ordered: true,
        },
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders linked text runs as anchors in blocks and table cells', () => {
    const fixture = buildFixture();

    const linkedBlockRuns = [
      { text: 'Visit ', styles: {} },
      {
        text: 'Contentful',
        styles: { linkUrl: 'https://www.contentful.com' },
      },
    ];

    fixture.originalNormalizedDocument.contentBlocks[1].textRuns = linkedBlockRuns;
    fixture.editableNormalizedDocument.contentBlocks[1].textRuns = linkedBlockRuns;
    fixture.entryBlockGraph.entries[0].fieldMappings[0].sourceRefs = [
      { kind: 'blockText', blockId: 'block-1', start: 0, end: 17 },
    ];

    const linkedTableRuns = [
      {
        text: 'View map',
        styles: { linkUrl: 'https://maps.app.goo.gl/example' },
      },
    ];

    fixture.originalNormalizedDocument.tables[0].rows[0].cells[1].parts[2] = {
      id: 'table-0-row-0-cell-1-part-2',
      type: 'text',
      textRuns: linkedTableRuns,
    };
    fixture.editableNormalizedDocument.tables[0].rows[0].cells[1].parts[2] = {
      id: 'table-0-row-0-cell-1-part-2',
      type: 'text',
      textRuns: linkedTableRuns,
    };
    fixture.entryBlockGraph.entries[0].fieldMappings[2].sourceRefs = [
      {
        kind: 'tableText',
        tableId: 'table-0',
        rowId: 'table-0-row-0',
        cellId: 'table-0-row-0-cell-1',
        partId: 'table-0-row-0-cell-1-part-2',
        start: 0,
        end: 8,
      },
    ];

    render(<GoogleDocsMappingReviewScreen fixture={fixture} onBack={vi.fn()} />);

    expect(screen.getByRole('link', { name: 'Contentful' })).toHaveAttribute(
      'href',
      'https://www.contentful.com'
    );
    expect(screen.getByRole('link', { name: 'View map' })).toHaveAttribute(
      'href',
      'https://maps.app.goo.gl/example'
    );
  });

  it('renders highlighted block text spans from entryBlockGraph', () => {
    render(<GoogleDocsMappingReviewScreen fixture={buildFixture()} onBack={vi.fn()} />);

    expect(screen.getByTestId('section-surface-section-block-0').getAttribute('style')).toBeNull();
    expect(screen.getByTestId('block-segment-block-1-0')).toHaveAttribute(
      'data-highlighted',
      'true'
    );
    expect(screen.getByText('paragraph')).toBeTruthy();
  });

  it('renders mixed table cell text and image highlights independently', () => {
    render(<GoogleDocsMappingReviewScreen fixture={buildFixture()} onBack={vi.fn()} />);

    expect(screen.getByTestId('section-surface-section-table-0').getAttribute('style')).toBeNull();
    expect(screen.queryByText(/^Table$/)).toBeNull();
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

  it('syncs hover styling between mapping cards and their highlights', () => {
    render(<GoogleDocsMappingReviewScreen fixture={buildFixture()} onBack={vi.fn()} />);

    const card = screen.getByTestId('mapping-card-section-table-0-0-imageCaption');
    const textHighlight = screen.getByTestId('table-text-segment-table-0-row-0-cell-1-part-2-0');

    expect(card).toHaveStyle({ border: `1px solid ${tokens.green500}` });
    expect(textHighlight).toHaveStyle({ backgroundColor: tokens.green200 });

    fireEvent.mouseEnter(card);

    expect(card).toHaveAttribute('data-hovered', 'true');
    expect(card).toHaveStyle({ border: `2px solid ${tokens.green600}` });
    expect(textHighlight).toHaveAttribute('data-hovered', 'true');
    expect(textHighlight).toHaveStyle({ backgroundColor: tokens.green300 });

    fireEvent.mouseLeave(card);
    fireEvent.mouseEnter(textHighlight);

    expect(card).toHaveAttribute('data-hovered', 'true');
    expect(card).toHaveStyle({ border: `2px solid ${tokens.green600}` });
    expect(textHighlight).toHaveAttribute('data-hovered', 'true');
    expect(textHighlight).toHaveStyle({ backgroundColor: tokens.green300 });
  });

  it('renders ordered and nested unordered list item styling', () => {
    render(<GoogleDocsMappingReviewScreen fixture={buildFixture()} onBack={vi.fn()} />);

    expect(screen.getByTestId('list-marker-block-4')).toHaveTextContent('1.');
    expect(screen.getByTestId('list-item-block-5')).toHaveStyle({
      marginInlineStart: `calc(${tokens.spacingM} * 1)`,
    });
    expect(screen.getByTestId('list-marker-block-5')).toHaveTextContent('◦');
    expect(screen.getByTestId('list-marker-block-6')).toHaveTextContent('2.');
    expect(screen.getByText('Nested detail')).toBeTruthy();
  });

  it('renders field cards with the field type appended and no unmapped empty-state cards', () => {
    render(<GoogleDocsMappingReviewScreen fixture={buildFixture()} onBack={vi.fn()} />);

    expect(screen.getByTestId('mapping-rail-section-block-0')).toHaveStyle({ maxWidth: '280px' });

    const card = screen.getByTestId('mapping-card-section-block-0-0-body');

    expect(card).toHaveStyle({ backgroundColor: tokens.green100 });
    expect(card).toHaveStyle({ padding: tokens.spacing2Xs });
    expect(within(card).getByText('Field:')).toBeTruthy();
    expect(within(card).getByText('Body')).toBeTruthy();
    expect(within(card).getByText(/\|\s*Rich Text/)).toBeTruthy();
    expect(screen.queryByText('No mappings for this section')).toBeNull();
  });

  it('positions mapping cards against measured document anchors', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement
    ) {
      const anchorId = this.getAttribute('data-anchor-id');
      const testId = this.getAttribute('data-testid');

      if (testId === 'section-layout-section-block-0') {
        return {
          x: 0,
          y: 100,
          top: 100,
          left: 0,
          bottom: 500,
          right: 640,
          width: 640,
          height: 400,
          toJSON: () => ({}),
        };
      }

      if (testId === 'section-layout-section-table-0') {
        return {
          x: 0,
          y: 160,
          top: 160,
          left: 0,
          bottom: 760,
          right: 640,
          width: 640,
          height: 600,
          toJSON: () => ({}),
        };
      }

      if (anchorId === 'block:block-1') {
        return {
          x: 0,
          y: 180,
          top: 180,
          left: 0,
          bottom: 220,
          right: 320,
          width: 320,
          height: 40,
          toJSON: () => ({}),
        };
      }

      if (anchorId === 'row:table-0:table-0-row-0') {
        return {
          x: 0,
          y: 320,
          top: 320,
          left: 0,
          bottom: 380,
          right: 320,
          width: 320,
          height: 60,
          toJSON: () => ({}),
        };
      }

      return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        bottom: 28,
        right: 200,
        width: 200,
        height: 28,
        toJSON: () => ({}),
      };
    });

    render(<GoogleDocsMappingReviewScreen fixture={buildFixture()} onBack={vi.fn()} />);

    expect(screen.getByTestId('mapping-card-position-section-block-0-0-body')).toHaveStyle({
      top: '80px',
    });
    expect(screen.getByTestId('mapping-card-position-section-table-0-0-image')).toHaveStyle({
      top: '160px',
    });
  });
});
