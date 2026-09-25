import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockResolvedValue(null),
    setReady: vi.fn(),
    getCurrentState: vi.fn().mockResolvedValue({}),
  },
  ids: {
    app: 'test-app',
  },
  notifier: {
    error: vi.fn(),
    success: vi.fn(),
  },
  field: {
    getValue: vi.fn().mockReturnValue(null),
    setValue: vi.fn().mockResolvedValue(undefined),
    removeValue: vi.fn().mockResolvedValue(undefined),
    onValueChanged: vi.fn().mockReturnValue(() => {}),
  },
  window: {
    startAutoResizer: vi.fn(),
    stopAutoResizer: vi.fn(),
    updateHeight: vi.fn(),
  },
  dialogs: {
    openCurrentApp: vi.fn().mockResolvedValue(null),
  },
  parameters: {
    installation: { enabledWeights: ['regular', 'bold', 'fill'] },
    invocation: {},
  },
  close: vi.fn(),
};

export { mockSdk };
