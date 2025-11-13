import { vi } from 'vitest';
import { AppInstallationParameters } from '../../src/utils/types';
import { mockCma } from './mockCma';

export const createMockSdk = (overrides?: any) => {
  const baseMockSdk: any = {
    app: {
      onConfigure: vi.fn(),
      getParameters: vi.fn().mockResolvedValue(null),
      setReady: vi.fn(),
      getCurrentState: vi.fn().mockResolvedValue({}),
    },
    ids: {
      app: 'test-app',
    space: 'test-space',
    environment: 'test-environment',
    entry: 'current-entry-id',
    contentType: 'test-content-type-id',
  },
    field: {
      getValue: vi.fn().mockReturnValue(''),
      setValue: vi.fn().mockResolvedValue(undefined),
      onValueChanged: vi.fn(),
      removeValue: vi.fn(),
    },
    entry: {
      getSys: vi.fn().mockReturnValue({
        id: 'current-entry-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    },
    contentType: {
      sys: {
        id: 'test-content-type-id',
      },
    },
    locales: {
      default: 'en-US',
      available: ['en-US', 'es-ES'],
      names: {
        'en-US': 'English',
        'es-ES': 'Spanish',
      },
    },
    parameters: {
      installation: {
        sourceFieldId: 'title',
        separator: '-',
        overrides: [],
      } as AppInstallationParameters,
    },
    cma: mockCma,
  };

  return overrides ? { ...baseMockSdk, ...overrides } : baseMockSdk;
};

export const mockSdk = createMockSdk();
