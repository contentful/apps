import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MappingReviewSuspendPayload, SourceRef } from '@types';
import { MappingView } from '../../../../../../src/locations/Page/components/review/mapping/MappingView';

const mockUseReviewTextSelection = vi.fn();
const mockClearSelection = vi.fn();

vi.mock('@hooks/useReviewTextSelection', () => ({
  useReviewTextSelection: () => mockUseReviewTextSelection(),
}));

vi.mock(
  '../../../../../../src/locations/Page/components/review/mapping/ReviewImageAssetCard',
  () => ({
    ReviewImageAssetCard: ({
      onEdit,
      isHighlighted,
    }: {
      onEdit: () => void;
      isHighlighted: boolean;
    }) => (
      <div>
        <button type="button" onClick={onEdit}>
          {isHighlighted ? 'Reassign image' : 'Assign image'}
        </button>
      </div>
    ),
  })
);

type BlockDefinition = {
  id: string;
  position: number;
  text: string;
  type?: 'paragraph' | 'heading' | 'listItem';
};

type FieldMappingDefinition = {
  fieldId: string;
  fieldType: string;
  sourceRefs: SourceRef[];
  confidence?: number;
};

const mappingViewGraphProps = (payload: MappingReviewSuspendPayload) => ({
  entryBlockGraph: payload.entryBlockGraph,
  onEntryBlockGraphChange: vi.fn(),
});

const createDomRange = (textNode: Text, start: number, end: number) => {
  const range = document.createRange();
  range.setStart(textNode, start);
  range.setEnd(textNode, end);
  return range;
};

const createDetachedRange = (text: string, start: number, end: number) => {
  const textNode = document.createTextNode(text);
  return createDomRange(textNode, start, end);
};

const createCrossBlockRange = (
  startNode: Text,
  startOffset: number,
  endNode: Text,
  endOffset: number
) => {
  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  return range;
};

const createBlock = (
  id: string,
  position: number,
  text: string,
  type: BlockDefinition['type'] = 'paragraph'
): BlockDefinition => ({
  id,
  position,
  text,
  type,
});

const createBlockTextSourceRef = (
  blockId: string,
  text: string,
  start = 0,
  end = text.length
): SourceRef => ({
  type: 'blockText',
  blockId,
  start,
  end,
  flattenedRuns: [{ text: text.slice(start, end), start, end }],
});

const createPayload = ({
  blocks = [createBlock('block-1', 1, 'Hello world')],
  tables = [],
  fieldMappings,
  excludedSourceRefs = [],
}: {
  blocks?: BlockDefinition[];
  tables?: MappingReviewSuspendPayload['normalizedDocument']['tables'];
  fieldMappings?: FieldMappingDefinition[];
  excludedSourceRefs?: SourceRef[];
} = {}): MappingReviewSuspendPayload => {
  const defaultFieldMappings = fieldMappings ?? [
    {
      fieldId: 'body',
      fieldType: 'Text',
      sourceRefs: [createBlockTextSourceRef(blocks[0].id, blocks[0].text)],
      confidence: 0.9,
    },
  ];

  return {
    suspendStepId: 'mapping-review',
    reason: 'Mapping review required before CMA payload generation continues',
    documentId: 'doc-1',
    documentTitle: 'Mapping review',
    normalizedDocument: {
      documentId: 'doc-1',
      title: 'Mapping review',
      designValues: [],
      contentBlocks: blocks.map((block) => ({
        id: block.id,
        position: block.position,
        type: block.type ?? 'paragraph',
        textRuns: [{ text: block.text }],
        flattenedTextRuns: [{ text: block.text, start: 0, end: block.text.length }],
        designValueIds: [],
        imageIds: [],
      })),
      images: [],
      tables,
      assets: [],
    },
    entryBlockGraph: {
      entries: [
        {
          contentTypeId: 'article',
          fields: { title: { 'en-US': 'Draft title from display field' } },
          fieldMappings: defaultFieldMappings.map((fieldMapping) => ({
            fieldId: fieldMapping.fieldId,
            fieldType: fieldMapping.fieldType,
            sourceRefs: fieldMapping.sourceRefs,
            confidence: fieldMapping.confidence ?? 0.9,
          })),
        },
      ],
      excludedSourceRefs,
    },
    referenceGraph: {
      edges: [],
      creationOrder: [],
      deferredFields: [],
      hasCircularDependency: false,
    },
    contentTypes: [
      {
        sys: { id: 'article' },
        name: 'Article',
        displayField: 'title',
        fields: [
          {
            id: 'title',
            name: 'Title',
            type: 'Symbol',
          },
          {
            id: 'body',
            name: 'Body copy',
            type: 'Text',
          },
          {
            id: 'summary',
            name: 'Summary',
            type: 'Text',
          },
        ],
      },
    ],
  };
};

