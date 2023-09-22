import { ContentTypeProps } from 'contentful-management';
import {
  generateEditorInterfaceAssignments,
  sortAndFormatAllContentTypes,
} from './contentTypeHelpers';

const mockContentTypeItems: ContentTypeProps[] = [
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'abc123',
        },
      },
      id: 'layout',
      type: 'ContentType',
      createdAt: '2023-01-18T01:12:58.781Z',
      updatedAt: '2023-03-14T21:34:26.800Z',
      environment: {
        sys: {
          id: 'abc123',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      version: 4,
    },
    displayField: 'title',
    name: 'Layout',
    description: '',
    fields: [
      {
        id: 'title',
        name: 'Title',
        type: 'Symbol',
        localized: false,
        required: true,
      },
      {
        id: 'slug',
        name: 'Slug',
        type: 'Symbol',
        localized: false,
        required: true,
      },
      {
        id: 'duration',
        name: 'Duration',
        type: 'Integer',
        localized: false,
        required: false,
      },
      {
        id: 'tags',
        name: 'Tags',
        type: 'Array',
        localized: false,
        required: false,
        items: { type: 'Symbol' },
      },
    ],
  },
];

describe('contentTypeHelpers', () => {
  it('generates editor interface assignments', () => {
    const result = generateEditorInterfaceAssignments({}, ['course'], 'sidebar', 1);

    expect(result).toEqual(expect.objectContaining({ course: { sidebar: { position: 1 } } }));
  });

  it('sorts and formats all content types', () => {
    const result = sortAndFormatAllContentTypes(mockContentTypeItems);
    const fields = result['layout'].fields;

    expect(Object.keys(result).length).toEqual(1);
    // Fields that are not short text or short text list should be removed
    expect(fields.length).toEqual(3);
    // Fields should be sorted alphabetically
    expect(fields[0].id).toEqual('slug');
  });
});
