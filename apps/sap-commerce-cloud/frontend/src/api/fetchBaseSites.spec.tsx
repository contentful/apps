import { vi } from 'vitest';
import { fetchBaseSites } from './fetchBaseSites';

const originalFetch = global.fetch;
describe('fetchBaseSites', () => {
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('should fetch base sites', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            baseSites: [{ uid: 'electronics-spa' }],
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
    const baseSites = await fetchBaseSites({
      installation: {
        apiEndpoint: 'http://localhost:9002',
        baseSites: 'electronics-spa',
      },
      instance: 'electronics',
      invocation: '123',
    });
    expect(baseSites).toEqual(['electronics-spa']);
  });

  it('should throw an error if the request fails', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Failed to fetch')));
    await expect(
      fetchBaseSites({
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
