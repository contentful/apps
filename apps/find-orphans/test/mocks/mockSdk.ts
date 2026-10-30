import { vi } from 'vitest';
import { CmaClient } from '../../src/locations/Page/types';
import { AppInstallationParameters } from '../../src/parameters';

export const createMockSdk = (
  cma: CmaClient,
  installation: Partial<AppInstallationParameters> = {}
) => ({
  cma,
  parameters: {
    installation,
  },
  locales: {
    default: 'en-US',
    available: ['en-US'],
  },
  location: {
    is: vi.fn().mockReturnValue(false),
  },
  navigator: {
    openEntry: vi.fn(),
    openAsset: vi.fn(),
  },
  ids: {
    space: 'space-id',
    environment: 'master',
  },
});

/** SDK mock for the ConfigScreen location (`ConfigAppSDK` surface). */
export const createMockConfigSdk = (storedParameters: unknown = null) => ({
  app: {
    // onConfigure registers the save callback; the test grabs it from
    // mock.calls to simulate the user clicking "Save".
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockResolvedValue(storedParameters),
    getCurrentState: vi.fn().mockResolvedValue({ EditorInterface: {} }),
    setReady: vi.fn(),
  },
  notifier: {
    error: vi.fn(),
  },
});
