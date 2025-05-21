import { describe, vi, beforeEach, afterEach, it, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import { fetchBrazeConnectedEntries } from '../../src/utils/fetchBrazeConnectedEntries';
import { Entry } from '../../src/fields/Entry';
import { BasicField } from '../../src/fields/BasicField';

const mockCma = {
  contentType: {
    get: vi.fn(),
  },
  entry: {
    getMany: vi.fn(),
    get: vi.fn(),
  },
};

describe('Page component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(cleanup);

  it('when two field are connected, then it returns an entry', async () => {
    mockCma.entry.get.mockResolvedValue({
      fields: {
        connectedFields: {
          'en-US': {
            ['entry-id']: [
              {
                fieldId: 'title',
                contentBlockId: 'contentBlockA',
              },
              {
                fieldId: 'author',
                contentBlockId: 'contentBlockB',
              },
            ],
          },
        },
      },
    });

    mockCma.entry.getMany.mockResolvedValue({
      sys: {
        type: 'Array',
      },
      total: 1,
      skip: 0,
      limit: 1000,
      items: [
        {
          metadata: {
            tags: [],
            concepts: [],
          },
          sys: {
            space: {
              sys: {
                type: 'Link',
                linkType: 'Space',
                id: 'space-id',
              },
            },
            id: 'entry-id',
            type: 'Entry',
            createdAt: '2025-05-08T16:04:58.212Z',
            updatedAt: '2025-05-15T16:49:16.367Z',
            environment: {
              sys: {
                id: 'environment-id',
                type: 'Link',
                linkType: 'Environment',
              },
            },
            publishedVersion: 10,
            publishedAt: '2025-05-15T16:49:16.367Z',
            firstPublishedAt: '2025-05-08T16:05:05.759Z',
            createdBy: {
              sys: {
                type: 'Link',
                linkType: 'User',
                id: 'user-id',
              },
            },
            updatedBy: {
              sys: {
                type: 'Link',
                linkType: 'User',
                id: 'user-id',
              },
            },
            publishedCounter: 3,
            version: 11,
            publishedBy: {
              sys: {
                type: 'Link',
                linkType: 'User',
                id: 'user-id',
              },
            },
            fieldStatus: {
              '*': {
                'en-US': 'published',
              },
            },
            automationTags: [],
            contentType: {
              sys: {
                type: 'Link',
                linkType: 'ContentType',
                id: 'content-type-id',
              },
            },
            urn: 'crn:contentful:::content:spaces/space-id/environments/environment-id/entries/entry-id',
          },
          fields: {
            title: {
              'en-US': 'Test Title',
            },
            author: {
              'en-US': 'Test Author',
            },
          },
        },
      ],
    });

    mockCma.contentType.get.mockImplementation(() => {
      return {
        fields: [
          { id: 'title', type: 'Symbol', localized: false, name: 'Test Title' },
          { id: 'author', type: 'Symbol', localized: false, name: 'Test Author' },
        ],
        displayField: 'title',
        sys: {
          id: 'content-type-id',
        },
      };
    });

    const result = await fetchBrazeConnectedEntries(
      mockCma as unknown as any,
      'valid-contentful-api-key',
      'space-id',
      'environment-id'
    );
    const title = new BasicField('title', 'Test Title', 'content-type-id', false);
    const author = new BasicField('author', 'Test Author', 'content-type-id', false);
    const entry = new Entry(
      'entry-id',
      'content-type-id',
      'Test Title',
      [title, author],
      'space-id',
      'environment-id',
      'valid-contentful-api-key',
      '2025-05-15T16:49:16.367Z',
      '2025-05-15T16:49:16.367Z'
    );
    expect(result[0].serialize()).toEqual(entry.serialize());
  });

  it("when one field is connected and the other isn't, it returns an entry with only connected fields", async () => {
    mockCma.entry.get.mockResolvedValue({
      fields: {
        connectedFields: {
          'en-US': {
            ['entry-id']: [
              {
                fieldId: 'title',
                contentBlockId: 'contentBlockA',
              },
            ],
          },
        },
      },
    });

    mockCma.entry.getMany.mockResolvedValue({
      sys: {
        type: 'Array',
      },
      total: 1,
      skip: 0,
      limit: 1000,
      items: [
        {
          metadata: {
            tags: [],
            concepts: [],
          },
          sys: {
            space: {
              sys: {
                type: 'Link',
                linkType: 'Space',
                id: 'space-id',
              },
            },
            id: 'entry-id',
            type: 'Entry',
            createdAt: '2025-05-08T16:04:58.212Z',
            updatedAt: '2025-05-15T16:49:16.367Z',
            environment: {
              sys: {
                id: 'environment-id',
                type: 'Link',
                linkType: 'Environment',
              },
            },
            publishedVersion: 10,
            publishedAt: '2025-05-15T16:49:16.367Z',
            firstPublishedAt: '2025-05-08T16:05:05.759Z',
            createdBy: {
              sys: {
                type: 'Link',
                linkType: 'User',
                id: 'user-id',
              },
            },
            updatedBy: {
              sys: {
                type: 'Link',
                linkType: 'User',
                id: 'user-id',
              },
            },
            publishedCounter: 3,
            version: 11,
            publishedBy: {
              sys: {
                type: 'Link',
                linkType: 'User',
                id: 'user-id',
              },
            },
            fieldStatus: {
              '*': {
                'en-US': 'published',
              },
            },
            automationTags: [],
            contentType: {
              sys: {
                type: 'Link',
                linkType: 'ContentType',
                id: 'content-type-id',
              },
            },
            urn: 'crn:contentful:::content:spaces/space-id/environments/environment-id/entries/entry-id',
          },
          fields: {
            title: {
              'en-US': 'Test Title',
            },
            author: {
              'en-US': 'Test Author',
            },
          },
        },
      ],
    });

    mockCma.contentType.get.mockImplementation(() => {
      return {
        fields: [
          { id: 'title', type: 'Symbol', localized: false, name: 'Test Title' },
          { id: 'author', type: 'Symbol', localized: false, name: 'Test Author' },
        ],
        displayField: 'title',
        sys: {
          id: 'content-type-id',
        },
      };
    });

    const result = await fetchBrazeConnectedEntries(
      mockCma as unknown as any,
      'valid-contentful-api-key',
      'space-id',
      'environment-id'
    );
    const title = new BasicField('title', 'Test Title', 'content-type-id', false);
    const entry = new Entry(
      'entry-id',
      'content-type-id',
      'Test Title',
      [title],
      'space-id',
      'environment-id',
      'valid-contentful-api-key',
      '2025-05-15T16:49:16.367Z',
      '2025-05-15T16:49:16.367Z'
    );
    expect(result[0].serialize()).toEqual(entry.serialize());
  });
});
