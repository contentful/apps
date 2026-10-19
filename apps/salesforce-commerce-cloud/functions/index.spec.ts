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

  it('scopes product search to the field site and includes variants when asked', async () => {
    const bodies: unknown[] = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('dwsso/oauth2/access_token')) return mockTokenResponse();
      if (url.includes('/product-search')) {
        expect(url).toContain('siteId=OtherSite');
        bodies.push(JSON.parse(init?.body as string));
        return { ok: true, json: async () => ({ hits: [] }) } as Response;
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await handler(
      {
        body: { type: 'searchProducts', siteId: 'OtherSite', includeVariants: true },
      } as any,
      mockContext()
    );

    expect(JSON.stringify(bodies[0])).toContain('"values":["master","variant"]');
  });

  it('returns preview fields used for status badges on fetchProduct', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('dwsso/oauth2/access_token')) return mockTokenResponse();
      return {
        ok: true,
        json: async () => ({
          ...bulkyProduct('prod-1'),
          price: 19.99,
          priceCurrency: 'USD',
          online: false,
          inStock: true,
          ats: 4,
          type: { variant: true, master: false },
          variationValues: { color: 'Red' },
        }),
      } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    const result: any = await handler(
      { body: { type: 'fetchProduct', productId: 'prod-1' } } as any,
      mockContext()
    );

    expect(result.data).toMatchObject({
      price: 19.99,
      priceCurrency: 'USD',
      online: false,
      inStock: true,
      ats: 4,
      isVariant: true,
      variationValues: { color: 'Red' },
    });
  });

  it('only requests the extra scope a resource needs', async () => {
    const scopes: string[] = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('dwsso/oauth2/access_token')) {
        scopes.push(new URLSearchParams(init?.body as string).get('scope') ?? '');
        return mockTokenResponse();
      }
      return { ok: true, json: async () => ({ hits: [] }) } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    await handler({ body: { type: 'searchProducts' } } as any, mockContext());
    await handler(
      { body: { type: 'searchResource', resource: 'promotion' } } as any,
      mockContext()
    );

    expect(scopes[0]).not.toContain('sfcc.promotions');
    expect(scopes[1]).toContain('sfcc.promotions');
  });

  it.each([
    ['customerGroup', '/customer/customers/v1/organizations/f_ecom_zzte_053/customer-group-search'],
    ['promotion', '/pricing/promotions/v1/organizations/f_ecom_zzte_053/promotions'],
    ['campaign', '/pricing/campaigns/v1/organizations/f_ecom_zzte_053/campaigns'],
    ['coupon', '/pricing/coupons/v1/organizations/f_ecom_zzte_053/coupons'],
    ['store', '/store/stores/v1/organizations/f_ecom_zzte_053/store-search'],
  ])('searches %s via its admin search endpoint', async (resource, path) => {
    let body: any;
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('dwsso/oauth2/access_token')) return mockTokenResponse();
      expect(url).toBe(
        `https://abcd1234.api.commercecloud.salesforce.com${path}?siteId=RefArchGlobal`
      );
      body = JSON.parse(init?.body as string);
      return { ok: true, json: async () => ({ hits: [] }) } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    const result: any = await handler(
      { body: { type: 'searchResource', resource } } as any,
      mockContext()
    );

    expect(result).toEqual({ ok: true, data: { items: [] } });
    expect(body.query).toEqual({ matchAllQuery: {} });
  });

  it('returns continuation offsets and retrieves resources beyond the first 50 hits', async () => {
    const groups = Array.from({ length: 51 }, (_, index) => ({ id: `group-${index}` }));
    const offsets: number[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('dwsso/oauth2/access_token')) return mockTokenResponse();
        const body = JSON.parse(String(init?.body)) as { offset: number; limit: number };
        offsets.push(body.offset);
        return {
          ok: true,
          json: async () => ({
            hits: groups.slice(body.offset, body.offset + body.limit),
            total: groups.length,
          }),
        } as Response;
      })
    );

    const first = await handler(
      { body: { type: 'searchResource', resource: 'customerGroup' } } as Parameters<
        typeof handler
      >[0],
      mockContext()
    );
    const last = await handler(
      { body: { type: 'searchResource', resource: 'customerGroup', offset: 50 } } as Parameters<
        typeof handler
      >[0],
      mockContext()
    );

    expect(first).toMatchObject({ ok: true, data: { nextOffset: 50 } });
    expect(last).toEqual({ ok: true, data: { items: [{ id: 'group-50' }] } });
    expect(offsets).toEqual([0, 50]);
  });

  it('does not offer another page when exactly 50 results exhaust the search', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('dwsso/oauth2/access_token')) return mockTokenResponse();
        return {
          ok: true,
          json: async () => ({
            hits: Array.from({ length: 50 }, (_, index) => ({ id: `store-${index}` })),
            total: 50,
          }),
        } as Response;
      })
    );

    const result = await handler(
      { body: { type: 'searchResource', resource: 'store' } } as Parameters<typeof handler>[0],
      mockContext()
    );
    expect(result).toMatchObject({ ok: true });
    expect(result).not.toHaveProperty('data.nextOffset');
  });

  it('searches campaigns by ID without a disjunction across ID and description', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('dwsso/oauth2/access_token')) return mockTokenResponse();
        const body = JSON.parse(String(init?.body)) as { query: unknown };
        expect(body.query).toEqual({
          textQuery: { fields: ['campaignId'], searchPhrase: 'summer' },
        });
        return {
          ok: true,
          json: async () => ({ hits: [{ campaignId: 'summer-sale' }], total: 1 }),
        } as Response;
      })
    );

    const result = await handler(
      { body: { type: 'searchResource', resource: 'campaign', query: 'summer' } } as Parameters<
        typeof handler
      >[0],
      mockContext()
    );
    expect(result).toMatchObject({ ok: true, data: { items: [{ id: 'summer-sale' }] } });
  });

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid search offset %s',
    async (offset) => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      const result = await handler(
        { body: { type: 'searchResource', resource: 'store', offset } } as Parameters<
          typeof handler
        >[0],
        mockContext()
      );
      expect(result).toMatchObject({ ok: false, error: { type: 'ValidationError' } });
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it('summarises campaigns and coupons with their status fields', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('dwsso/oauth2/access_token')) return mockTokenResponse();
      if (url.includes('/campaigns/summer')) {
        return {
          ok: true,
          json: async () => ({
            campaignId: 'summer',
            description: 'Summer sale',
            enabled: true,
            startDate: '2026-06-01T00:00:00Z',
            endDate: '2026-08-31T00:00:00Z',
            coupons: new Array(50).fill('coupon'),
          }),
        } as Response;
      }
      if (url.includes('/coupons/SAVE10')) {
        return {
          ok: true,
          json: async () => ({
            couponId: 'SAVE10',
            enabled: false,
            type: 'single_code',
            singleCode: 'SAVE10NOW',
          }),
        } as Response;
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const campaign: any = await handler(
      { body: { type: 'fetchResource', resource: 'campaign', resourceId: 'summer' } } as any,
      mockContext()
    );
    const coupon: any = await handler(
      { body: { type: 'fetchResource', resource: 'coupon', resourceId: 'SAVE10' } } as any,
      mockContext()
    );

    expect(campaign.data).toEqual({
      id: 'summer',
      description: 'Summer sale',
      enabled: true,
      startDate: '2026-06-01T00:00:00Z',
      endDate: '2026-08-31T00:00:00Z',
    });
    expect(coupon.data).toMatchObject({
      id: 'SAVE10',
      enabled: false,
      couponType: 'single_code',
      code: 'SAVE10NOW',
    });
  });

  it('fetches customer groups by exact id through search', async () => {
    let body: any;
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('dwsso/oauth2/access_token')) return mockTokenResponse();
      body = JSON.parse(init?.body as string);
      if (body.query.termQuery.values[0] !== 'vip') {
        return { ok: false, status: 400, text: async () => 'no matching group' } as Response;
      }
      return {
        ok: true,
        json: async () => ({ hits: [{ id: 'vip', type: 'static' }] }),
      } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    const found: any = await handler(
      { body: { type: 'fetchResource', resource: 'customerGroup', resourceId: 'vip' } } as any,
      mockContext()
    );
    const missing: any = await handler(
      { body: { type: 'fetchResource', resource: 'customerGroup', resourceId: 'nope' } } as any,
      mockContext()
    );

    expect(found.data).toMatchObject({ id: 'vip', groupType: 'static' });
    expect(missing).toEqual({ ok: false, error: { type: 'NotFound', message: 'Item not found' } });
  });

  it('reports a 404 as NotFound and rejects unknown resources', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('dwsso/oauth2/access_token')) return mockTokenResponse();
      return { ok: false, status: 404, text: async () => 'missing' } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    const notFound: any = await handler(
      { body: { type: 'fetchResource', resource: 'store', resourceId: 'gone' } } as any,
      mockContext()
    );
    const unknown: any = await handler(
      { body: { type: 'searchResource', resource: 'orders' } } as any,
      mockContext()
    );

    expect(notFound.error.type).toBe('NotFound');
    expect(unknown.error.type).toBe('UnknownAction');
  });

  it.each(['constructor', 'toString', '__proto__', 'hasOwnProperty'])(
    'rejects inherited object key %s as an unknown resource before requesting a token',
    async (resource) => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      const result = await handler(
        { body: { type: 'fetchResource', resource, resourceId: 'x' } } as any,
        mockContext()
      );
      expect(result).toMatchObject({ ok: false, error: { type: 'UnknownAction' } });
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it('falls back to a full page heuristic when a search response omits total', async () => {
    const respond = (count: number) =>
      vi.fn(async (url: string) => {
        if (url.includes('dwsso/oauth2/access_token')) return mockTokenResponse();
        return {
          ok: true,
          json: async () => ({
            hits: Array.from({ length: count }, (_, index) => ({ id: `promo-${index}` })),
          }),
        } as Response;
      });

    vi.stubGlobal('fetch', respond(50));
    const full = await handler(
      { body: { type: 'searchResource', resource: 'promotion' } } as any,
      mockContext()
    );
    vi.stubGlobal('fetch', respond(10));
    const partial = await handler(
      { body: { type: 'searchResource', resource: 'promotion' } } as any,
      mockContext()
    );

    expect(full).toMatchObject({ ok: true, data: { nextOffset: 50 } });
    expect(partial).toMatchObject({ ok: true });
    expect(partial).not.toHaveProperty('data.nextOffset');
  });

  it('filters category search by the field catalog override', async () => {
    let searchBody: any;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('dwsso/oauth2/access_token')) return mockTokenResponse();
        searchBody = JSON.parse(String(init?.body));
        return { ok: true, json: async () => ({ hits: [] }) } as Response;
      })
    );

    await handler(
      { body: { type: 'searchCategories', catalogId: 'brand-b' } } as any,
      mockContext()
    );

    expect(searchBody.query.boolQuery.must).toContainEqual({
      termQuery: { fields: ['catalogId'], operator: 'is', values: ['brand-b'] },
    });
  });

  it('reports non-404 API failures as ApiError and token failures as AuthError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('dwsso/oauth2/access_token')) return mockTokenResponse();
        return { ok: false, status: 500, text: async () => 'boom' } as Response;
      })
    );
    const apiError = await handler(
      { body: { type: 'fetchResource', resource: 'promotion', resourceId: 'p' } } as any,
      mockContext()
    );

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 401, text: async () => 'denied' } as Response))
    );
    const authError = await handler(
      { body: { type: 'searchProducts', query: 'shoe' } } as any,
      mockContext()
    );

    expect(apiError).toMatchObject({ ok: false, error: { type: 'ApiError' } });
    expect(authError).toMatchObject({ ok: false, error: { type: 'AuthError' } });
  });
});
