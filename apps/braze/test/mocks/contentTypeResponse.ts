import type { ContentTypeProps } from 'contentful-management';

export function createContentTypeResponse(
  fieldIds: string[],
  type: 'Text' | 'RichText' = 'Text'
): ContentTypeProps {
  return {
    sys: {
      type: 'ContentType',
      id: 'content-type-id',
      version: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
      environment: { sys: { type: 'Link', linkType: 'Environment', id: 'environment-id' } },
    },
    name: 'Test Content Type',
    description: 'Test Description',
    displayField: 'title',
    fields: fieldIds.map((id) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      type,
      localized: true,
      required: true,
      validations: [],
      disabled: false,
      omitted: false,
    })),
  };
}
