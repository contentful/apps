import { describe, expect, it } from 'vitest';
import { isReference, type EntryToCreate } from '@types';

describe('entryServiceTypes', () => {
  it('detects reference placeholders without relying on parser-agent schema code', () => {
    expect(isReference({ __ref: 'author_1' })).toBe(true);
    expect(isReference({ __ref: 123 })).toBe(false);
    expect(isReference({ id: 'author_1' })).toBe(false);
    expect(isReference(null)).toBe(false);
  });

  it('defines entry creation types for app-side entry creation flows', () => {
    const entry: EntryToCreate = {
      tempId: 'post_1',
      contentTypeId: 'blogPost',
      fields: {
        title: {
          'en-US': 'Hello world',
        },
      },
    };

    expect(entry.contentTypeId).toBe('blogPost');
    expect(entry.fields.title['en-US']).toBe('Hello world');
  });
});
