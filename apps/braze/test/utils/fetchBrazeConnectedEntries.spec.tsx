import { describe, vi, beforeEach, afterEach, it, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import { fetchBrazeConnectedEntries } from '../../src/utils/fetchBrazeConnectedEntries';
import { Entry } from '../../src/fields/Entry';
import { BasicField } from '../../src/fields/BasicField';
import {
  mockConfigEntryWithLocalizedFields,
  mockConnectedFields,
  mockSingleConnectedField,
} from '../mocks/connectedFields';
import { createContentTypeResponse } from '../mocks/contentTypeResponse';
import {
  createConfigEntry,
  createEntryResponse as createEntryResponse,
} from '../mocks/entryResponse';

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
        items: [
          createEntryResponse(
            { title: { 'en-US': 'Title' }, author: { 'en-US': 'Author' } },
            true,
            true
          ),
        ],
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
      '',
      '2024-01-01T00:00:00Z'
    );
  };

  it('returns an entry when two fields are connected', async () => {
    const title = new BasicField('title', 'Title', 'content-type-id', true);
    const author = new BasicField('author', 'Author', 'content-type-id', true);
    const expectedEntry = createExpectedEntry([title, author]);

    const result = await fetchBrazeConnectedEntries(
      mockCma as unknown as any,
      'valid-contentful-api-key',
      'space-id',
      'environment-id',
      'en-US',
      createConfigEntry(mockConnectedFields)
    );

    expect(result[0].serialize()).toEqual(expectedEntry.serialize());
  });

  it('returns an entry with only connected fields when one field is connected', async () => {
    const title = new BasicField('title', 'Title', 'content-type-id', true);
    const expectedEntry = createExpectedEntry([title]);

    const result = await fetchBrazeConnectedEntries(
      mockCma as unknown as any,
      'valid-contentful-api-key',
      'space-id',
      'environment-id',
      'en-US',
      createConfigEntry(mockSingleConnectedField)
    );

    expect(result[0].serialize()).toEqual(expectedEntry.serialize());
  });
});
