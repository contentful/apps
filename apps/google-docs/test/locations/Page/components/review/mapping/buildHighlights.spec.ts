import { describe, expect, it } from 'vitest';
import type { EntryBlockGraph, SourceRef, WorkflowContentType } from '@types';
import {
  buildMappingHighlightIndex,
  getMappingCardKey,
  uniqueHighlights,
  type MappingHighlight,
} from '../../../../../../src/locations/Page/components/review/mapping/buildHighlights';

const blockTextRef = (start: number, end: number, text: string): SourceRef => ({
  type: 'blockText',
  blockId: 'block-4',
  start,
  end,
  flattenedRuns: [{ text, start, end, styles: {} }],
});

const tableTextRef = (
  tableId: string,
  rowId: string,
  cellId: string,
  partId: string,
  start: number,
  end: number,
  text: string
): SourceRef => ({
  type: 'tableText',
  tableId,
  rowId,
  cellId,
  partId,
  start,
  end,
  flattenedRuns: [{ text, start, end, styles: {} }],
});

describe('buildHighlights', () => {
  const contentTypes: WorkflowContentType[] = [
    {
      sys: { id: 'blogPost' },
      name: 'Blog Post',
      fields: [
        {
          id: 'heading',
          name: 'Heading',
          type: 'Symbol',
        },
      ],
    },
  ];

  it('uniqueHighlights keeps two disjoint sourceRefs for the same field', () => {
    const h1: MappingHighlight = {
      entryIndex: 0,
      fieldId: 'heading',
      fieldName: 'heading',
      fieldType: 'Symbol',
      sourceRef: blockTextRef(0, 10, 'Show up fr'),
    };
    const h2: MappingHighlight = {
      entryIndex: 0,
      fieldId: 'heading',
      fieldName: 'heading',
      fieldType: 'Symbol',
      sourceRef: blockTextRef(33, 58, 'terest…'),
    };

    const out = uniqueHighlights([h1, h2]);
    expect(out).toHaveLength(2);
  });

  it('getMappingCardKey differs per sourceRef so locations and segments stay aligned after splits', () => {
    const h1: MappingHighlight = {
      entryIndex: 0,
      fieldId: 'heading',
      fieldName: 'heading',
      fieldType: 'Symbol',
      sourceRef: blockTextRef(0, 10, 'a'),
    };
    const h2: MappingHighlight = {
      entryIndex: 0,
      fieldId: 'heading',
      fieldName: 'heading',
      fieldType: 'Symbol',
      sourceRef: blockTextRef(33, 58, 'b'),
    };

    const seg = 'block:block-4';
    expect(getMappingCardKey(seg, h1)).toContain('block-4:0:10');
    expect(getMappingCardKey(seg, h2)).toContain('block-4:33:58');
    expect(getMappingCardKey(seg, h1)).not.toBe(getMappingCardKey(seg, h2));
  });

  it('uniqueHighlights keeps two fields that share the same block range (different fieldId)', () => {
    const shared = blockTextRef(0, 58, 'same');
    const hPage: MappingHighlight = {
      entryIndex: 0,
      fieldId: 'pageName',
      fieldName: 'pageName',
      fieldType: 'Symbol',
      sourceRef: shared,
    };
    const hBlog: MappingHighlight = {
      entryIndex: 1,
      fieldId: 'internalLabel',
      fieldName: 'internalLabel',
      fieldType: 'Symbol',
      sourceRef: shared,
    };

    expect(uniqueHighlights([hPage, hBlog])).toHaveLength(2);
  });

  it('buildMappingHighlightIndex lists both split refs on the same block', () => {
    const graph: EntryBlockGraph = {
      entries: [
        {
          contentTypeId: 'blogPost',
          fieldMappings: [
            {
              fieldId: 'heading',
              fieldType: 'Symbol',
              sourceRefs: [blockTextRef(0, 10, 'a'), blockTextRef(33, 58, 'b')],
              confidence: 1,
            },
          ],
        },
      ],
      excludedSourceRefs: [],
    };

    const idx = buildMappingHighlightIndex(graph, contentTypes);
    const list = uniqueHighlights(idx.blockHighlights['block-4'] ?? []);
    expect(list).toHaveLength(2);
    expect(list[0]?.fieldName).toBe('Heading');
    expect(list[1]?.fieldName).toBe('Heading');
  });

  describe('table sourceRef path', () => {
    const tableContentTypes: WorkflowContentType[] = [
      {
        sys: { id: 'tableArticle' },
        name: 'Table Article',
        fields: [
          {
            id: 'tableField',
            name: 'Table Field',
            type: 'Symbol',
          },
        ],
      },
    ];

    it('buildMappingHighlightIndex populates tablePartHighlights for a TableTextSourceRef', () => {
      const sourceRef = tableTextRef('table-1', 'row-1', 'cell-1', 'part-1', 0, 20, 'cell text');
      const graph: EntryBlockGraph = {
        entries: [
          {
            contentTypeId: 'tableArticle',
            fieldMappings: [
              {
                fieldId: 'tableField',
                fieldType: 'Symbol',
                sourceRefs: [sourceRef],
                confidence: 1,
              },
            ],
          },
        ],
        excludedSourceRefs: [],
      };

      const idx = buildMappingHighlightIndex(graph, tableContentTypes);
      const tablePartKey = 'table-1:row-1:cell-1:part-1';
      const highlights = idx.tablePartHighlights[tablePartKey] ?? [];

      expect(highlights).toHaveLength(1);
      expect(highlights[0]?.fieldName).toBe('Table Field');
      expect(highlights[0]?.fieldId).toBe('tableField');
      expect(highlights[0]?.entryIndex).toBe(0);
    });

    it('buildMappingHighlightIndex populates tableHighlights keyed by tableId for a TableTextSourceRef', () => {
      const sourceRef = tableTextRef('table-1', 'row-1', 'cell-1', 'part-1', 0, 20, 'cell text');
      const graph: EntryBlockGraph = {
        entries: [
          {
            contentTypeId: 'tableArticle',
            fieldMappings: [
              {
                fieldId: 'tableField',
                fieldType: 'Symbol',
                sourceRefs: [sourceRef],
                confidence: 1,
              },
            ],
          },
        ],
        excludedSourceRefs: [],
      };

      const idx = buildMappingHighlightIndex(graph, tableContentTypes);
      const highlights = idx.tableHighlights['table-1'] ?? [];

      expect(highlights).toHaveLength(1);
      expect(highlights[0]?.fieldName).toBe('Table Field');
    });

    it('buildMappingHighlightIndex populates both tablePartHighlights and tableHighlights when table and block refs coexist', () => {
      const tableRef = tableTextRef('table-2', 'row-2', 'cell-2', 'part-2', 0, 15, 'table cell');
      const blockRef = blockTextRef(0, 10, 'block text');
      const graph: EntryBlockGraph = {
        entries: [
          {
            contentTypeId: 'blogPost',
            fieldMappings: [
              {
                fieldId: 'heading',
                fieldType: 'Symbol',
                sourceRefs: [blockRef],
                confidence: 1,
              },
            ],
          },
          {
            contentTypeId: 'tableArticle',
            fieldMappings: [
              {
                fieldId: 'tableField',
                fieldType: 'Symbol',
                sourceRefs: [tableRef],
                confidence: 1,
              },
            ],
          },
        ],
        excludedSourceRefs: [],
      };

      const idx = buildMappingHighlightIndex(graph, [...contentTypes, ...tableContentTypes]);

      // Block index is populated
      const blockHighlights = idx.blockHighlights['block-4'] ?? [];
      expect(blockHighlights).toHaveLength(1);
      expect(blockHighlights[0]?.fieldName).toBe('Heading');

      // Table part index is populated
      const tablePartKey = 'table-2:row-2:cell-2:part-2';
      const tablePartHighlights = idx.tablePartHighlights[tablePartKey] ?? [];
      expect(tablePartHighlights).toHaveLength(1);
      expect(tablePartHighlights[0]?.fieldName).toBe('Table Field');

      // Table index is populated
      const tableHighlights = idx.tableHighlights['table-2'] ?? [];
      expect(tableHighlights).toHaveLength(1);
      expect(tableHighlights[0]?.fieldName).toBe('Table Field');
    });

    it('buildMappingHighlightIndex aggregates multiple cells from the same table into tableHighlights', () => {
      const cellRef1 = tableTextRef('table-3', 'row-1', 'cell-1', 'part-1', 0, 10, 'cell A');
      const cellRef2 = tableTextRef('table-3', 'row-1', 'cell-2', 'part-1', 0, 10, 'cell B');
      const graph: EntryBlockGraph = {
        entries: [
          {
            contentTypeId: 'tableArticle',
            fieldMappings: [
              {
                fieldId: 'tableField',
                fieldType: 'Symbol',
                sourceRefs: [cellRef1, cellRef2],
                confidence: 1,
              },
            ],
          },
        ],
        excludedSourceRefs: [],
      };

      const idx = buildMappingHighlightIndex(graph, tableContentTypes);

      // Each cell has its own tablePartHighlights entry
      expect(idx.tablePartHighlights['table-3:row-1:cell-1:part-1']).toHaveLength(1);
      expect(idx.tablePartHighlights['table-3:row-1:cell-2:part-1']).toHaveLength(1);

      // Both cells are aggregated under the same tableId in tableHighlights
      const tableHighlights = idx.tableHighlights['table-3'] ?? [];
      expect(tableHighlights).toHaveLength(2);
    });
  });
});
