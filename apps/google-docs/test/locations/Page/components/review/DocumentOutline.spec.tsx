import { fireEvent, render, screen, within } from '@testing-library/react';
import tokens from '@contentful/f36-tokens';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DocumentOutline } from '../../../../../src/locations/Page/components/review/DocumentOutline';
import type { MappingReviewSuspendPayload, NormalizedDocumentContentBlock } from '@types';

function buildFixture(): MappingReviewSuspendPayload {
  const normalizedDocument = {
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
        flattenedTextRuns: [{ text: 'Overview', start: 0, end: 8, styles: {} }],
        designValueIds: [],
        imageIds: [],
      },
      {
        id: 'block-1',
        position: 1,
        type: 'paragraph' as const,
        textRuns: [
          { text: 'Body ', styles: {} },
          { text: 'paragraph', styles: { bold: true as const } },
        ],
        flattenedTextRuns: [
          { text: 'Body ', start: 0, end: 5, styles: {} },
          { text: 'paragraph', start: 5, end: 14, styles: { bold: true as const } },
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
        flattenedTextRuns: [{ text: 'Unmapped section', start: 0, end: 16, styles: {} }],
        designValueIds: [],
        imageIds: [],
      },
      {
        id: 'block-3',
        position: 4,
        type: 'paragraph' as const,
        textRuns: [{ text: 'This section has no mappings.', styles: {} }],
        flattenedTextRuns: [
          { text: 'This section has no mappings.', start: 0, end: 29, styles: {} },
        ],
        designValueIds: [],
        imageIds: [],
      },
      {
        id: 'block-4',
        position: 5,
        type: 'listItem' as const,
        textRuns: [{ text: 'First step', styles: {} }],
        flattenedTextRuns: [{ text: 'First step', start: 0, end: 10, styles: {} }],
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
        flattenedTextRuns: [{ text: 'Nested detail', start: 0, end: 13, styles: {} }],
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
        flattenedTextRuns: [{ text: 'Second step', start: 0, end: 11, styles: {} }],
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
                    flattenedTextRuns: [{ text: 'Header image', start: 0, end: 12, styles: {} }],
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
                    flattenedTextRuns: [{ text: 'Left: Drupal ', start: 0, end: 13, styles: {} }],
                  },
                  {
                    id: 'table-0-row-0-cell-1-part-1',
                    type: 'image' as const,
                    imageId: 'img-0',
                  },
                  {
                    id: 'table-0-row-0-cell-1-part-2',
                    type: 'text' as const,
                    textRuns: [{ text: 'Right: Contentful', styles: { bold: true as const } }],
                    flattenedTextRuns: [
                      {
                        text: 'Right: Contentful',
                        start: 0,
                        end: 17,
                        styles: { bold: true as const },
                      },
                    ],
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
    suspendStepId: 'mapping-review',
    reason: 'Mapping review required',
    documentId: 'doc-1',
    documentTitle: 'Demo document',
    normalizedDocument,
    contentTypes: [],
    referenceGraph: {
      edges: [],
      creationOrder: [],
      hasCircularDependency: false,
      deferredFields: [],
    },
    entryBlockGraph: {
      entries: [
        {
          contentTypeId: 'page',
          tempId: 'page_1',
          fieldMappings: [
            {
              fieldId: 'body',
              fieldType: 'RichText',
              sourceRefs: [
                { kind: 'blockText', blockId: 'block-1', start: 0, end: 5, flattenedRuns: [] },
              ],
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
                  flattenedRuns: [],
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

describe('DocumentOutline', () => {
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

    (fixture.normalizedDocument.contentBlocks[1] as NormalizedDocumentContentBlock).textRuns =
      linkedBlockRuns;
    (
      fixture.normalizedDocument.contentBlocks[1] as NormalizedDocumentContentBlock
    ).flattenedTextRuns = [
      { text: 'Visit ', start: 0, end: 6, styles: {} },
      { text: 'Contentful', start: 6, end: 16, styles: { linkUrl: 'https://www.contentful.com' } },
    ];
    fixture.entryBlockGraph.entries[0].fieldMappings[0].sourceRefs = [
      { kind: 'blockText', blockId: 'block-1', start: 0, end: 17, flattenedRuns: [] },
    ];

    const linkedTableRuns = [
      {
        text: 'View map',
        styles: { linkUrl: 'https://maps.app.goo.gl/example' },
      },
    ];

    fixture.normalizedDocument.tables[0].rows[0].cells[1].parts[2] = {
      id: 'table-0-row-0-cell-1-part-2',
      type: 'text',
      textRuns: linkedTableRuns,
      flattenedTextRuns: [
        {
          text: 'View map',
          start: 0,
          end: 8,
          styles: { linkUrl: 'https://maps.app.goo.gl/example' },
        },
      ],
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
        flattenedRuns: [],
      },
    ];

    render(<DocumentOutline payload={fixture} />);

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
    render(<DocumentOutline payload={buildFixture()} />);

    expect(screen.getByTestId('segment-surface-block-0').getAttribute('style')).toBeNull();
    expect(screen.getByTestId('block-segment-block-1-0')).toHaveAttribute(
      'data-highlighted',
      'true'
    );
    expect(screen.getByText('paragraph')).toBeTruthy();
  });

  it('renders mapping cards and highlights for block refs from the API shape', () => {
    const fixture = buildFixture();

    fixture.entryBlockGraph.entries[0].fieldMappings[0].sourceRefs = [
      {
        type: 'paragraph',
        blockId: 'block-1',
        start: 0,
        end: 5,
        flattenedRuns: [{ text: 'Body ', start: 0, end: 5, styles: {} }],
      } as (typeof fixture.entryBlockGraph.entries)[number]['fieldMappings'][number]['sourceRefs'][number],
    ];

    render(<DocumentOutline payload={fixture} />);

    expect(screen.getByTestId('mapping-card-block-1-0-body')).toBeTruthy();
    expect(screen.getByTestId('block-segment-block-1-0')).toHaveAttribute(
      'data-highlighted',
      'true'
    );
  });

  it('renders mixed table cell text and image highlights independently', () => {
    render(<DocumentOutline payload={buildFixture()} />);

    expect(screen.getByTestId('segment-surface-table-0').getAttribute('style')).toBeNull();
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

  it('highlights mapped offsets using flattened run coordinates', () => {
    const fixture = buildFixture();

    fixture.normalizedDocument.tables[0].rows[0].cells[1].parts[2] = {
      id: 'table-0-row-0-cell-1-part-2',
      type: 'text',
      textRuns: [{ text: 'NoYes', styles: {} }],
      flattenedTextRuns: [
        { text: 'No', start: 0, end: 2, styles: {} },
        { text: 'Yes', start: 6, end: 9, styles: {} },
      ],
    };
    fixture.entryBlockGraph.entries[0].fieldMappings[2].sourceRefs = [
      {
        type: 'tableText',
        tableId: 'table-0',
        rowId: 'table-0-row-0',
        cellId: 'table-0-row-0-cell-1',
        partId: 'table-0-row-0-cell-1-part-2',
        start: 6,
        end: 9,
        flattenedRuns: [{ text: 'Yes', start: 6, end: 9, styles: {} }],
      } as (typeof fixture.entryBlockGraph.entries)[number]['fieldMappings'][number]['sourceRefs'][number],
    ];

    render(<DocumentOutline payload={fixture} />);

    expect(
      screen.getByTestId('table-text-segment-table-0-row-0-cell-1-part-2-1')
    ).toHaveTextContent('Yes');
    expect(screen.getByTestId('table-text-segment-table-0-row-0-cell-1-part-2-1')).toHaveAttribute(
      'data-highlighted',
      'true'
    );
  });

  it('syncs hover styling between mapping cards and their highlights', () => {
    render(<DocumentOutline payload={buildFixture()} />);

    const card = screen.getByTestId('mapping-card-table-0-0-imageCaption');
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
    render(<DocumentOutline payload={buildFixture()} />);

    expect(screen.getByTestId('list-marker-block-4')).toHaveTextContent('1.');
    expect(screen.getByTestId('list-item-block-5')).toHaveStyle({
      marginInlineStart: `calc(${tokens.spacingM} * 1)`,
    });
    expect(screen.getByTestId('list-marker-block-5')).toHaveTextContent('◦');
    expect(screen.getByTestId('list-marker-block-6')).toHaveTextContent('2.');
    expect(screen.getByText('Nested detail')).toBeTruthy();
  });

  it('renders field cards with the field type appended and no unmapped empty-state cards', () => {
    render(<DocumentOutline payload={buildFixture()} />);

    expect(screen.getByTestId('mapping-rail-block-1')).toHaveStyle({ maxWidth: '280px' });

    const card = screen.getByTestId('mapping-card-block-1-0-body');

    expect(card).toHaveStyle({ backgroundColor: tokens.green100 });
    expect(card).toHaveStyle({ padding: tokens.spacing2Xs });
    expect(within(card).getByText('Field:')).toBeTruthy();
    expect(within(card).getByText('Body')).toBeTruthy();
    expect(within(card).getByText(/\|\s*Rich Text/)).toBeTruthy();
    expect(screen.queryByText('No mappings for this section')).toBeNull();
  });

  it('filters mappings when an overview entry card is selected', () => {
    const fixture = buildFixture();

    fixture.entryBlockGraph.entries.push({
      contentTypeId: 'page',
      tempId: 'page_2',
      fieldMappings: [
        {
          fieldId: 'faqBody',
          fieldType: 'RichText',
          sourceRefs: [
            { kind: 'blockText', blockId: 'block-3', start: 0, end: 28, flattenedRuns: [] },
          ],
          sourceEntryIds: [],
          confidence: 0.91,
        },
      ],
    });

    render(<DocumentOutline payload={fixture} />);

    expect(screen.getByTestId('mapping-card-block-1-0-body')).toBeTruthy();
    expect(screen.getByTestId('mapping-card-block-3-1-faqBody')).toBeTruthy();

    fireEvent.click(screen.getByTestId('entry-overview-card-page_2'));

    expect(screen.queryByTestId('mapping-card-block-1-0-body')).toBeNull();
    expect(screen.getByTestId('mapping-card-block-3-1-faqBody')).toBeTruthy();
  });

  it('positions mapping cards against measured document anchors', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement
    ) {
      const anchorId = this.getAttribute('data-anchor-id');
      const testId = this.getAttribute('data-testid');

      if (testId === 'segment-layout-block-1') {
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

      if (testId === 'segment-layout-table-0') {
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

    render(<DocumentOutline payload={buildFixture()} />);

    expect(screen.getByTestId('mapping-card-position-block-1-0-body')).toHaveStyle({
      top: '80px',
    });
    expect(screen.getByTestId('mapping-card-position-table-0-0-image')).toHaveStyle({
      top: '160px',
    });
  });
});
