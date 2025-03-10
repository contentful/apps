const mockCma: any = {
  entry: {
    references: () => ({
      items: [
        {
          fields: {
            someValue: { 'en-US': 'value' },
            someLink: { 'en-US': { sys: { type: 'Link', linkType: 'Entry', id: 'suchId' } } },
          },
          sys: {
            contentType: {
              sys: {
                id: 'anId',
              },
            },
          },
        },
      ],
      includes: {
        Entry: [
          {
            sys: { type: 'Entry', id: 'suchId', contentType: { sys: { id: 'id' } } },
            fields: {
              otherField: 'field',
            },
          },
        ],
      },
    }),
  },
  contentType: {
    get: () => ({
      fields: [
        {
          id: 'someValue',
          name: 'someValue',
          type: 'Symbol',
        },
        {
          id: 'someLink',
          name: 'someLink',
          type: 'Link',
          linkType: 'Entry',
        },
        {
          id: 'otherField',
          name: 'otherField',
          type: 'Symbol',
        },
      ],
    }),
  },
};

export { mockCma };
