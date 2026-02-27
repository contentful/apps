import { vi } from 'vitest';
import type { PageAppSDK, ConfigAppSDK } from '@contentful/app-sdk';
import { createMockCMA } from './mockCma';

export const createMockSDK = (
  overrides?: Partial<PageAppSDK | ConfigAppSDK>
): PageAppSDK | ConfigAppSDK => {
  const mockCMA = createMockCMA();

  const mockApp = {
    onConfigure: vi.fn(),
    onConfigurationCompleted: vi.fn(),
    getParameters: vi.fn().mockReturnValue({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  };

  const mockNotifier = {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  };

  const mockNavigator = {
    openCurrentAppPage: vi.fn().mockResolvedValue({ navigated: true, path: '' }),
    openPageExtension: vi.fn().mockResolvedValue({ navigated: true, path: '' }),
    openEntry: vi.fn(),
    openAsset: vi.fn(),
    openNewEntry: vi.fn(),
    openNewAsset: vi.fn(),
    openAppConfig: vi.fn(),
  };

  return {
    cma: mockCMA as any,
    ids: {
      space: 'test-space-id',
      environment: 'test-environment-id',
      app: 'test-app',
      ...overrides?.ids,
    },
    app: mockApp as any,
    notifier: mockNotifier as any,
    navigator: mockNavigator as any,
    ...overrides,
  } as unknown as PageAppSDK | ConfigAppSDK;
};

const mockSdk: any = createMockSDK();

export { mockSdk };
