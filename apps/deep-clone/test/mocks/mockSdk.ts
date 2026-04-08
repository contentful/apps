import { vi } from 'vitest';
import { mockCma } from './mockCma';

const mockSdk = {
  cma: mockCma,
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn(),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    entry: 'test-entry',
    space: 'test-space',
    organization: 'test-organization',
    app: 'test-app',
  },
  parameters: {
    installation: {
      cloneText: 'Copy',
      cloneTextBefore: true,
      automaticRedirect: true,
    },
    invocation: undefined,
  },
  entry: {
    save: vi.fn(),
  },
  notifier: {
    success: vi.fn(),
    error: vi.fn(),
  },
  navigator: {
    openEntry: vi.fn(),
  },
  close: vi.fn(),
  dialogs: {
    openConfirm: vi.fn().mockResolvedValue(true),
    openCurrentApp: vi.fn().mockResolvedValue(['test-entry', 'referenced-entry-id']),
  },
};

export { mockSdk };
