import type { ContentTypeProps } from 'contentful-management';

type FieldType =
  | 'Symbol'
  | 'Text'
  | 'RichText'
  | 'Integer'
  | 'Number'
  | 'Date'
  | 'Boolean'
  | 'Object'
  | 'Link'
  | 'Location'
  | 'Array';

export function createContentTypeResponse(
  fieldIds: string[],
  type: FieldType = 'Text'
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
    fields: fieldIds.map((id) => {
      const baseField = {
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        localized: true,
        required: true,
        validations: [],
        disabled: false,
        omitted: false,
      };

      switch (type) {
        case 'Link':
          return {
            ...baseField,
            type: 'Link',
            linkType: 'Asset',
          };
        case 'Array':
          return {
            ...baseField,
            type: 'Array',
            items: {
              type: 'Symbol',
            },
          };
        case 'Location':
          return {
            ...baseField,
            type: 'Location',
          };
        default:
          return {
            ...baseField,
            type,
          };
      }
    }),
  };
}