const createImagePayload = (): MappingReviewSuspendPayload => ({
  suspendStepId: 'mapping-review',
  reason: 'Mapping review required before CMA payload generation continues',
  documentId: 'doc-image',
  documentTitle: 'Image mapping review',
  normalizedDocument: {
    documentId: 'doc-image',
    title: 'Image mapping review',
    designValues: [],
    contentBlocks: [
      {
        id: 'image-block-1',
        position: 1,
        type: 'paragraph',
        textRuns: [{ text: 'Image paragraph' }],
        flattenedTextRuns: [{ text: 'Image paragraph', start: 0, end: 15 }],
        designValueIds: [],
        imageIds: ['img-1'],
      },
    ],
    images: [{ id: 'img-1', url: 'https://example.com/image.png', title: 'Image one' }],
    tables: [],
    assets: [],
  },
  entryBlockGraph: {
    entries: [
      {
        contentTypeId: 'article',
        tempId: 'article-0',
        fields: { title: { 'en-US': 'First entry' } },
        fieldMappings: [
          {
            fieldId: 'body',
            fieldType: 'Text',
            sourceRefs: [{ type: 'image', blockId: 'image-block-1', imageId: 'img-1' }],
            confidence: 0.9,
          },
        ],
      },
      {
        contentTypeId: 'article',
        tempId: 'article-1',
        fields: { title: { 'en-US': 'Second entry' } },
        fieldMappings: [
          {
            fieldId: 'body',
            fieldType: 'Text',
            sourceRefs: [],
            confidence: 0.9,
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
      sys: { id: 'article' },
      name: 'Article',
      displayField: 'title',
      fields: [
        {
          id: 'body',
          name: 'Body copy',
          type: 'Text',
        },
      ],
    },
  ],
});

describe('MappingView', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.stubGlobal('CSS', {
      escape: (value: string) => value.replaceAll(':', '\\:'),
    });
    mockUseReviewTextSelection.mockReturnValue({
      selectionRectangle: null,
      selectedText: '',
      selectedRange: null,
      clearSelection: mockClearSelection,
    });
  });

  afterEach(() => {
    cleanup();
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('groups adjacent blocks mapped to the same field into one card and one grouped surface', () => {
    const blocks = [
      createBlock('block-1', 1, 'First body paragraph.'),
      createBlock('block-2', 2, 'Second body paragraph.'),
    ];
    const payload = createPayload({
      blocks,
      fieldMappings: [
        {
          fieldId: 'body',
          fieldType: 'Text',
          sourceRefs: blocks.map((block) => createBlockTextSourceRef(block.id, block.text)),
        },
      ],
    });

    const { container } = render(
      <MappingView
        payload={payload}
        {...mappingViewGraphProps(payload)}
        selectedEntryIndex={0}
        mode="edit"
      />
    );

    expect(container.querySelectorAll('[data-testid^="mapping-card-"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-testid^="mapping-group-surface-"]')).toHaveLength(1);
    expect(screen.getByText('Body copy')).toBeTruthy();
    expect(
      container.querySelector('[data-testid^="mapping-group-surface-"]')?.textContent
    ).toContain('First body paragraph.');
    expect(
      container.querySelector('[data-testid^="mapping-group-surface-"]')?.textContent
    ).toContain('Second body paragraph.');
  });

  it('does not wrap a partially mapped single block in a grouped surface', () => {
    const block = createBlock('block-1', 1, 'Partially mapped paragraph.');
    const payload = createPayload({
      blocks: [block],
      fieldMappings: [
        {
          fieldId: 'body',
          fieldType: 'Text',
          sourceRefs: [createBlockTextSourceRef(block.id, block.text, 10, 22)],
        },
      ],
    });

    const { container } = render(
      <MappingView
        payload={payload}
        {...mappingViewGraphProps(payload)}
        selectedEntryIndex={0}
        mode="edit"
      />
    );

    expect(container.querySelectorAll('[data-testid^="mapping-card-"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-testid^="mapping-group-surface-"]')).toHaveLength(0);
  });

  it('labels non-consecutive runs for the same field with positional suffixes', () => {
    const blocks = [
      createBlock('block-1', 1, 'First body paragraph.'),
      createBlock('block-2', 2, 'Mapped title text'),
      createBlock('block-3', 3, 'Second body paragraph.'),
    ];
    const payload = createPayload({
      blocks,
      fieldMappings: [
        {
          fieldId: 'body',
          fieldType: 'Text',
          sourceRefs: [
            createBlockTextSourceRef(blocks[0].id, blocks[0].text),
            createBlockTextSourceRef(blocks[2].id, blocks[2].text),
          ],
        },
        {
          fieldId: 'title',
          fieldType: 'Symbol',
          sourceRefs: [createBlockTextSourceRef(blocks[1].id, blocks[1].text)],
        },
      ],
    });

    render(
      <MappingView
        payload={payload}
        {...mappingViewGraphProps(payload)}
        selectedEntryIndex={0}
        mode="edit"
      />
    );

    expect(screen.getByText('Body copy (1/2)')).toBeTruthy();
    expect(screen.getByText('Body copy (2/2)')).toBeTruthy();
    expect(screen.getByText('Title')).toBeTruthy();
  });

  it('shows the content type field name on mapping cards when it differs from the field id', () => {
    const block = createBlock('block-1', 1, 'SEO description goes here.');
    const payload = createPayload({
      blocks: [block],
      fieldMappings: [
        {
          fieldId: 'seoDescription',
          fieldType: 'Text',
          sourceRefs: [createBlockTextSourceRef(block.id, block.text)],
        },
      ],
    });

    payload.contentTypes[0].fields = [
      {
        id: 'title',
        name: 'Title',
        type: 'Symbol',
      },
      {
        id: 'seoDescription',
        name: 'SEO Description',
        type: 'Text',
      },
    ];

    render(
      <MappingView
        payload={payload}
        {...mappingViewGraphProps(payload)}
        selectedEntryIndex={0}
        mode="edit"
      />
    );

    expect(screen.getByText('SEO Description')).toBeTruthy();
    expect(screen.queryByText('Seo Description')).toBeNull();
  });

  it('does not merge mixed-mapping blocks with same-field neighbors', () => {
    const blocks = [
      createBlock('block-1', 1, 'Intro paragraph.'),
      createBlock('block-2', 2, 'Mixed paragraph.'),
      createBlock('block-3', 3, 'Closing paragraph.'),
    ];
    const payload = createPayload({
      blocks,
      fieldMappings: [
        {
          fieldId: 'body',
          fieldType: 'Text',
          sourceRefs: blocks.map((block) => createBlockTextSourceRef(block.id, block.text)),
        },
        {
          fieldId: 'summary',
          fieldType: 'Text',
          sourceRefs: [createBlockTextSourceRef(blocks[1].id, blocks[1].text)],
        },
      ],
    });

    const { container } = render(
      <MappingView
        payload={payload}
        {...mappingViewGraphProps(payload)}
        selectedEntryIndex={0}
        mode="edit"
      />
    );

    expect(screen.getByText('Body copy (1/3)')).toBeTruthy();
    expect(screen.getByText('Body copy (2/3)')).toBeTruthy();
    expect(screen.getByText('Body copy (3/3)')).toBeTruthy();
    expect(screen.getByText('Summary')).toBeTruthy();
    expect(container.querySelectorAll('[data-testid^="mapping-card-"]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-testid^="mapping-group-surface-"]')).toHaveLength(2);
  });

  it('groups table rows mapped to the same field into one card', () => {
    const firstRowText = 'slug-one';
    const secondRowText = 'slug-two';
    const payload = createPayload({
      blocks: [],
      tables: [
        {
          id: 'table-1',
          position: 1,
          headers: ['Field', 'Value'],
          rows: [
            {
              id: 'row-1',
              cells: [
                {
                  id: 'cell-1',
                  parts: [
                    {
                      id: 'part-1',
                      type: 'text',
                      textRuns: [{ text: 'Slug A' }],
                      flattenedTextRuns: [{ text: 'Slug A', start: 0, end: 6 }],
                    },
                  ],
                },
                {
                  id: 'cell-2',
                  parts: [
                    {
                      id: 'part-2',
                      type: 'text',
                      textRuns: [{ text: firstRowText }],
                      flattenedTextRuns: [
                        { text: firstRowText, start: 0, end: firstRowText.length },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              id: 'row-2',
              cells: [
                {
                  id: 'cell-3',
                  parts: [
                    {
                      id: 'part-3',
                      type: 'text',
                      textRuns: [{ text: 'Slug B' }],
                      flattenedTextRuns: [{ text: 'Slug B', start: 0, end: 6 }],
                    },
                  ],
                },
                {
                  id: 'cell-4',
                  parts: [
                    {
                      id: 'part-4',
                      type: 'text',
                      textRuns: [{ text: secondRowText }],
                      flattenedTextRuns: [
                        { text: secondRowText, start: 0, end: secondRowText.length },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          designValueIds: [],
          imageIds: [],
        },
      ],
      fieldMappings: [
        {
          fieldId: 'body',
          fieldType: 'Text',
          sourceRefs: [
            {
              type: 'tableText',
              tableId: 'table-1',
              rowId: 'row-1',
              cellId: 'cell-2',
              partId: 'part-2',
              start: 0,
              end: firstRowText.length,
              flattenedRuns: [{ text: firstRowText, start: 0, end: firstRowText.length }],
            },
            {
              type: 'tableText',
              tableId: 'table-1',
              rowId: 'row-2',
              cellId: 'cell-4',
              partId: 'part-4',
              start: 0,
              end: secondRowText.length,
              flattenedRuns: [{ text: secondRowText, start: 0, end: secondRowText.length }],
            },
          ],
        },
      ],
    });

    const { container } = render(
      <MappingView
        payload={payload}
        {...mappingViewGraphProps(payload)}
        selectedEntryIndex={0}
        mode="edit"
      />
    );

    expect(screen.getAllByText('Body copy').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-testid^="mapping-card-"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-testid^="mapping-group-surface-"]')).toHaveLength(0);
  });

  it('keeps table mappings scoped to the mapped row instead of wrapping the whole table', () => {
    const mappedText = 'Update to - drupal-migration-contentful-static-site';
    const unmappedText = 'drupal migration (300)';
    const payload = createPayload({
      blocks: [],
      tables: [
        {
          id: 'table-1',
          position: 1,
          headers: ['Field', 'Value'],
          rows: [
            {
              id: 'row-1',
              cells: [
                {
                  id: 'cell-1',
                  parts: [
                    {
                      id: 'part-1',
                      type: 'text',
                      textRuns: [{ text: 'KW' }],
                      flattenedTextRuns: [{ text: 'KW', start: 0, end: 2 }],
                    },
                  ],
                },
                {
                  id: 'cell-2',
                  parts: [
                    {
                      id: 'part-2',
                      type: 'text',
                      textRuns: [{ text: unmappedText }],
                      flattenedTextRuns: [
                        { text: unmappedText, start: 0, end: unmappedText.length },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              id: 'row-2',
              cells: [
                {
                  id: 'cell-3',
                  parts: [
                    {
                      id: 'part-3',
                      type: 'text',
                      textRuns: [{ text: 'Slug' }],
                      flattenedTextRuns: [{ text: 'Slug', start: 0, end: 4 }],
                    },
                  ],
                },
                {
                  id: 'cell-4',
                  parts: [
                    {
                      id: 'part-4',
                      type: 'text',
                      textRuns: [{ text: mappedText }],
                      flattenedTextRuns: [{ text: mappedText, start: 0, end: mappedText.length }],
                    },
                  ],
                },
              ],
            },
          ],
          designValueIds: [],
          imageIds: [],
        },
      ],
      fieldMappings: [
        {
          fieldId: 'body',
          fieldType: 'Text',
          sourceRefs: [
            {
              type: 'tableText',
              tableId: 'table-1',
              rowId: 'row-2',
              cellId: 'cell-4',
              partId: 'part-4',
              start: 0,
              end: mappedText.length,
              flattenedRuns: [{ text: mappedText, start: 0, end: mappedText.length }],
            },
          ],
        },
      ],
    });

    const { container } = render(
      <MappingView
        payload={payload}
        {...mappingViewGraphProps(payload)}
        selectedEntryIndex={0}
        mode="edit"
      />
    );

    expect(container.querySelectorAll('[data-testid^="mapping-group-surface-"]')).toHaveLength(0);
    expect(
      container.querySelector(
        '[data-review-text-segment="true"][data-row-id="row-2"][data-is-mapped="true"]'
      )
    ).toBeTruthy();
    expect(
      container.querySelector(
        '[data-review-text-segment="true"][data-row-id="row-1"][data-is-mapped="true"]'
      )
    ).toBeNull();
  });

  it('highlights all underlying grouped text when hovering a grouped rail card', () => {
    const blocks = [
      createBlock('block-1', 1, 'First body paragraph.'),
      createBlock('block-2', 2, 'Second body paragraph.'),
    ];
    const payload = createPayload({
      blocks,
      fieldMappings: [
        {
          fieldId: 'body',
          fieldType: 'Text',
          sourceRefs: blocks.map((block) => createBlockTextSourceRef(block.id, block.text)),
        },
      ],
    });

    const { container } = render(
      <MappingView
        payload={payload}
        {...mappingViewGraphProps(payload)}
        selectedEntryIndex={0}
        mode="edit"
      />
    );

    const textSegments = Array.from(
      container.querySelectorAll<HTMLElement>('[data-review-text-segment="true"]')
    );
    expect(textSegments).toHaveLength(2);
    const initialBackgroundColor = textSegments[0].style.backgroundColor;
    expect(textSegments[1].style.backgroundColor).toBe(initialBackgroundColor);

    const mappingCard = container.querySelector<HTMLElement>('[data-testid^="mapping-card-"]');
    expect(mappingCard).toBeTruthy();

    fireEvent.mouseEnter(mappingCard as HTMLElement);

    expect(textSegments[0].style.backgroundColor).not.toBe(initialBackgroundColor);
    expect(textSegments[1].style.backgroundColor).toBe(textSegments[0].style.backgroundColor);
    expect(
      container
        .querySelector('[data-testid^="mapping-group-surface-"]')
        ?.getAttribute('data-hovered')
    ).toBe('true');
  });

  it('opens assign modal from grouped-run text selection and clears selection', () => {
    const blocks = [
      createBlock('block-1', 1, 'First body paragraph.'),
      createBlock('block-2', 2, 'Second body paragraph.'),
    ];
    const payload = createPayload({
      blocks,
      fieldMappings: [
        {
          fieldId: 'body',
          fieldType: 'Text',
          sourceRefs: blocks.map((block) => createBlockTextSourceRef(block.id, block.text)),
        },
      ],
    });

    mockUseReviewTextSelection.mockReturnValueOnce({
      selectionRectangle: null,
      selectedText: '',
      selectedRange: null,
      clearSelection: mockClearSelection,
    });

    const { container, rerender } = render(
      <MappingView
        payload={payload}
        {...mappingViewGraphProps(payload)}
        selectedEntryIndex={0}
        mode="edit"
      />
    );
    const groupedTextSegments = container.querySelectorAll('[data-review-text-segment="true"]');
    const selectedRange = createDomRange(groupedTextSegments[1].firstChild as Text, 0, 6);

    mockUseReviewTextSelection.mockReturnValue({
      selectionRectangle: { top: 100, left: 100, right: 160, bottom: 120 },
      selectedText: 'Second',
      selectedRange,
      clearSelection: mockClearSelection,
    });

    rerender(
      <MappingView
        payload={payload}
        {...mappingViewGraphProps(payload)}
        selectedEntryIndex={0}
        mode="edit"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit content mapping' }));

    expect(screen.getByRole('heading', { name: 'Edit content mapping' })).toBeTruthy();
    expect(
      screen.getAllByText((_, node) => node?.textContent?.includes('Second') ?? false).length
    ).toBeGreaterThan(0);
    expect(screen.getByText('Assign to fields')).toBeTruthy();
    expect(mockClearSelection).toHaveBeenCalledTimes(1);
  });

  it('opens assign modal with new locations for unmapped text', () => {
    const selectedRange = createDetachedRange('fresh body text', 0, 5);
    mockUseReviewTextSelection.mockReturnValue({
      selectionRectangle: { top: 100, left: 100, right: 160, bottom: 120 },
      selectedText: 'fresh body text',
      selectedRange,
      clearSelection: mockClearSelection,
    });

    const payload = createPayload();
    render(
      <MappingView
        payload={payload}
        {...mappingViewGraphProps(payload)}
        selectedEntryIndex={0}
        mode="edit"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit content mapping' }));

    expect(screen.getByRole('heading', { name: 'Edit content mapping' })).toBeTruthy();
    expect(screen.getByText('"fresh body text"')).toBeTruthy();
    expect(screen.getByText('Assign to fields')).toBeTruthy();
    expect(screen.getByText('Article: Untitled')).toBeTruthy();
    expect(mockClearSelection).toHaveBeenCalledTimes(1);
  });

  it('shows edit mapping button when text is selected', () => {
    const selectedRange = createDetachedRange('plain text', 0, 5);
    mockUseReviewTextSelection.mockReturnValue({
      selectionRectangle: { top: 100, left: 100, right: 160, bottom: 120 },
      selectedText: 'plain text',
      selectedRange,
      clearSelection: mockClearSelection,
    });

    const payload = createPayload();
    render(
      <MappingView
        payload={payload}
        {...mappingViewGraphProps(payload)}
        selectedEntryIndex={0}
        mode="edit"
      />
    );

    expect(screen.getByRole('button', { name: 'Edit content mapping' })).toBeTruthy();
  });

  it('opens edit modal with current field pre-selected for mapped text', () => {
    mockUseReviewTextSelection.mockReturnValueOnce({
      selectionRectangle: null,
      selectedText: '',
      selectedRange: null,
      clearSelection: mockClearSelection,
    });

    const payload = createPayload();
    const { container, rerender } = render(
      <MappingView
        payload={payload}
        {...mappingViewGraphProps(payload)}
        selectedEntryIndex={0}
        mode="edit"
      />
    );
    const selectedRange = createDomRange(
      container.querySelector('[data-review-text-segment="true"]')?.firstChild as Text,
      0,
      5
    );
    mockUseReviewTextSelection.mockReturnValue({
      selectionRectangle: { top: 100, left: 100, right: 160, bottom: 120 },
      selectedText: 'selected body text',
      selectedRange,
      clearSelection: mockClearSelection,
    });
    rerender(
      <MappingView
        payload={payload}
        {...mappingViewGraphProps(payload)}
        selectedEntryIndex={0}
        mode="edit"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit content mapping' }));

    expect(screen.getByRole('heading', { name: 'Edit content mapping' })).toBeTruthy();
    expect(screen.getByText('Assign to fields')).toBeTruthy();
    expect(screen.getAllByText('Body copy').length).toBeGreaterThan(0);
    expect(mockClearSelection).toHaveBeenCalledTimes(1);
  });

  it('opens edit modal with field pre-selected for grouped-run selection', () => {
    const blocks = [
      createBlock('block-1', 1, 'First body paragraph.'),
      createBlock('block-2', 2, 'Second body paragraph.'),
    ];
    const payload = createPayload({
      blocks,
      fieldMappings: [
        {
          fieldId: 'body',
          fieldType: 'Text',
          sourceRefs: blocks.map((block) => createBlockTextSourceRef(block.id, block.text)),
        },
      ],
    });

    let currentGraph = payload.entryBlockGraph;
    const onEntryBlockGraphChange = vi.fn(
      (nextGraph: MappingReviewSuspendPayload['entryBlockGraph']) => {
        currentGraph = nextGraph;
      }
    );

    mockUseReviewTextSelection.mockReturnValueOnce({
      selectionRectangle: null,
      selectedText: '',
      selectedRange: null,
      clearSelection: mockClearSelection,
    });

    const { container, rerender } = render(
      <MappingView
        payload={payload}
        entryBlockGraph={currentGraph}
        onEntryBlockGraphChange={onEntryBlockGraphChange}
        selectedEntryIndex={0}
        mode="edit"
      />
    );

    const groupedTextSegments = container.querySelectorAll('[data-review-text-segment="true"]');
    const selectedRange = createCrossBlockRange(
      groupedTextSegments[0].firstChild as Text,
      6,
      groupedTextSegments[1].firstChild as Text,
      6
    );

    mockUseReviewTextSelection.mockReturnValue({
      selectionRectangle: { top: 100, left: 100, right: 220, bottom: 130 },
      selectedText: selectedRange.toString(),
      selectedRange,
      clearSelection: mockClearSelection,
    });

    rerender(
      <MappingView
        payload={payload}
        entryBlockGraph={currentGraph}
        onEntryBlockGraphChange={onEntryBlockGraphChange}
        selectedEntryIndex={0}
        mode="edit"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit content mapping' }));

    expect(screen.getByRole('heading', { name: 'Edit content mapping' })).toBeTruthy();
    expect(screen.getByText('Assign to fields')).toBeTruthy();
    expect(screen.getAllByText('Body copy').length).toBeGreaterThan(0);
    expect(mockClearSelection).toHaveBeenCalledTimes(1);
  });

  it('scopes image assignment destinations to currently selected entry', () => {
    const payload = createImagePayload();
    const onEntryBlockGraphChange = vi.fn();

    render(
      <MappingView
        payload={payload}
        entryBlockGraph={payload.entryBlockGraph}
        onEntryBlockGraphChange={onEntryBlockGraphChange}
        selectedEntryIndex={1}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Assign image' }));

    expect(screen.getByRole('heading', { name: 'Edit content mapping' })).toBeTruthy();
    expect(screen.getAllByText('Untitled').length).toBeGreaterThan(0);
  });
});
