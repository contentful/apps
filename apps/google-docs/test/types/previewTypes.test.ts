import { describe, expect, it } from 'vitest';
import type { GoogleDocsPreviewData } from '@types';
import type { EntryBlockGraph } from '../../src/types/entryBlockGraph';
import type { NormalizedDocument } from '../../src/types/normalizedDocument';

function buildNormalizedDocument(): NormalizedDocument {
  return {
    documentId: 'doc-1',
    title: 'Preview document',
    contentBlocks: [
      {
        id: 'block-1',
        position: 0,
        type: 'paragraph',
        textRuns: [{ text: 'Overview', styles: {} }],
        flattenedTextRuns: [{ text: 'Overview', start: 0, end: 8, styles: {} }],
        designValueIds: [],
        imageIds: [],
      },
    ],
    tables: [],
  };
}

function buildEntryBlockGraph(): EntryBlockGraph {
  return {
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
                blockId: 'block-1',
                start: 0,
                end: 8,
                flattenedRuns: [{ text: 'Overview', start: 0, end: 8, styles: {} }],
              },
            ],
            confidence: 0.99,
          },
        ],
      },
    ],
    excludedSourceRefs: [],
  };
}

function buildPreviewData(): GoogleDocsPreviewData {
  const normalizedDocument = buildNormalizedDocument();
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
      creationOrder: ['page_1'],
      deferredFields: [],
      hasCircularDependency: false,
    },
    originalNormalizedDocument: normalizedDocument,
    editableNormalizedDocument: structuredClone(normalizedDocument),
    entryBlockGraph: buildEntryBlockGraph(),
  };
}

describe('GoogleDocsPreviewData', () => {
  it('supports the latest agents api normalized document and source ref fields', () => {
    const previewData = buildPreviewData();
    const sourceRef = previewData.entryBlockGraph.entries[0].fieldMappings[0].sourceRefs[0];

    expect(previewData.originalNormalizedDocument.contentBlocks[0].flattenedTextRuns).toEqual([
      { text: 'Overview', start: 0, end: 8, styles: {} },
    ]);

    if (sourceRef.kind === 'blockText') {
      expect(sourceRef.flattenedRuns).toEqual([{ text: 'Overview', start: 0, end: 8, styles: {} }]);
    }
  });
});
