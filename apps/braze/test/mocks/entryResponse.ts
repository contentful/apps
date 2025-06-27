import { EntryProps, KeyValueMap } from 'contentful-management';

export function createEntryResponse(
  fields: Record<string, any>,
  includeMetadata = false,
  isDraft = true
): EntryProps {
  return {
    metadata: includeMetadata
      ? {
          tags: [],
          concepts: [],
        }
      : undefined,
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
      id: 'entry-id',
      type: 'Entry',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      environment: { sys: { type: 'Link', linkType: 'Environment', id: 'environment-id' } },
      publishedVersion: 10,
      publishedAt: isDraft ? undefined : '2024-01-01T00:00:00Z',
      firstPublishedAt: '2024-01-01T00:00:00Z',
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
    fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value])),
  };
}

export const mockConfigEntrySys = {
  type: 'Entry',
  id: 'config-entry',
  contentType: { sys: { type: 'Link', linkType: 'ContentType', id: 'config' } },
  space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
  environment: { sys: { type: 'Link', linkType: 'Environment', id: 'environment-id' } },
  version: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  automationTags: [],
};

export const createConfigEntry = (connectedFields: KeyValueMap): EntryProps => {
  return {
    sys: mockConfigEntrySys,
    fields: {
      connectedFields,
    },
  };
};
