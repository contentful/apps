import { vi } from 'vitest';

export const sdk: any = {
  ids: {
    space: 'test-space',
    environment: 'master',
    user: '123',
  },
  app: {
    setReady: vi.fn(),
    isInstalled: vi.fn().mockReturnValue(Promise.resolve(false)),
    getParameters: vi.fn().mockReturnValue(Promise.resolve(null)),
    onConfigure: vi.fn(),
  },
  space: {
    getContentTypes: vi.fn().mockReturnValue(Promise.resolve([])),
    getEditorInterfaces: vi.fn().mockResolvedValue({ items: [] }),
  },
  notifier: {
    error: vi.fn(),
  },
  window: {
    startAutoResizer: vi.fn(),
  },
  field: {
    getValue: vi.fn().mockReturnValue('field-value'),
    setValue: vi.fn(),
    removeValue: vi.fn(),
  },
  parameters: {
    installation: {
      workspaceId: 'mock-workspace-id',
      accessToken: 'mock-access-token',
    },
  },
};
