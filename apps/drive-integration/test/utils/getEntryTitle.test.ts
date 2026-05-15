import { describe, expect, it } from 'vitest';
import { getEntryTitleFromFieldMappings } from '../../src/utils/getEntryTitle';

describe('getEntryTitleFromFieldMappings', () => {
  const createTextSourceRef = (text: string) => ({
    type: 'blockText' as const,
    blockId: 'block-1',
    start: 0,
    end: text.length,
    flattenedRuns: [{ text, start: 0, end: text.length }],
  });

  it('extracts the entry title from the display field mapping', () => {
    const title = getEntryTitleFromFieldMappings(
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
      'title'
    );

    expect(title).toBe('Entry title');
  });
});
