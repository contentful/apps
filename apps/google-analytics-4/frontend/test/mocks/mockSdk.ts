const mockSdk: any = {
  app: {
    onConfigure: jest.fn(),
    getParameters: jest.fn().mockReturnValueOnce({}),
    setReady: jest.fn(),
    getCurrentState: jest.fn(),
    isInstalled: jest.fn(),
    onConfigurationCompleted: jest.fn(),
  },
  cma: {
    appSignedRequest: {
      create: () => ({}),
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
  },
  ids: {
    app: 'test-app',
    user: 'user-id',
  },
  notifier: {
    error: jest.fn(),
  },
  parameters: {
    installation: {},
    instance: {},
  },
  location: {
    is: jest.fn().mockReturnValue(true),
  },
  contentType: {
    name: 'Category',
  },
};

export { mockSdk };
