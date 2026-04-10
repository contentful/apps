import { describe, expect, it } from 'vitest';
import type { PreviewPayload } from '../../src/types';
import type { ContentTypeDisplayInfo } from '../../src/services/contentTypeService';
import {
  buildCheckboxEntryList,
  buildCheckboxEntryListFromMappingReviewPayload,
  filterPreviewPayloadBySelectedRowIds,
} from '../../src/utils/checkboxEntryList';

describe('buildCheckboxEntryList', () => {
  it('omits entries without tempId', () => {
    const payload: PreviewPayload = {
      entries: [
        {
          contentTypeId: 'blogPost',
          fields: { title: { 'en-US': 'No temp id' } },
        },
        {
          tempId: 'only',
          contentTypeId: 'blogPost',
          fields: { title: { 'en-US': 'Has temp' } },
        },
      ],
      assets: [],
      referenceGraph: {},
      normalizedDocument: {
        documentId: 'doc-test',
        contentBlocks: [],
        tables: [],
      },
    };
    const rows = buildCheckboxEntryList(payload);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('only');
    expect(rows[0].entryIndex).toBe(1);
  });

  it('returns empty array when there are no entries', () => {
    const payload: PreviewPayload = {
      entries: [],
      assets: [],
      referenceGraph: {},
      normalizedDocument: {
        documentId: 'doc-test',
        contentBlocks: [],
        tables: [],
      },
    };
    expect(buildCheckboxEntryList(payload)).toEqual([]);
  });

  it('nests rows when a parent references a child tempId', () => {
    const payload: PreviewPayload = {
      entries: [
        {
          tempId: 'page_1',
          contentTypeId: 'page',
          fields: {
            title: { 'en-US': 'Event Detail' },
            modules: { 'en-US': [{ __ref: 'hero_1' }] },
          },
        },
        {
          tempId: 'hero_1',
          contentTypeId: 'component',
          fields: {
            title: { 'en-US': 'Resource detail hero' },
            description: { 'en-US': "Don't enter NRF uncaffeinated." },
          },
        },
      ],
      assets: [],
      referenceGraph: { creationOrder: ['page_1', 'hero_1'] },
      normalizedDocument: {
        documentId: 'doc-test',
        contentBlocks: [],
        tables: [],
      },
    };

    const rows = buildCheckboxEntryList(payload);
    expect(rows).toHaveLength(1);
    expect(rows[0].entryIndex).toBe(0);
    expect(rows[0].contentTypeName).toBe('');
    expect(rows[0].entryTitle).toBe('Untitled');
    expect(rows[0].children).toHaveLength(1);
    expect(rows[0].children[0].entryIndex).toBe(1);
    expect(rows[0].children[0].contentTypeName).toBe('');
    expect(rows[0].children[0].entryTitle).toBe('Untitled');
  });

  it('uses empty type prefix when content type names map has no entry for that id', () => {
    const payload: PreviewPayload = {
      entries: [
        {
          tempId: 'x',
          contentTypeId: 'unknownType',
          fields: { title: { 'en-US': 'Only title' } },
        },
      ],
      assets: [],
      referenceGraph: {},
      normalizedDocument: {
        documentId: 'doc-test',
        contentBlocks: [],
        tables: [],
      },
    };

    const rows = buildCheckboxEntryList(
      payload,
      new Map<string, ContentTypeDisplayInfo>([
        ['other', { name: 'Other', displayField: 'title' }],
      ]),
      'en-US'
    );
    expect(rows[0].contentTypeName).toBe('');
    expect(rows[0].entryTitle).toBe('Untitled');
  });

  it('uses CMA content type names when a map is provided', () => {
    const payload: PreviewPayload = {
      entries: [
        {
          tempId: 'page_1',
          contentTypeId: 'page',
          fields: {
            title: { 'en-US': 'Event Detail' },
          },
        },
      ],
      assets: [],
      referenceGraph: {},
      normalizedDocument: {
        documentId: 'doc-test',
        contentBlocks: [],
        tables: [],
      },
    };

    const contentTypeDisplayInfoById = new Map<string, ContentTypeDisplayInfo>([
      ['page', { name: 'Page (space name)', displayField: 'title' }],
    ]);
    const rows = buildCheckboxEntryList(payload, contentTypeDisplayInfoById, 'en-US');
    expect(rows[0].contentTypeName).toBe('Page (space name)');
    expect(rows[0].entryTitle).toBe('Event Detail');
  });

  it('filterPreviewPayloadBySelectedRowIds keeps only selected rows', () => {
    const payload: PreviewPayload = {
      entries: [
        {
          tempId: 'a',
          contentTypeId: 'blogPost',
          fields: { title: { 'en-US': 'A' } },
        },
        {
          tempId: 'b',
          contentTypeId: 'blogPost',
          fields: { title: { 'en-US': 'B' } },
        },
      ],
      assets: [],
      referenceGraph: {},
      normalizedDocument: {
        documentId: 'doc-test',
        contentBlocks: [],
        tables: [],
      },
    };

    const filtered = filterPreviewPayloadBySelectedRowIds(payload, new Set(['b']));
    expect(filtered.entries).toHaveLength(1);
    expect(filtered.entries[0].tempId).toBe('b');
  });

  it('builds overview rows from the mapping review suspend payload', () => {
    const payload = {
      suspendStepId: 'mapping-review',
      reason: 'Mapping review required before CMA payload generation continues',
      documentId: 'doc-test',
      documentTitle: 'Mapping review doc',
      normalizedDocument: {
        documentId: 'doc-test',
        title: 'Mapping review doc',
        contentBlocks: [],
        tables: [],
      },
      contentTypes: [
        {
          sys: { id: 'page' },
          name: 'Page',
          displayField: 'title',
          fields: [],
        },
        {
          sys: { id: 'hero' },
          name: 'Hero',
          displayField: 'internalName',
          fields: [],
        },
      ],
      referenceGraph: {
        edges: [
          {
            from: 'page_1',
            to: 'hero_1',
            fieldId: 'hero',
          },
        ],
        creationOrder: ['hero_1', 'page_1'],
        deferredFields: [],
        hasCircularDependency: false,
      },
      entryBlockGraph: {
        entries: [
          {
            tempId: 'page_1',
            contentTypeId: 'page',
            fieldMappings: [],
          },
          {
            tempId: 'hero_1',
            contentTypeId: 'hero',
            fieldMappings: [],
          },
        ],
        excludedSourceRefs: [],
      },
    };

    const rows = buildCheckboxEntryListFromMappingReviewPayload(payload as any);

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('page_1');
    expect(rows[0].contentTypeName).toBe('Page');
    expect(rows[0].entryTitle).toBe('page_1');
    expect(rows[0].children).toHaveLength(1);
    expect(rows[0].children[0].id).toBe('hero_1');
    expect(rows[0].children[0].contentTypeName).toBe('Hero');
    expect(rows[0].children[0].entryTitle).toBe('hero_1');
  });
});
