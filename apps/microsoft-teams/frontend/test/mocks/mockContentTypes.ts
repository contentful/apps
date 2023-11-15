const mockContentType = {
  sys: {
    space: {
      sys: {
        type: 'Link',
        linkType: 'Space',
        id: 'abc123',
      },
    },
    id: 'page',
    type: 'ContentType',
    createdAt: '2023-03-27T18:48:05.440Z',
    updatedAt: '2023-08-16T15:56:07.990Z',
    environment: {
      sys: {
        id: 'testing',
        type: 'Link',
        linkType: 'Environment',
      },
    },
    publishedVersion: 49,
    publishedAt: '2023-08-16T15:56:07.990Z',
    firstPublishedAt: '2023-03-27T18:48:05.757Z',
    createdBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: '456',
      },
    },
    updatedBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: '456',
      },
    },
    publishedCounter: 25,
    version: 50,
    publishedBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: '456',
      },
    },
  },
  displayField: 'title',
  name: 'Page',
  description: '',
  fields: [
    {
      id: 'title',
      name: 'Title',
      type: 'Symbol',
      localized: true,
      required: true,
      validations: [
        {
          size: {
            min: 40,
            max: 60,
          },
        },
      ],
      disabled: false,
      omitted: false,
    },
    {
      id: 'slug',
      name: 'Slug',
      type: 'Symbol',
      localized: true,
      required: true,
      validations: [
        {
          unique: true,
        },
      ],
      disabled: false,
      omitted: false,
    },
  ],
};

const mockGetManyContentType = {
  items: [mockContentType],
  limit: 100,
  skip: 100,
  sys: {
    type: 'Array',
  },
  total: 1,
};

export { mockContentType, mockGetManyContentType };
