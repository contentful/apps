import { vi } from 'vitest';
import { fetchProductList } from './fetchProductList';

const originalFetch = global.fetch;
describe('fetchProductList', () => {
  afterAll(() => {
    global.fetch = originalFetch;
  });
  it('should fetch product list', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            pagination: { totalPages: 1 },
            products: [{ id: '123' }],
          }),
        ok: true,
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
        text: () => Promise.resolve(''),
      })
    );
    const response = await fetchProductList(
      'electronics-spa',
      'product',
      1,
      {
        installation: {
          apiEndpoint: 'http://localhost:9002',
          baseSites: 'electronics-spa',
        },
        instance: 'electronics',
        invocation: '123',
      },
      () => {}
    );
    expect(response.products).toEqual([
      {
        id: '123',
        image: '',
        name: '',
        productUrl: 'http://localhost:9002/occ/v2/electronics-spa/products/',
        sku: '',
      },
    ]);
  });

  it('should throw an error if the request fails', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Failed to fetch')));
    await expect(
      fetchProductList(
        'electronics-spa',
        'product',
        1,
        {
          installation: {
            apiEndpoint: 'http://localhost:9002',
            baseSites: 'electronics-spa',
          },
          instance: 'electronics',
          invocation: '123',
        },
        () => {}
      )
    ).rejects.toThrow();
  });

  it('should return an empty array if base site is not provided', async () => {
    const response = await fetchProductList(
      '',
      'product',
      1,
      {
        installation: {
          apiEndpoint: 'http://localhost:9002',
          baseSites: 'electronics-spa',
        },
        instance: 'electronics',
        invocation: '123',
      },
      () => {}
    );
    expect(response.products).toEqual([]);
  });

  it('should return an empty array if no products are found', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            pagination: { totalPages: 1 },
            products: [],
          }),
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        redirected: false,
        type: 'basic' as ResponseType,
        url: '',
        text: () => Promise.resolve(''),
        clone: () => new Response(),
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
      })
    );
    const response = await fetchProductList(
      'electronics-spa',
      'product',
      1,
      {
        installation: {
          apiEndpoint: 'http://localhost:9002',
          baseSites: 'electronics-spa',
        },
        instance: 'electronics',
        invocation: '123',
      },
      () => {}
    );
    expect(response.products).toEqual([]);
  });
});
