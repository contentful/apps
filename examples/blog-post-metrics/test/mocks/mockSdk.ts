import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    app: 'test-app',
  },
  entry: {
    fields: {
      body: {
        getValue: vi.fn().mockReturnValueOnce('Hello Entry Field Component (AppId: test-app)'),
        onValueChanged: vi.fn().mockReturnValueOnce(() => {}),
      },
    },
  },
};

export { mockSdk };
