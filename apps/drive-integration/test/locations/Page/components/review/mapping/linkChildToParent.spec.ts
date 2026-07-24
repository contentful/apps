import { describe, expect, it } from 'vitest';
import type { EntryBlockGraphEntry } from '@types';
import { linkChildToParentEntry } from '../../../../../../src/locations/Page/components/review/mapping/linkChildToParent';

const parentEntry = (overrides: Partial<EntryBlockGraphEntry> = {}): EntryBlockGraphEntry => ({
  tempId: 'parent-1',
  contentTypeId: 'page',
  fields: {
    author: { 'en-US': { __ref: 'old-child' } },
  },
  fieldMappings: [
    {
      fieldId: 'author',
      fieldType: 'Link',
      sourceRefs: [],
      sourceEntryIds: ['old-child'],
      confidence: 1,
    },
  ],
  ...overrides,
});

describe('linkChildToParentEntry', () => {
  it('replaces a filled single Link field, sourceEntryIds, and edges with the new child', () => {
    const result = linkChildToParentEntry({
      parentEntry: parentEntry(),
      childTempId: 'new-child',
      refField: { id: 'author', type: 'Link' },
      defaultLocale: 'en-US',
      previousEdges: [
        { from: 'parent-1', to: 'old-child', fieldId: 'author' },
        { from: 'parent-1', to: 'other', fieldId: 'related' },
      ],
    });

    expect(result.parentEntry.fields?.author).toEqual({
      'en-US': { __ref: 'new-child' },
    });
    expect(result.parentEntry.fieldMappings[0].sourceEntryIds).toEqual(['new-child']);
    expect(result.edges).toEqual([
      { from: 'parent-1', to: 'other', fieldId: 'related' },
      { from: 'parent-1', to: 'new-child', fieldId: 'author' },
    ]);
  });

  it('writes the new child to every existing locale on a single Link field', () => {
    const result = linkChildToParentEntry({
      parentEntry: parentEntry({
        fields: {
          author: {
            'en-US': { __ref: 'old-child' },
            'de-DE': { __ref: 'old-child' },
          },
        },
      }),
      childTempId: 'new-child',
      refField: { id: 'author', type: 'Link' },
      defaultLocale: 'en-US',
      previousEdges: [],
    });

    expect(result.parentEntry.fields?.author).toEqual({
      'en-US': { __ref: 'new-child' },
      'de-DE': { __ref: 'new-child' },
    });
  });

  it('adds a new fieldMapping when a new child entry is added to a parent with no existing mapping for that field', () => {
    const result = linkChildToParentEntry({
      parentEntry: parentEntry({ fieldMappings: [] }),
      childTempId: 'new-child',
      refField: { id: 'author', type: 'Link' },
      defaultLocale: 'en-US',
      previousEdges: [],
    });

    expect(result.parentEntry.fieldMappings).toEqual([
      {
        fieldId: 'author',
        fieldType: 'Link',
        sourceRefs: [],
        sourceEntryIds: ['new-child'],
        confidence: 1,
      },
    ]);
  });

  it('appends to Array reference fields and edges without removing prior children', () => {
    const result = linkChildToParentEntry({
      parentEntry: parentEntry({
        fields: {
          related: { 'en-US': [{ __ref: 'old-child' }] },
        },
        fieldMappings: [
          {
            fieldId: 'related',
            fieldType: 'Array',
            sourceRefs: [],
            sourceEntryIds: ['old-child'],
            confidence: 1,
          },
        ],
      }),
      childTempId: 'new-child',
      refField: { id: 'related', type: 'Array' },
      defaultLocale: 'en-US',
      previousEdges: [{ from: 'parent-1', to: 'old-child', fieldId: 'related' }],
    });

    expect(result.parentEntry.fields?.related).toEqual({
      'en-US': [{ __ref: 'old-child' }, { __ref: 'new-child' }],
    });
    expect(result.parentEntry.fieldMappings[0].sourceEntryIds).toEqual(['old-child', 'new-child']);
    expect(result.edges).toEqual([
      { from: 'parent-1', to: 'old-child', fieldId: 'related' },
      { from: 'parent-1', to: 'new-child', fieldId: 'related' },
    ]);
  });
});
