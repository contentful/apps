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
});
