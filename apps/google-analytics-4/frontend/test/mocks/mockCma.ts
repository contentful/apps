const mockCma: any = {
  appSignedRequest: {
    create: () => Promise.resolve({ additionalHeaders: 'lol' }),
  },
  getSpace: () => ({
    getEnvironment: () => ({
      getContentTypes: () => ({
        description:
          'A series of lessons designed to teach sets of concepts that enable students to master Contentful.',
        displayField: 'title',
        name: 'Course',
        fields: [
          {
            course: {
              disabled: false,
              id: 'title',
              localized: true,
              name: 'Title',
              omitted: false,
              required: true,
              type: 'Symbol',
            },
          },
        ],
      }),
    }),
  }),
};

export { mockCma };
