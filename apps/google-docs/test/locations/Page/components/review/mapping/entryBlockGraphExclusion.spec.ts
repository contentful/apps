import { describe, expect, it } from 'vitest';
import type { EditLocationOption, EntryBlockGraph, NormalizedDocument, SourceRef } from '@types';
import {
  applyImageReassignToEntryBlockGraph,
  appendImageToTargets,
  applyTextAssignToEntryBlockGraph,
  applyTextExclusionToEntryBlockGraph,
  applyTextReassignToEntryBlockGraph,
  collectMappedExclusionPreviewText,
  collectTextAssignRangesFromSelection,
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

  it('collectTextAssignRangesFromSelection reads unmapped segment datasets', () => {
    const root = document.createElement('div');
    const span = document.createElement('span');
    span.setAttribute('data-review-text-segment', 'true');
    span.setAttribute('data-is-mapped', 'false');
    span.setAttribute('data-text-scope', 'block');
    span.setAttribute('data-range-start', '3');
    span.setAttribute('data-range-end', '7');
    span.setAttribute('data-block-id', 'b1');
    span.appendChild(document.createTextNode('abcd'));
    root.appendChild(span);

    const range = document.createRange();
    range.selectNodeContents(span);

    expect(collectTextAssignRangesFromSelection(root, range)).toEqual([
      { scope: 'block', blockId: 'b1', start: 3, end: 7 },
    ]);
  });

  it('collectTextAssignRangesFromSelection uses partial highlight within one unmapped segment', () => {
    const root = document.createElement('div');
    const span = document.createElement('span');
    span.setAttribute('data-review-text-segment', 'true');
    span.setAttribute('data-is-mapped', 'false');
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

    expect(collectTextAssignRangesFromSelection(root, range)).toEqual([
      { scope: 'block', blockId: 'block-1', start: 5, end: 8 },
    ]);
  });
});

const minimalNormalizedDoc = (text: string, blockId = 'block-1'): NormalizedDocument => ({
  documentId: 'doc-1',
  contentBlocks: [
    {
      id: blockId,
      position: 0,
      type: 'paragraph',
      textRuns: [{ text }],
      flattenedTextRuns: [{ text, start: 0, end: text.length, styles: {} }],
      designValueIds: [],
      imageIds: [],
    },
  ],
  tables: [],
});

describe('applyTextAssignToEntryBlockGraph', () => {
  it('appends refs from unmapped ranges without changing existing field mappings', () => {
    const graph = baseGraph();
    const doc = minimalNormalizedDoc('abcdefghijklmnopqrst');
    const next = applyTextAssignToEntryBlockGraph(
      graph,
      doc,
      [{ scope: 'block', blockId: 'block-1', start: 5, end: 8 }],
      [{ entryIndex: 0, fieldId: 'subtitle', fieldType: 'Text' }]
    );

    const bodyRefs = next.entries[0]!.fieldMappings.find((f) => f.fieldId === 'body')!.sourceRefs;
    expect(bodyRefs).toHaveLength(1);
    expect(bodyRefs[0]).toMatchObject({ start: 0, end: 20, type: 'blockText' });

    const subtitleFm = next.entries[0]!.fieldMappings.find((f) => f.fieldId === 'subtitle');
    expect(subtitleFm?.sourceRefs).toHaveLength(1);
    expect(subtitleFm?.sourceRefs[0]).toMatchObject({ start: 5, end: 8, type: 'paragraph' });
    expect(
      (subtitleFm?.sourceRefs[0] as { flattenedRuns: { text: string }[] }).flattenedRuns[0]?.text
    ).toBe('fgh');
  });

  it('appends the same assign slice to two target fields', () => {
    const graph = baseGraph();
    const doc = minimalNormalizedDoc('0123456789');
    const next = applyTextAssignToEntryBlockGraph(
      graph,
      doc,
      [{ scope: 'block', blockId: 'block-1', start: 3, end: 7 }],
      [
        { entryIndex: 0, fieldId: 'a', fieldType: 'Text' },
        { entryIndex: 0, fieldId: 'b', fieldType: 'Text' },
      ]
    );

    const bodyRefs = next.entries[0]!.fieldMappings.find((f) => f.fieldId === 'body')!.sourceRefs;
    expect(bodyRefs).toHaveLength(1);
    const aRefs = next.entries[0]!.fieldMappings.find((f) => f.fieldId === 'a')!.sourceRefs;
    const bRefs = next.entries[0]!.fieldMappings.find((f) => f.fieldId === 'b')!.sourceRefs;
    expect(aRefs).toHaveLength(1);
    expect(bRefs).toHaveLength(1);
    expect(aRefs[0]).toMatchObject({ start: 3, end: 7 });
    expect(bRefs[0]).toMatchObject({ start: 3, end: 7 });
  });

  it('returns the same graph when ranges or targets are empty', () => {
    const graph = baseGraph();
    const doc = minimalNormalizedDoc('abc');
    expect(
      applyTextAssignToEntryBlockGraph(
        graph,
        doc,
        [],
        [{ entryIndex: 0, fieldId: 'x', fieldType: 'Text' }]
      )
    ).toBe(graph);
    expect(
      applyTextAssignToEntryBlockGraph(
        graph,
        doc,
        [{ scope: 'block', blockId: 'block-1', start: 0, end: 1 }],
        []
      )
    ).toBe(graph);
  });
});

