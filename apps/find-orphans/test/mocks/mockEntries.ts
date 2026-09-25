import { AssetProps, EntryProps, UserProps } from 'contentful-management';

const createdByLink = (userId: string) => ({
  sys: { type: 'Link', linkType: 'User', id: userId },
});

export const makeMockEntry = (
  id: string,
  contentTypeId: string,
  fields: EntryProps['fields'] = {},
  createdAt = '2026-01-01T00:00:00Z',
  // Version 1 = never saved after creation; pass a higher version to model
  // an entry that has been edited.
  version = 1,
  createdById = 'user-1'
): EntryProps =>
  ({
    sys: {
      id,
      type: 'Entry',
      version,
      contentType: { sys: { type: 'Link', linkType: 'ContentType', id: contentTypeId } },
      space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
      environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
      createdAt,
      createdBy: createdByLink(createdById),
      updatedAt: createdAt,
    },
    fields,
  } as EntryProps);

export const makeMockAsset = (
  id: string,
  // Assets always define a localized title field, so a title of undefined
  // models the CMA omitting `fields` under a select query (the orphan shape).
  title?: string,
  createdAt = '2026-01-01T00:00:00Z',
  version = 1,
  createdById = 'user-1'
): AssetProps =>
  ({
    sys: {
      id,
      type: 'Asset',
      version,
      space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
      environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
      createdAt,
      createdBy: createdByLink(createdById),
      updatedAt: createdAt,
    },
    ...(title !== undefined ? { fields: { title: { 'en-US': title } } } : {}),
    // Double cast: the mock sys carries only what the scan reads, which does
    // not "sufficiently overlap" with the full AssetProps sys shape.
  } as unknown as AssetProps);

export const makeMockUser = (
  id: string,
  firstName: string,
  lastName: string,
  email = `${id}@example.com`
): UserProps =>
  ({
    sys: { id, type: 'User' },
    firstName,
    lastName,
    email,
  } as UserProps);
