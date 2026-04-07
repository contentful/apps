import { describe, expect, it } from 'vitest';
import type { EntryToCreate, PreviewPayload } from '@types';
import type { ContentTypeDisplayInfo } from '../../src/utils/getEntryTitle';
import {
  buildCheckboxEntryList,
  filterPreviewPayloadBySelectedRowIds,
} from '../../src/utils/checkboxEntryList';

function createEntry(overrides: Partial<EntryToCreate> = {}): EntryToCreate {
  return {
    tempId: 'entry-1',
    contentTypeId: 'blogPost',
    fields: {},
    ...overrides,
  };
}

function createPayload(entries: EntryToCreate[], creationOrder?: string[]): PreviewPayload {
  return {
    entries,
    assets: [],
    referenceGraph: creationOrder ? { creationOrder } : {},
    normalizedDocument: {
      documentId: 'doc-test',
      contentBlocks: [],
      tables: [],
    },
  };
}

function createContentTypeInfoMap(
  entries: Array<[string, ContentTypeDisplayInfo]>
): Map<string, ContentTypeDisplayInfo> {
  return new Map(entries);
}

describe('buildCheckboxEntryList', () => {
  it('returns an empty list when there are no entries', () => {
    expect(buildCheckboxEntryList(createPayload([]))).toEqual([]);
  });

  it('only includes entries with tempIds and preserves their ordered indexes', () => {
    const rows = buildCheckboxEntryList(
      createPayload([
        createEntry({
          contentTypeId: 'page',
          fields: { title: { 'en-US': 'No temp id' } },
          tempId: undefined,
        }),
        createEntry({
          tempId: 'page-1',
          contentTypeId: 'page',
          fields: { title: { 'en-US': 'Page title' } },
        }),
      ])
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'page-1',
      entryIndex: 1,
      contentTypeName: '',
      entryTitle: 'Untitled',
      children: [],
    });
  });

  it('builds nested rows and resolves content type names and entry titles from display fields', () => {
    const payload = createPayload(
      [
        createEntry({
          tempId: 'page_1',
          contentTypeId: 'page',
          fields: {
            title: { 'en-US': 'Event Detail' },
            modules: { 'en-US': [{ __ref: 'hero_1' }] },
          },
        }),
        createEntry({
          tempId: 'hero_1',
          contentTypeId: 'component',
          fields: {
            internalName: { 'en-US': 'Resource detail hero' },
          },
        }),
      ],
      ['page_1', 'hero_1']
    );

    const contentTypeInfoById = createContentTypeInfoMap([
      ['page', { name: 'Page', displayField: 'title' }],
      ['component', { name: 'Component', displayField: 'internalName' }],
    ]);

    const rows = buildCheckboxEntryList(payload, contentTypeInfoById, 'en-US');

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'page_1',
      entryIndex: 0,
      contentTypeName: 'Page',
      entryTitle: 'Event Detail',
    });
    expect(rows[0].children).toHaveLength(1);
    expect(rows[0].children[0]).toMatchObject({
      id: 'hero_1',
      entryIndex: 1,
      contentTypeName: 'Component',
      entryTitle: 'Resource detail hero',
      children: [],
    });
  });

  it('falls back consistently when content type metadata is missing or unusable', () => {
    const payload = createPayload([
      createEntry({
        tempId: 'x',
        contentTypeId: 'unknownType',
        fields: { title: { 'en-US': 'Only title' } },
      }),
      createEntry({
        tempId: 'y',
        contentTypeId: 'knownType',
        fields: { title: { 'en-US': 'Ignored because there is no display field' } },
      }),
    ]);

    const rows = buildCheckboxEntryList(
      payload,
      createContentTypeInfoMap([['knownType', { name: 'Known type' }]]),
      'en-US'
    );

    expect(rows[0]).toMatchObject({
      contentTypeName: '',
      entryTitle: 'Untitled',
    });
    expect(rows[1]).toMatchObject({
      contentTypeName: 'Known type',
      entryTitle: '',
    });
  });
});

describe('filterPreviewPayloadBySelectedRowIds', () => {
  it('keeps only entries whose row ids are selected', () => {
    const payload = createPayload([
      createEntry({
        tempId: 'a',
        fields: { title: { 'en-US': 'A' } },
      }),
      createEntry({
        tempId: 'b',
        fields: { title: { 'en-US': 'B' } },
      }),
    ]);

    const filtered = filterPreviewPayloadBySelectedRowIds(payload, new Set(['b']));

    expect(filtered.entries).toHaveLength(1);
    expect(filtered.entries[0].tempId).toBe('b');
  });
});