describe('applyTextReassignToEntryBlockGraph', () => {
  it('moves a short middle slice from body to subtitle and splits the source ref', () => {
    const graph: EntryBlockGraph = {
      entries: [
        {
          contentTypeId: 'article',
          fieldMappings: [
            {
              fieldId: 'body',
              fieldType: 'Text',
              sourceRefs: [blockRef(0, 11, 'Hello world')],
              confidence: 1,
            },
          ],
        },
      ],
      excludedSourceRefs: [],
    };
    const from: EditLocationOption = {
      entryIndex: 0,
      id: '0-article-body',
      contentTypeId: 'article',
      contentTypeName: 'Article',
      entryName: 'A',
      fieldId: 'body',
      fieldName: 'Body',
      fieldType: 'Text',
      sourceRef: blockRef(0, 11, 'Hello world'),
    };

    const next = applyTextReassignToEntryBlockGraph(
      graph,
      from,
      [{ scope: 'block', blockId: 'block-1', start: 6, end: 11 }],
      [{ entryIndex: 0, fieldId: 'subtitle', fieldType: 'Text' }]
    );

    const bodyRefs = next.entries[0]!.fieldMappings.find((f) => f.fieldId === 'body')!.sourceRefs;
    const subtitleFm = next.entries[0]!.fieldMappings.find((f) => f.fieldId === 'subtitle');
    expect(bodyRefs).toHaveLength(1);
    expect(bodyRefs[0]).toMatchObject({ start: 0, end: 6, type: 'blockText' });
    expect(subtitleFm?.sourceRefs).toHaveLength(1);
    expect(subtitleFm?.sourceRefs[0]).toMatchObject({ start: 6, end: 11, type: 'blockText' });
    expect(
      (subtitleFm?.sourceRefs[0] as { flattenedRuns: { text: string }[] }).flattenedRuns[0]?.text
    ).toBe('world');
  });

  it('moves a slice from long body text to another field', () => {
    const longBody = 'a'.repeat(100);
    const graph: EntryBlockGraph = {
      entries: [
        {
          contentTypeId: 'article',
          fieldMappings: [
            {
              fieldId: 'body',
              fieldType: 'Text',
              sourceRefs: [blockRef(0, 100, longBody)],
              confidence: 1,
            },
          ],
        },
      ],
      excludedSourceRefs: [],
    };
    const from: EditLocationOption = {
      entryIndex: 0,
      id: '0-article-body',
      contentTypeId: 'article',
      contentTypeName: 'Article',
      entryName: 'A',
      fieldId: 'body',
      fieldName: 'Body',
      fieldType: 'Text',
      sourceRef: blockRef(0, 100, longBody),
    };

    const next = applyTextReassignToEntryBlockGraph(
      graph,
      from,
      [{ scope: 'block', blockId: 'block-1', start: 40, end: 60 }],
      [{ entryIndex: 0, fieldId: 'subtitle', fieldType: 'Text' }]
    );

    const bodyRefs = next.entries[0]!.fieldMappings.find((f) => f.fieldId === 'body')!.sourceRefs;
    const subRefs = next.entries[0]!.fieldMappings.find(
      (f) => f.fieldId === 'subtitle'
    )!.sourceRefs;
    expect(bodyRefs).toHaveLength(2);
    expect(subRefs).toHaveLength(1);
    expect(subRefs[0]).toMatchObject({ start: 40, end: 60 });
    expect((subRefs[0] as { flattenedRuns: { text: string }[] }).flattenedRuns[0]?.text).toBe(
      'a'.repeat(20)
    );
  });

  it('appends the same moved slice to two target fields', () => {
    const graph: EntryBlockGraph = {
      entries: [
        {
          contentTypeId: 'article',
          fieldMappings: [
            {
              fieldId: 'body',
              fieldType: 'Text',
              sourceRefs: [blockRef(0, 10, '0123456789')],
              confidence: 1,
            },
          ],
        },
      ],
      excludedSourceRefs: [],
    };
    const from: EditLocationOption = {
      entryIndex: 0,
      id: '0-article-body',
      contentTypeId: 'article',
      contentTypeName: 'Article',
      entryName: 'A',
      fieldId: 'body',
      fieldName: 'Body',
      fieldType: 'Text',
      sourceRef: blockRef(0, 10, '0123456789'),
    };

    const next = applyTextReassignToEntryBlockGraph(
      graph,
      from,
      [{ scope: 'block', blockId: 'block-1', start: 3, end: 7 }],
      [
        { entryIndex: 0, fieldId: 'a', fieldType: 'Text' },
        { entryIndex: 0, fieldId: 'b', fieldType: 'Text' },
      ]
    );

    const aRefs = next.entries[0]!.fieldMappings.find((f) => f.fieldId === 'a')!.sourceRefs;
    const bRefs = next.entries[0]!.fieldMappings.find((f) => f.fieldId === 'b')!.sourceRefs;
    expect(aRefs).toHaveLength(1);
    expect(bRefs).toHaveLength(1);
    expect(aRefs[0]).toMatchObject({ start: 3, end: 7 });
    expect(bRefs[0]).toMatchObject({ start: 3, end: 7 });
  });
});

