import { describe, expect, it } from 'vitest';
import type { EditLocationOption, EntryBlockGraph, SourceRef } from '@types';
import {
  applyTextExclusionToEntryBlockGraph,
  collectMappedExclusionPreviewText,
  collectTextExclusionRangesFromSelection,
} from '../../../../../../src/locations/Page/components/review/mapping/entryBlockGraphExclusion';

const blockRef = (start: number, end: number, text: string): SourceRef => ({
  type: 'blockText',
  blockId: 'block-1',
  start,
  end,
  flattenedRuns: [{ text, start, end, styles: {} }],
});

const baseGraph = (): EntryBlockGraph => ({
  entries: [
    {
      contentTypeId: 'article',
      fieldMappings: [
        {
          fieldId: 'body',
          fieldType: 'Text',
          sourceRefs: [blockRef(0, 20, 'abcdefghijklmnopqrst')],
          confidence: 1,
        },
      ],
    },
  ],
  excludedSourceRefs: [],
});

describe('entryBlockGraphExclusion', () => {
  it('applyTextExclusionToEntryBlockGraph splits a block text ref around the excluded range', () => {
    const graph = baseGraph();
    const location: EditLocationOption = {
      entryIndex: 0,
      id: '0-article-body',
      contentTypeId: 'article',
      contentTypeName: 'Article',
      entryName: 'Article #1',
      fieldId: 'body',
      fieldName: 'Body',
      fieldType: 'Text',
      sourceRef: blockRef(0, 20, 'abcdefghijklmnopqrst'),
    };

    const next = applyTextExclusionToEntryBlockGraph(graph, location, [
      { scope: 'block', blockId: 'block-1', start: 8, end: 12 },
    ]);

    const refs = next.entries[0]?.fieldMappings[0]?.sourceRefs ?? [];
    expect(refs).toHaveLength(2);
    expect(refs[0]).toMatchObject({ start: 0, end: 8, type: 'blockText', blockId: 'block-1' });
    expect(refs[1]).toMatchObject({ start: 12, end: 20, type: 'blockText', blockId: 'block-1' });
    expect((refs[0] as { flattenedRuns: { text: string }[] }).flattenedRuns[0]?.text).toBe(
      'abcdefgh'
    );
    expect((refs[1] as { flattenedRuns: { text: string }[] }).flattenedRuns[0]?.text).toBe(
      'mnopqrst'
    );
  });

  it('post-exclusion entryBlockGraph serializes for resumePayload.entryBlockGraph', () => {
    const graph = baseGraph();
    const location: EditLocationOption = {
      entryIndex: 0,
      id: '0-article-body',
      contentTypeId: 'article',
      contentTypeName: 'Article',
      entryName: 'Article #1',
      fieldId: 'body',
      fieldName: 'Body',
      fieldType: 'Text',
      sourceRef: blockRef(0, 20, 'abcdefghijklmnopqrst'),
    };
    const next = applyTextExclusionToEntryBlockGraph(graph, location, [
      { scope: 'block', blockId: 'block-1', start: 8, end: 12 },
    ]);
    expect(() => JSON.stringify({ resumePayload: { entryBlockGraph: next } })).not.toThrow();
    const parsed = JSON.parse(JSON.stringify({ entryBlockGraph: next })) as {
      entryBlockGraph: EntryBlockGraph;
    };
    expect(parsed.entryBlockGraph.entries[0]?.fieldMappings[0]?.sourceRefs).toHaveLength(2);
  });

  it('collectMappedExclusionPreviewText joins only intersecting mapped segment text', () => {
    const root = document.createElement('div');
    const mapped = document.createElement('span');
    mapped.setAttribute('data-review-text-segment', 'true');
    mapped.setAttribute('data-is-mapped', 'true');
    mapped.setAttribute('data-text-scope', 'block');
    mapped.setAttribute('data-range-start', '0');
    mapped.setAttribute('data-range-end', '3');
    mapped.setAttribute('data-block-id', 'b0');
    mapped.appendChild(document.createTextNode('abc'));
    const plain = document.createElement('span');
    plain.setAttribute('data-review-text-segment', 'true');
    plain.setAttribute('data-is-mapped', 'false');
    plain.appendChild(document.createTextNode('IGNORE'));
    root.appendChild(mapped);
    root.appendChild(plain);

    const range = document.createRange();
    range.selectNodeContents(root);

    expect(collectMappedExclusionPreviewText(root, range)).toBe('abc');
  });

  it('collectTextExclusionRangesFromSelection reads mapped segment datasets', () => {
    const root = document.createElement('div');
    const span = document.createElement('span');
    span.setAttribute('data-review-text-segment', 'true');
    span.setAttribute('data-is-mapped', 'true');
    span.setAttribute('data-text-scope', 'block');
    span.setAttribute('data-range-start', '3');
    span.setAttribute('data-range-end', '7');
    span.setAttribute('data-block-id', 'b1');
    span.appendChild(document.createTextNode('abcd'));
    root.appendChild(span);

    const range = document.createRange();
    range.selectNodeContents(span);

    const ranges = collectTextExclusionRangesFromSelection(root, range);
    expect(ranges).toEqual([{ scope: 'block', blockId: 'b1', start: 3, end: 7 }]);
  });

  it('collectTextExclusionRangesFromSelection uses partial highlight within one mapped segment', () => {
    const root = document.createElement('div');
    const span = document.createElement('span');
    span.setAttribute('data-review-text-segment', 'true');
    span.setAttribute('data-is-mapped', 'true');
    span.setAttribute('data-text-scope', 'block');
    span.setAttribute('data-range-start', '0');
    span.setAttribute('data-range-end', '20');
    span.setAttribute('data-block-id', 'block-1');
    const text = '01234567890123456789';
    span.appendChild(document.createTextNode(text));
    root.appendChild(span);

    const tn = span.firstChild as Text;
    const range = document.createRange();
    range.setStart(tn, 5);
    range.setEnd(tn, 8);

    expect(collectTextExclusionRangesFromSelection(root, range)).toEqual([
      { scope: 'block', blockId: 'block-1', start: 5, end: 8 },
    ]);
    expect(collectMappedExclusionPreviewText(root, range)).toBe('567');
  });
});
