import { describe, expect, it } from 'vitest';
import type { EntryBlockGraph } from '../../src/types/entryBlockGraph';
import {
  countSelectedEntries,
  filterEntryBlockGraphBySelection,
  getAllEntrySelectionKeys,
} from '../../src/utils/selectEntryBlockGraph';

describe('selectEntryBlockGraph utilities', () => {
  const graph: EntryBlockGraph = {
    entries: [
      {
        tempId: 'page-1',
        contentTypeId: 'page',
        fieldMappings: [
          {
            fieldId: 'modules',
            fieldType: 'Array',
            sourceRefs: [],
            sourceEntryIds: ['hero-1', 'quote-1'],
            confidence: 0.9,
          },
        ],
      },
      {
        tempId: 'hero-1',
        contentTypeId: 'hero',
        fieldMappings: [
          {
            fieldId: 'title',
            fieldType: 'Symbol',
            sourceRefs: [],
            confidence: 0.9,
          },
        ],
      },
      {
        contentTypeId: 'quote',
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
  };

  it('uses temp ids and index fallback keys for initial selection', () => {
    expect([...getAllEntrySelectionKeys(graph.entries)]).toEqual(['page-1', 'hero-1', '2']);
  });

  it('counts selected entries against the current graph entries', () => {
    expect(countSelectedEntries(graph.entries, new Set(['page-1', '2', 'missing']))).toBe(2);
  });

  it('filters entries and prunes references to unselected temp ids', () => {
    const selectedGraph = filterEntryBlockGraphBySelection(graph, new Set(['page-1', '2']));

    expect(selectedGraph.entries.map((entry) => entry.contentTypeId)).toEqual(['page', 'quote']);
    expect(selectedGraph.entries[0].fieldMappings[0].sourceEntryIds).toEqual([]);
  });
});
