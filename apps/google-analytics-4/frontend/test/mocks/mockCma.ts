const mockCma: any = {
  appSignedRequest: {
    create: () =>
      Promise.resolve({
        additionalHeaders: 'lol',
        'X-Contentful-ServiceAccountKeyId':
          'eyJpZCI6IlBSSVZBVEVfS0VZX0lEIiwiY2xpZW50SWQiOiJDTElFTlRfSUQiLCJjbGllbnRFbWFpbCI6IkNMSUVOVF9JRCIsInByb2plY3RJZCI6IlBST0pFQ1RfSUQifQ==',
      }),
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
