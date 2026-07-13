import { EntryProps } from 'contentful-management';

export const makeMockEntry = (
  id: string,
  contentTypeId: string,
  fields: EntryProps['fields'] = {},
  updatedAt = '2026-06-01T00:00:00Z',
  // Version 1 = never saved after creation; pass a higher version to model
  // an entry that has been edited.
  version = 1
): EntryProps =>
  ({
    sys: {
      id,
      type: 'Entry',
      version,
      contentType: { sys: { type: 'Link', linkType: 'ContentType', id: contentTypeId } },
      space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
      environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt,
    },
    fields,
  } as EntryProps);