describe('applyImageReassignToEntryBlockGraph', () => {
  const imageRef: SourceRef = {
    type: 'image',
    blockId: 'block-1',
    imageId: 'image-1',
  };

  const imageLocation: EditLocationOption = {
    entryIndex: 0,
    id: '0-article-body',
    contentTypeId: 'article',
    contentTypeName: 'Article',
    entryName: 'A',
    fieldId: 'body',
    fieldName: 'Body',
    fieldType: 'Text',
    sourceRef: imageRef,
  };

  it('moves image source ref from current field to target field', () => {
    const graph: EntryBlockGraph = {
      entries: [
        {
          contentTypeId: 'article',
          fieldMappings: [
            { fieldId: 'body', fieldType: 'Text', sourceRefs: [imageRef], confidence: 1 },
            { fieldId: 'gallery', fieldType: 'Array', sourceRefs: [], confidence: 1 },
          ],
        },
      ],
      excludedSourceRefs: [imageRef],
    };

    const next = applyImageReassignToEntryBlockGraph(graph, imageLocation, imageRef, [
      { entryIndex: 0, fieldId: 'gallery', fieldType: 'Array' },
    ]);

    expect(next.entries[0]?.fieldMappings.find((fm) => fm.fieldId === 'body')?.sourceRefs).toEqual(
      []
    );
    expect(
      next.entries[0]?.fieldMappings.find((fm) => fm.fieldId === 'gallery')?.sourceRefs
    ).toEqual([imageRef]);
    expect(next.excludedSourceRefs).toEqual([]);
  });

  it('creates a destination field mapping when target field is missing', () => {
    const graph: EntryBlockGraph = {
      entries: [
        {
          contentTypeId: 'article',
          fieldMappings: [
            { fieldId: 'body', fieldType: 'Text', sourceRefs: [imageRef], confidence: 1 },
          ],
        },
      ],
      excludedSourceRefs: [],
    };

    const next = applyImageReassignToEntryBlockGraph(graph, imageLocation, imageRef, [
      { entryIndex: 0, fieldId: 'heroImage', fieldType: 'Link' },
    ]);

    expect(next.entries[0]?.fieldMappings.find((fm) => fm.fieldId === 'body')?.sourceRefs).toEqual(
      []
    );
    expect(
      next.entries[0]?.fieldMappings.find((fm) => fm.fieldId === 'heroImage')?.sourceRefs
    ).toEqual([imageRef]);
  });

  it('dedupes targets and does not duplicate existing image refs', () => {
    const graph: EntryBlockGraph = {
      entries: [
        {
          contentTypeId: 'article',
          fieldMappings: [
            { fieldId: 'body', fieldType: 'Text', sourceRefs: [imageRef], confidence: 1 },
            { fieldId: 'gallery', fieldType: 'Array', sourceRefs: [imageRef], confidence: 1 },
          ],
        },
      ],
      excludedSourceRefs: [],
    };

    const next = applyImageReassignToEntryBlockGraph(graph, imageLocation, imageRef, [
      { entryIndex: 0, fieldId: 'gallery', fieldType: 'Array' },
      { entryIndex: 0, fieldId: 'gallery', fieldType: 'Array' },
    ]);

    expect(
      next.entries[0]?.fieldMappings.find((fm) => fm.fieldId === 'gallery')?.sourceRefs
    ).toEqual([imageRef]);
  });

  it('returns original graph when only same-source target is selected', () => {
    const graph: EntryBlockGraph = {
      entries: [
        {
          contentTypeId: 'article',
          fieldMappings: [
            { fieldId: 'body', fieldType: 'Text', sourceRefs: [imageRef], confidence: 1 },
          ],
        },
      ],
      excludedSourceRefs: [],
    };

    const next = applyImageReassignToEntryBlockGraph(graph, imageLocation, imageRef, [
      { entryIndex: 0, fieldId: 'body', fieldType: 'Text' },
    ]);

    expect(next).toBe(graph);
  });
});

describe('appendImageToTargets', () => {
  it('adds excluded image to target field and clears exclusion', () => {
    const imageRef: SourceRef = {
      type: 'image',
      blockId: 'block-1',
      imageId: 'image-1',
    };
    const graph: EntryBlockGraph = {
      entries: [
        {
          contentTypeId: 'article',
          fieldMappings: [{ fieldId: 'body', fieldType: 'Text', sourceRefs: [], confidence: 1 }],
        },
      ],
      excludedSourceRefs: [imageRef],
    };

    const next = appendImageToTargets(graph, imageRef, [
      { entryIndex: 0, fieldId: 'heroImage', fieldType: 'Link' },
    ]);

    expect(
      next.entries[0]?.fieldMappings.find((fm) => fm.fieldId === 'heroImage')?.sourceRefs
    ).toEqual([imageRef]);
    expect(next.excludedSourceRefs).toEqual([]);
  });
});
