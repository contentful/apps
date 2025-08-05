import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn().mockImplementation((callback: () => Promise<any>) => {
      mockSdk.app.onConfigureCallback = callback;
    }),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
    onConfigureCallback: null as (() => Promise<any>) | null,
  },
  ids: {
    app: 'test-app',
    space: 'test-space',
    environment: 'test-environment',
  },
  cma: {
    contentType: {
      getMany: vi.fn().mockResolvedValue({
        items: [],
        total: 0,
      }),
      get: vi.fn().mockResolvedValue({
        sys: { id: 'test-content-type' },
        name: 'Test Content Type',
        fields: [
          { id: 'title', name: 'Title', type: 'Text' },
          { id: 'content', name: 'Content', type: 'RichText' },
        ],
      }),
    },
  },
  notifier: {
    error: vi.fn(),
  },
};

export { mockSdk };
