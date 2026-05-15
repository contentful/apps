import { describe, expect, it } from 'vitest';
import type { CompletedWorkflowPayload } from '../../src/types';
import type { ContentTypeDisplayInfo } from '../../src/services/contentTypeService';
import {
  buildEntryList,
  buildEntryListFromEntryBlockGraph,
} from '../../src/utils/overviewEntryList';
import { truncateLabel } from '../../src/utils/utils';

describe('buildEntryList', () => {
  it('omits entries without tempId', () => {
    const payload: CompletedWorkflowPayload = {
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
    };
    const rows = buildEntryList(payload);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('only');
    expect(rows[0].entryIndex).toBe(1);
  });

  it('returns empty array when there are no entries', () => {
    const payload: CompletedWorkflowPayload = {
      entries: [],
      assets: [],
      referenceGraph: {},
    };
    expect(buildEntryList(payload)).toEqual([]);
  });

  it('nests rows when a parent references a child tempId', () => {
    const payload: CompletedWorkflowPayload = {
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
    };

    const rows = buildEntryList(payload);
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
    const payload: CompletedWorkflowPayload = {
      entries: [
        {
          tempId: 'x',
          contentTypeId: 'unknownType',
          fields: { title: { 'en-US': 'Only title' } },
        },
      ],
      assets: [],
      referenceGraph: {},
    };

    const rows = buildEntryList(
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
    const payload: CompletedWorkflowPayload = {
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
    };

    const contentTypeDisplayInfoById = new Map<string, ContentTypeDisplayInfo>([
      ['page', { name: 'Page (space name)', displayField: 'title' }],
    ]);
    const rows = buildEntryList(payload, contentTypeDisplayInfoById, 'en-US');
    expect(rows[0].contentTypeName).toBe('Page (space name)');
    expect(rows[0].entryTitle).toBe('Event Detail');
  });
});

describe('buildEntryListFromEntryBlockGraph', () => {
  const contentTypes = [
    {
      sys: { id: 'article' },
      name: 'Article',
      displayField: 'title',
      fields: [],
    },
  ];

  const createTextSourceRef = (text: string) => ({
    type: 'blockText' as const,
    blockId: 'block-1',
    start: 0,
    end: text.length,
    flattenedRuns: [{ text, start: 0, end: text.length }],
  });

  it('extracts the entry title from the display field mapping', () => {
    const rows = buildEntryListFromEntryBlockGraph(
      [
        {
          tempId: 'entry-1',
          contentTypeId: 'article',
          fieldMappings: [
            {
              fieldId: 'title',
              fieldType: 'Symbol',
              sourceRefs: [createTextSourceRef('Entry title')],
              confidence: 0.9,
            },
          ],
        },
      ],
      contentTypes
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].contentTypeName).toBe('Article');
    expect(rows[0].entryTitle).toBe('Entry title');
  });

  it('truncates long display-field text using the first text source ref only', () => {
    const long = 'a'.repeat(100);
    const rows = buildEntryListFromEntryBlockGraph(
      [
        {
          tempId: 'entry-1',
          contentTypeId: 'article',
          fieldMappings: [
            {
              fieldId: 'title',
              fieldType: 'Symbol',
              sourceRefs: [
                createTextSourceRef(long),
                {
                  type: 'blockText' as const,
                  blockId: 'block-2',
                  start: 0,
                  end: 5,
                  flattenedRuns: [{ text: 'SKIP', start: 0, end: 5 }],
                },
              ],
              confidence: 0.9,
            },
          ],
        },
      ],
      contentTypes
    );

    expect(rows[0].entryTitle).toBe(truncateLabel(long, 80));
  });
});
