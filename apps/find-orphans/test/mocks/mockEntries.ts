import { EntryProps } from 'contentful-management';

export const makeMockEntry = (
  id: string,
  contentTypeId: string,
  fields: EntryProps['fields'] = {},
  updatedAt = '2026-06-01T00:00:00Z'
): EntryProps =>
  ({
    sys: {
      id,
      type: 'Entry',
      version: 1,
      contentType: { sys: { type: 'Link', linkType: 'ContentType', id: contentTypeId } },
      space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
      environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt,
    },
    fields,
  } as EntryProps);
