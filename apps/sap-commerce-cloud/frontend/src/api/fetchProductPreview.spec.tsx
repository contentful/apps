import { vi } from 'vitest';
import { fetchProductPreviews } from './fetchProductPreviews';

const originalFetch = global.fetch;
describe('fetchProductPreviews', () => {
  afterAll(() => {
    global.fetch = originalFetch;
  });
  it('should fetch product previews', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(),
        ok: true,
        text: () => Promise.resolve(''),
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        redirected: false,
        type: 'basic' as ResponseType,
        url: '',
        clone: () => new Response(),
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
      })
    );
    const productPreviews = await fetchProductPreviews(['1', '2'], {
      installation: {
        apiEndpoint: 'http://localhost:9002',
        baseSites: 'electronics-spa',
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
          apiEndpoint: 'http://localhost:9002',
          baseSites: 'electronics-spa',
        },
        instance: 'electronics',
        invocation: '123',
      })
    ).rejects.toThrow();
  });
});
