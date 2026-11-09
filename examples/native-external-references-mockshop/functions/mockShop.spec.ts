import { FunctionEventContext, FunctionTypeEnum } from '@contentful/node-apps-toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from './mockShop';
import { InstallationParameters, ResourcesLookupHandler } from './types';

const product = {
  id: 'gid://shopify/Product/7982902771734',
  title: "Men's T-shirt",
  featuredImage: { url: 'https://example.com/shirt.jpg', altText: 'A shirt' },
};
const secondProduct = { ...product, id: 'gid://shopify/Product/7983592374294' };
const context: FunctionEventContext<InstallationParameters> = {
  spaceId: 'space',
  environmentId: 'environment',
  appInstallationParameters: { apiEndpoint: 'https://mock.shop/api', url: 'https://mock.shop' },
};

type GraphQLRequest = { query: string; variables: Record<string, string> };

// Mirror the live API: search/products and product(id:) resolve products,
// while nodes(ids:) returns an empty array for those same product IDs.
const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
  const request = JSON.parse(String(init?.body)) as GraphQLRequest;
  if (/nodes\s*\(/.test(request.query)) {
    return new Response(JSON.stringify({ data: { nodes: [] } }));
  }

  const lookups = Array.from(request.query.matchAll(/(\w+):\s*product\(id:\s*\$(\w+)\)/g));
  if (lookups.length > 0) {
    const products = [product, secondProduct];
    const data = Object.fromEntries(
      lookups.map(([, alias, variable]) => [
        alias,
        products.find(({ id }) => id === request.variables[variable]) ?? null,
      ])
    );
    return new Response(JSON.stringify({ data }));
  }

  if (/products\s*\(/.test(request.query)) {
    return new Response(JSON.stringify({ data: { products: { edges: [{ node: product }] } } }));
  }

  if (!request.variables.query) {
    return new Response(
      JSON.stringify({ errors: [{ message: 'Variable $query of type String! was invalid' }] })
    );
  }

  return new Response(JSON.stringify({ data: { search: { edges: [{ node: product }] } } }));
});

const resource = (node: typeof product) => ({
  ...node,
  urn: node.id,
  badge: { variant: 'primary', label: 'it works' },
});

const lookupEvent = (urns: string[]): Parameters<ResourcesLookupHandler>[0] => ({
  type: FunctionTypeEnum.ResourcesLookup,
  resourceType: 'MockShop:Product',
  lookupBy: { urns },
  limit: 3,
});

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('Mock Shop resources.lookup', () => {
  it('resolves selected product URNs in request order using a single request', async () => {
    const result = await handler(lookupEvent([secondProduct.id, product.id]), context);

    expect(result).toEqual({ items: [resource(secondProduct), resource(product)], pages: {} });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as GraphQLRequest;
    expect(request.variables).toEqual({ id0: secondProduct.id, id1: product.id });
    expect(request.query).not.toContain('nodes(');
  });

  it('omits missing products while retaining resolved products', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await handler(lookupEvent(['missing-product', product.id]), context);

    expect(result).toEqual({ items: [resource(product)], pages: {} });
    vi.restoreAllMocks();
  });

  it('returns no items without issuing an invalid GraphQL query for an empty lookup', async () => {
    expect(await handler(lookupEvent([]), context)).toEqual({ items: [], pages: {} });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['cda', 'cpa'])('preserves delivery fields for %s lookup', async (api) => {
    expect(
      await handler(lookupEvent([product.id]), {
        ...context,
        originalRequest: { headers: { 'contentful-api': api } },
      })
    ).toEqual({ items: [resource(product)], pages: {} });

    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as GraphQLRequest;
    for (const field of [
      'description',
      'compareAtPriceRange',
      'adjacentVariants',
      'width',
      'height',
    ]) {
      expect(request.query).toContain(field);
    }
  });

  it('keeps the smaller selection for management lookup', async () => {
    await handler(lookupEvent([product.id]), context);
    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as GraphQLRequest;
    expect(request.query).toContain('featuredImage');
    expect(request.query).not.toContain('description');
    expect(request.query).not.toContain('adjacentVariants');
  });
});

describe('Mock Shop resources.search', () => {
  it.each([undefined, '', '   '])('lists products for an initial query of %j', async (query) => {
    const result = await handler(
      { type: FunctionTypeEnum.ResourcesSearch, resourceType: 'MockShop:Product', limit: 3, query },
      context
    );

    expect(result).toEqual({ items: [resource(product)], pages: {} });
    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as GraphQLRequest;
    expect(request.query).toMatch(/products\s*\(/);
    expect(request.variables).toEqual({});
  });

  it('continues searching with a nonempty query', async () => {
    const result = await handler(
      {
        type: FunctionTypeEnum.ResourcesSearch,
        resourceType: 'MockShop:Product',
        limit: 3,
        query: 'shirt',
      },
      context
    );

    expect(result).toEqual({ items: [resource(product)], pages: {} });
    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as GraphQLRequest;
    expect(request.variables).toEqual({ query: 'shirt' });
    expect(request.query).toMatch(/search\s*\(/);
  });
});
