import type { PlainClientAPI } from 'contentful-management';
import type { FunctionEventContext } from '@contentful/node-apps-toolkit';
import { vi } from 'vitest';

export const mockCma = {
  entry: { get: vi.fn() },
  contentType: { get: vi.fn() },
} as unknown as PlainClientAPI;

export const mockContext: FunctionEventContext = {
  spaceId: 'space-id',
  environmentId: 'environment-id',
  appInstallationParameters: {
    brazeApiKey: 'test-api-key',
    brazeEndpoint: 'https://test.braze.com',
  },
  cmaClientOptions: {
    accessToken: 'test-token',
  },
};

export function mockFetchSuccess(responseData: object) {
  vi.mocked(global.fetch).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(responseData),
  } as Response);
}
