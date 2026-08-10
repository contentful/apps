import { describe, expect, it, vi, beforeEach } from 'vitest';
import { handler } from './index';

const installationParameters = {
  clientId: 'client-id',
  clientSecret: 'client-secret',
  organizationId: 'f_ecom_zzte_053',
  shortCode: 'abcd1234',
  siteId: 'RefArchGlobal',
};

function mockContext() {
  return { appInstallationParameters: installationParameters } as any;
}

function mockTokenResponse() {
  return { ok: true, json: async () => ({ access_token: 'test-token' }) } as Response;
}

// Simulates the kind of full SFCC representation that triggers max-response-size-exceeded:
// a couple of fields the UI actually renders, plus some nested data it never reads.
function bulkyProduct(id: string) {
  return {
    id,
    name: { default: `Product ${id}` },
    image: { absUrl: `https://example.com/${id}.jpg`, alt: { default: 'alt text' } },
    shortDescription: { default: { markup: 'x'.repeat(50_000) } },
    variations: new Array(50).fill({ some: 'nested variation data the UI never reads' }),
  };
}

function bulkyCategory(id: string) {
  return {
    id,
    catalogId: 'catalog-1',
    name: { default: `Category ${id}` },
    pageDescription: { default: 'y'.repeat(50_000) },
    paths: new Array(50).fill({ id: 'catalog-1', name: { default: 'Catalog One' } }),
  };
}

describe('sfccApi function handler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('trims searchProducts hits to id/name/image', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('dwsso/oauth2/access_token')) return mockTokenResponse();
      if (url.includes('/product-search')) {
        expect(url).not.toContain('limit=');
        return { ok: true, json: async () => ({ hits: [bulkyProduct('prod-1')] }) } as Response;
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result: any = await handler(
      { body: { type: 'searchProducts', query: 'test' } } as any,
      mockContext()
    );

    expect(result.ok).toBe(true);
    expect(result.data).toEqual([
      {
        id: 'prod-1',
        name: { default: 'Product prod-1' },
        image: { absUrl: 'https://example.com/prod-1.jpg', alt: { default: 'alt text' } },
      },
    ]);
    expect(Buffer.byteLength(JSON.stringify(result.data))).toBeLessThan(1000);
  });

  it('trims searchCategories hits to id/catalogId/name', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('dwsso/oauth2/access_token')) return mockTokenResponse();
      if (url.includes('/category-search')) {
        expect(url).not.toContain('limit=');
        return { ok: true, json: async () => ({ hits: [bulkyCategory('cat-1')] }) } as Response;
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result: any = await handler(
      { body: { type: 'searchCategories', query: 'test' } } as any,
      mockContext()
    );

    expect(result.ok).toBe(true);
    expect(result.data).toEqual([
      { id: 'cat-1', catalogId: 'catalog-1', name: { default: 'Category cat-1' } },
    ]);
    expect(Buffer.byteLength(JSON.stringify(result.data))).toBeLessThan(1000);
  });

  it('trims fetchProduct response to id/name/image', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('dwsso/oauth2/access_token')) return mockTokenResponse();
      if (url.includes('/products/prod-1')) {
        return { ok: true, json: async () => bulkyProduct('prod-1') } as Response;
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result: any = await handler(
      { body: { type: 'fetchProduct', productId: 'prod-1' } } as any,
      mockContext()
    );

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      id: 'prod-1',
      name: { default: 'Product prod-1' },
      image: { absUrl: 'https://example.com/prod-1.jpg', alt: { default: 'alt text' } },
    });
  });

  it('trims fetchCategory response to id/catalogId/name', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('dwsso/oauth2/access_token')) return mockTokenResponse();
      if (url.includes('/categories/cat-1')) {
        return { ok: true, json: async () => bulkyCategory('cat-1') } as Response;
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result: any = await handler(
      { body: { type: 'fetchCategory', catalogId: 'catalog-1', categoryId: 'cat-1' } } as any,
      mockContext()
    );

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      id: 'cat-1',
      catalogId: 'catalog-1',
      name: { default: 'Category cat-1' },
    });
  });
});
