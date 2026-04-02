import { describe, it, expect } from 'vitest';
import { validatePayloadShape, orderEntriesByCreationOrder } from '../../src/utils/previewPayload';
import type { EntryToCreate } from '@types';

const minimalEntry = {
  contentTypeId: 'blogPost',
  fields: { title: { 'en-US': 'x' } },
};

function minimalPayload(overrides: Record<string, unknown> = {}) {
  return {
    entries: [minimalEntry],
    assets: [],
    referenceGraph: {},
    normalizedDocument: {
      documentId: 'doc-1',
      contentBlocks: [],
      tables: [],
    },
    ...overrides,
  };
}

describe('validatePayloadShape normalizedDocument', () => {
  it('accepts minimal normalizedDocument', () => {
    const out = validatePayloadShape(minimalPayload());
    expect(out.normalizedDocument).toEqual({
      documentId: 'doc-1',
      contentBlocks: [],
      tables: [],
    });
  });

  it('defaults missing documentId and arrays when object is partial', () => {
    const out = validatePayloadShape(
      minimalPayload({
        normalizedDocument: { contentBlocks: [], tables: [] },
      })
    );
    expect(out.normalizedDocument.documentId).toBe('');
    expect(out.normalizedDocument.contentBlocks).toEqual([]);
    expect(out.normalizedDocument.tables).toEqual([]);
  });

  it('defaults contentBlocks and tables to [] when not arrays', () => {
    const out = validatePayloadShape(
      minimalPayload({
        normalizedDocument: { documentId: 'd', contentBlocks: null, tables: undefined },
      })
    );
    expect(out.normalizedDocument.contentBlocks).toEqual([]);
    expect(out.normalizedDocument.tables).toEqual([]);
  });

  it('uses empty normalizedDocument when value is not a plain object', () => {
    const out = validatePayloadShape(
      minimalPayload({
        normalizedDocument: null,
      })
    );
    expect(out.normalizedDocument).toEqual({
      documentId: '',
      contentBlocks: [],
      tables: [],
    });
  });

  it('drops unknown top-level keys on normalizedDocument', () => {
    const out = validatePayloadShape(
      minimalPayload({
        normalizedDocument: {
          documentId: 'd',
          title: 'T',
          contentBlocks: [],
          tables: [],
          extraField: 123,
        },
      })
    );
    expect(out.normalizedDocument).toEqual({
      documentId: 'd',
      title: 'T',
      contentBlocks: [],
      tables: [],
    });
    expect('extraField' in out.normalizedDocument).toBe(false);
  });
});

describe('orderEntriesByCreationOrder', () => {
  it('does not duplicate entries when creationOrder repeats the same tempId', () => {
    const a: EntryToCreate = {
      tempId: 'a',
      contentTypeId: 't',
      fields: { title: { 'en-US': 'A' } },
    };
    const b: EntryToCreate = {
      tempId: 'b',
      contentTypeId: 't',
      fields: { title: { 'en-US': 'B' } },
    };

    const ordered = orderEntriesByCreationOrder([a, b], ['a', 'a', 'b', 'b']);

    expect(ordered).toEqual([a, b]);
  });
});
