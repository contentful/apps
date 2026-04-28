import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { NormalizedDocument, SourceRef } from '@types';
import { RichTextSelectionPreview } from '../../../../../src/locations/Page/components/review/mapping/edit-modals/RichTextSelectionPreview';

const previewDocument: NormalizedDocument = {
  documentId: 'doc-preview',
  title: 'Preview document',
  contentBlocks: [
    {
      id: 'paragraph-1',
      position: 1,
      type: 'paragraph',
      textRuns: [{ text: 'Intro paragraph' }],
      flattenedTextRuns: [{ text: 'Intro paragraph', start: 0, end: 15, styles: {} }],
      designValueIds: [],
      imageIds: [],
    },
  ],
  images: [{ id: 'img-1', url: 'https://example.com/image.png', title: 'Duck diagram' }],
  tables: [],
};

describe('RichTextSelectionPreview', () => {
  it('renders text plus compact image and table placeholders without raw table cell text', () => {
    const sourceRefs: SourceRef[] = [
      {
        type: 'paragraph',
        blockId: 'paragraph-1',
        start: 0,
        end: 15,
        flattenedRuns: [{ text: 'Intro paragraph', start: 0, end: 15, styles: {} }],
      },
      {
        type: 'image',
        blockId: 'image-block-1',
        imageId: 'img-1',
      },
      {
        type: 'tableText',
        tableId: 'table-1',
        rowId: 'row-1',
        cellId: 'cell-1',
        partId: 'part-1',
        start: 0,
        end: 6,
        flattenedRuns: [{ text: 'Cell A', start: 0, end: 6, styles: {} }],
      },
    ];

    render(
      <RichTextSelectionPreview
        document={previewDocument}
        sourceRefs={sourceRefs}
        showTablePlaceholder
      />
    );

    expect(screen.getByText('Intro paragraph')).toBeTruthy();
    expect(screen.getByText('Duck diagram')).toBeTruthy();
    expect(screen.getByText('Table content')).toBeTruthy();
    expect(screen.queryByText('Cell A')).toBeNull();
  });
});
