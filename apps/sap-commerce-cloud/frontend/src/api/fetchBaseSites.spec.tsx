import { vi } from 'vitest';
import { fetchBaseSites } from './fetchBaseSites';
import { mockApiEndpoint, mockBaseSite, mockFetch } from '../__mocks__/';

const originalFetch = global.fetch;
describe('fetchBaseSites', () => {
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('should fetch base sites', async () => {
    global.fetch = mockFetch({ baseSites: [{ uid: mockBaseSite }] });
    const baseSites = await fetchBaseSites({
      installation: {
        apiEndpoint: mockApiEndpoint,
        baseSites: mockBaseSite,
      },
      instance: 'electronics',
      invocation: '123',
    });
    expect(baseSites).toEqual([mockBaseSite]);
  });

  it('should throw an error if the request fails', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Failed to fetch')));
    await expect(
      fetchBaseSites({
        installation: {
          apiEndpoint: mockApiEndpoint,
          baseSites: mockBaseSite,
        },
        instance: 'electronics',
        invocation: '123',
      })
    ).rejects.toThrow();
  });
});
