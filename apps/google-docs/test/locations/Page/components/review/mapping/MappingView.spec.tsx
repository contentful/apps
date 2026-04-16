import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MappingReviewSuspendPayload, SourceRef } from '@types';
import { MappingView } from '../../../../../../src/locations/Page/components/review/mapping/MappingView';

const mockUseReviewTextSelection = vi.fn();
const mockClearSelection = vi.fn();

vi.mock('@hooks/useReviewTextSelection', () => ({
  useReviewTextSelection: () => mockUseReviewTextSelection(),
}));

const blockTextSourceRef: SourceRef = {
  type: 'blockText',
  blockId: 'block-1',
  start: 0,
  end: 11,
  flattenedRuns: [{ text: 'Hello world', start: 0, end: 11 }],
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
  contentTypes: [],
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
    const selectedRange = {
      intersectsNode: (node: Node) =>
        node instanceof HTMLElement && node.dataset.isMapped === 'true',
    } as unknown as Range;
    mockUseReviewTextSelection.mockReturnValueOnce({
      selectionRectangle: null,
      selectedText: '',
      selectedRange: null,
      clearSelection: mockClearSelection,
    });
    mockUseReviewTextSelection.mockReturnValue({
      selectionRectangle: { top: 100, left: 100, right: 160, bottom: 120 },
      selectedText: '  selected body text  ',
      selectedRange,
      clearSelection: mockClearSelection,
    });

    const { rerender } = render(
      <MappingView payload={createPayload()} selectedEntryIndex={null} />
    );
    rerender(<MappingView payload={createPayload()} selectedEntryIndex={null} />);

    fireEvent.click(screen.getByRole('button', { name: 'Reassign' }));

    expect(screen.getByRole('heading', { name: 'Assign content' })).toBeTruthy();
    expect(screen.getByText('"selected body text"')).toBeTruthy();
    expect(mockClearSelection).toHaveBeenCalledTimes(1);
  });

  it('disables exclude when selected text has no mapped segments', () => {
    const selectedRange = { intersectsNode: () => false } as unknown as Range;
    mockUseReviewTextSelection.mockReturnValue({
      selectionRectangle: { top: 100, left: 100, right: 160, bottom: 120 },
      selectedText: 'plain text',
      selectedRange,
      clearSelection: mockClearSelection,
    });

    render(<MappingView payload={createPayload()} selectedEntryIndex={null} />);

    expect(screen.getByRole('button', { name: 'Assign' })).toBeTruthy();
    const excludeButton = screen.getByRole('button', { name: 'Exclude' }) as HTMLButtonElement;
    expect(excludeButton.disabled).toBe(true);
  });
});
