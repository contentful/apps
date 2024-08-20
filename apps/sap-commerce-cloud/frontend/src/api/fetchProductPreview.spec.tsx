import { vi } from 'vitest';
import { fetchProductPreviews } from './fetchProductPreviews';
import { mockApiEndpoint, mockBaseSite, mockFetch } from '../__mocks__';

const originalFetch = global.fetch;
describe('fetchProductPreviews', () => {
  afterAll(() => {
    global.fetch = originalFetch;
  });
  it('should fetch product previews', async () => {
    global.fetch = mockFetch({});
    const productPreviews = await fetchProductPreviews(['1', '2'], {
      installation: {
        apiEndpoint: mockApiEndpoint,
        baseSites: mockBaseSite,
      },
      instance: 'electronics',
      invocation: '123',
    });
    expect(productPreviews).toEqual([
      {
        id: '',
        image: '',
        name: '',
        productUrl: '',
        sku: '',
      },
      {
        id: '',
        image: '',
        name: '',
        productUrl: '',
        sku: '',
      },
      {
        id: '',
        image: '',
        isMissing: true,
        name: '',
        productUrl: '1',
        sku: '1',
      },
      {
        id: '',
        image: '',
        isMissing: true,
        name: '',
        productUrl: '2',
        sku: '2',
      },
    ]);
  });
  it('should throw an error if the request fails', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Failed to fetch')));
    await expect(
      fetchProductPreviews(['1', '2'], {
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
