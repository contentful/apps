import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
    isInstalled: vi.fn(),
    onConfigurationCompleted: vi.fn(),
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
    error: vi.fn(),
  },
  parameters: {
    installation: {},
    instance: {},
  },
  location: {
    is: vi.fn().mockReturnValue(true),
  },
  contentType: {
    name: 'Category',
  },
};

export { mockSdk };
