import { EntryProps } from 'contentful-management';

export function createGetManyEntryResponse(fields: Record<string, any>): EntryProps {
  return {
    metadata: {
      tags: [],
      concepts: [],
    },
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
      id: 'entry-id',
      type: 'Entry',
      createdAt: '2025-05-08T16:04:58.212Z',
      updatedAt: '2025-05-15T16:49:16.367Z',
      environment: { sys: { type: 'Link', linkType: 'Environment', id: 'environment-id' } },
      publishedVersion: 10,
      publishedAt: '2025-05-15T16:49:16.367Z',
      firstPublishedAt: '2025-05-08T16:05:05.759Z',
      createdBy: { sys: { type: 'Link', linkType: 'User', id: 'user-id' } },
      updatedBy: { sys: { type: 'Link', linkType: 'User', id: 'user-id' } },
      publishedCounter: 3,
      version: 11,
      publishedBy: {
        sys: { type: 'Link', linkType: 'User', id: 'user-id' },
      },
      fieldStatus: {
        '*': { 'en-US': 'published' },
      },
      automationTags: [],
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'content-type-id' },
      },
    },
    fields: Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [key, { 'en-US': value }])
    ),
  };
}

export function createGetEntryResponse(fields: Record<string, any>): EntryProps {
  return {
    sys: {
      id: 'entry-id',
      type: 'Entry',
      space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
      environment: { sys: { type: 'Link', linkType: 'Environment', id: 'environment-id' } },
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'content-type-id' },
      },
      locale: 'en-US',
      version: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      automationTags: [],
    },
    fields: Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [key, { 'en-US': value }])
    ),
  } as EntryProps;
}
