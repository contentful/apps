import { describe, vi, beforeEach, afterEach, it, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import { fetchBrazeConnectedEntries } from '../../src/utils/fetchBrazeConnectedEntries';
import { Entry } from '../../src/fields/Entry';
import { BasicField } from '../../src/fields/BasicField';
import { mockConnectedFields, mockSingleConnectedField } from '../mocks/connectedFields';
import { createContentTypeResponse } from '../mocks/contentTypeResponse';
import { createGetManyEntryResponse } from '../mocks/entryResponse';

describe('fetchBrazeConnectedEntries', () => {
  const mockCma = {
    contentType: {
      get: vi.fn().mockResolvedValue(createContentTypeResponse(['title', 'author'])),
    },
    entry: {
      getMany: vi.fn().mockResolvedValue({
        sys: { type: 'Array' },
        total: 1,
        skip: 0,
        limit: 1000,
        items: [createGetManyEntryResponse({ title: 'Title', author: 'Author' })],
      }),
      get: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  const createExpectedEntry = (fields: BasicField[]) => {
    return new Entry(
      'entry-id',
      'content-type-id',
      'Title',
      fields,
      'space-id',
      'environment-id',
      'valid-contentful-api-key',
      '2025-05-15T16:49:16.367Z',
      '2025-05-15T16:49:16.367Z'
    );
  };

  it('returns an entry when two fields are connected', async () => {
    mockCma.entry.get.mockResolvedValue(mockConnectedFields);
    const title = new BasicField('title', 'Title', 'content-type-id', true);
    const author = new BasicField('author', 'Author', 'content-type-id', true);
    const expectedEntry = createExpectedEntry([title, author]);

    const result = await fetchBrazeConnectedEntries(
      mockCma as unknown as any,
      'valid-contentful-api-key',
      'space-id',
      'environment-id',
      'en-US'
    );

    expect(result[0].serialize()).toEqual(expectedEntry.serialize());
  });

  it('returns an entry with only connected fields when one field is connected', async () => {
    mockCma.entry.get.mockResolvedValue(mockSingleConnectedField);
    const title = new BasicField('title', 'Title', 'content-type-id', true);
    const expectedEntry = createExpectedEntry([title]);

    const result = await fetchBrazeConnectedEntries(
      mockCma as unknown as any,
      'valid-contentful-api-key',
      'space-id',
      'environment-id',
      'en-US'
    );

    expect(result[0].serialize()).toEqual(expectedEntry.serialize());
  });
});
