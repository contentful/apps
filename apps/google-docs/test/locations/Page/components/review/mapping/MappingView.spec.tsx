import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
      onAssign,
      onExclude,
      isHighlighted,
    }: {
      onAssign: () => void;
      onExclude: () => void;
      isHighlighted: boolean;
    }) => (
      <div>
        <button type="button" onClick={onAssign}>
          {isHighlighted ? 'Reassign image' : 'Assign image'}
        </button>
        <button type="button" onClick={onExclude}>
          Exclude image
        </button>
      </div>
    ),
  })
);

const blockTextSourceRef: SourceRef = {
  type: 'blockText',
  blockId: 'block-1',
  start: 0,
  end: 11,
  flattenedRuns: [{ text: 'Hello world', start: 0, end: 11 }],
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

const createPayload = (excludedSourceRefs: SourceRef[] = []): MappingReviewSuspendPayload => ({
  suspendStepId: 'mapping-review',
  reason: 'Mapping review required before CMA payload generation continues',
  documentId: 'doc-1',
  documentTitle: 'Mapping review',
  normalizedDocument: {
    documentId: 'doc-1',
    title: 'Mapping review',
    designValues: [],
    contentBlocks: [
      {
        id: 'block-1',
        position: 1,
        type: 'paragraph',
        textRuns: [{ text: 'Hello world' }],
        flattenedTextRuns: [{ text: 'Hello world', start: 0, end: 11 }],
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
        contentTypeId: 'article',
        fields: { title: { 'en-US': 'Draft title from display field' } },
        fieldMappings: [
          {
            fieldId: 'body',
            fieldType: 'Text',
            sourceRefs: [blockTextSourceRef],
            confidence: 0.9,
          },
        ],
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
      ],
    },
  ],
});

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
    vi.clearAllMocks();
    vi.stubGlobal('CSS', {
      // Keep this aligned with selector usage in MappingView (`#${CSS.escape(id)}`).
      escape: (value: string) => value.replaceAll(':', '\\:'),
    });
    mockUseReviewTextSelection.mockReturnValue({
      selectionRectangle: null,
      selectedText: '',
      selectedRange: null,
      clearSelection: mockClearSelection,
    });
  });

  it('opens assign modal from text selection menu and clears selection', () => {
    mockUseReviewTextSelection.mockReturnValueOnce({
      selectionRectangle: null,
      selectedText: '',
      selectedRange: null,
      clearSelection: mockClearSelection,
    });

    const payload = createPayload();
    const { container, rerender } = render(
      <MappingView payload={payload} {...mappingViewGraphProps(payload)} selectedEntryIndex={0} />
    );
    const selectedRange = createDomRange(
      container.querySelector('[data-review-text-segment="true"]')?.firstChild as Text,
      0,
      5
    );
    mockUseReviewTextSelection.mockReturnValue({
      selectionRectangle: { top: 100, left: 100, right: 160, bottom: 120 },
      selectedText: '  selected body text  ',
      selectedRange,
      clearSelection: mockClearSelection,
    });
    rerender(
      <MappingView payload={payload} {...mappingViewGraphProps(payload)} selectedEntryIndex={0} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reassign' }));

    expect(screen.getByRole('heading', { name: 'Assign content' })).toBeTruthy();
    expect(screen.getByText('"selected body text"')).toBeTruthy();
    expect(screen.getAllByText('Article').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Untitled').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Body copy').length).toBeGreaterThan(0);
    expect(screen.getByText('New location')).toBeTruthy();
    expect(screen.getByText('Article: Draft title from display field')).toBeTruthy();
    expect(
      screen.getAllByText((_, node) => node?.textContent?.includes('| Long text') ?? false).length
    ).toBeGreaterThan(0);
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
      <MappingView payload={payload} {...mappingViewGraphProps(payload)} selectedEntryIndex={0} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Assign' }));

    expect(screen.getByRole('heading', { name: 'Assign content' })).toBeTruthy();
    expect(screen.getByText('"fresh body text"')).toBeTruthy();
    expect(screen.getByText('Current location')).toBeTruthy();
    expect(screen.getByText('New location')).toBeTruthy();
    expect(screen.getByText('Article: Draft title from display field')).toBeTruthy();
    expect(mockClearSelection).toHaveBeenCalledTimes(1);
  });

  it('disables exclude when selected text has no mapped segments', () => {
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
        selectedEntryIndex={null}
      />
    );

    expect(screen.getByRole('button', { name: 'Assign' })).toBeTruthy();
    const excludeButton = screen.getByRole('button', { name: 'Exclude' }) as HTMLButtonElement;
    expect(excludeButton.disabled).toBe(true);
  });

  it('opens exclude modal with current locations for mapped text', () => {
    mockUseReviewTextSelection.mockReturnValueOnce({
      selectionRectangle: null,
      selectedText: '',
      selectedRange: null,
      clearSelection: mockClearSelection,
    });

    const payload = createPayload();
    const { container, rerender } = render(
      <MappingView payload={payload} {...mappingViewGraphProps(payload)} selectedEntryIndex={0} />
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
      <MappingView payload={payload} {...mappingViewGraphProps(payload)} selectedEntryIndex={0} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Exclude' }));

    expect(screen.getByRole('heading', { name: 'Exclude content' })).toBeTruthy();
    expect(screen.getAllByText('Article').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Body copy').length).toBeGreaterThan(0);
    expect(screen.queryByText('New location')).toBeNull();
    expect(
      screen.getAllByText((_, node) => node?.textContent?.includes('| Long text') ?? false).length
    ).toBeGreaterThan(0);
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

    expect(screen.getByRole('heading', { name: 'Assign content' })).toBeTruthy();
    expect(screen.getByText('Article: Second entry')).toBeTruthy();
    expect(screen.getAllByText(/Article: .* entry/)).not.toHaveLength(0);
  });
});
