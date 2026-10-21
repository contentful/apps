import { BaseAppSDK, CMAClient } from '@contentful/app-sdk';
import { describe, expect, it, vi } from 'vitest';
import SfccClient from './Sfcc';
import manifest from '../../contentful-app-manifest.json';

describe('SfccClient search pages', () => {
  const ids = { app: 'app', space: 'space', environment: 'master' } as BaseAppSDK['ids'];

  it('forwards the page offset and site to the App Action and preserves continuation data', async () => {
    const page = { items: [{ id: 'store-51' }], nextOffset: 100 };
    const createWithResponse = vi.fn().mockResolvedValue({
      response: { body: JSON.stringify({ ok: true, data: page }) },
    });
    const cma = { appActionCall: { createWithResponse } } as unknown as CMAClient;
    const client = new SfccClient(cma, ids, { siteId: 'OtherSite' });

    expect(await client.search('store', 'US', 50)).toEqual(page);
    expect(createWithResponse).toHaveBeenCalledWith(expect.anything(), {
      parameters: {
        type: 'searchResource',
        resource: 'store',
        query: 'US',
        offset: 50,
        siteId: 'OtherSite',
      },
    });
  });

  it.each(['product', 'category'] as const)(
    'keeps the existing %s search response compatible',
    async (type) => {
      const items = [{ id: 'item' }];
      const createWithResponse = vi.fn().mockResolvedValue({
        response: { body: JSON.stringify({ ok: true, data: items }) },
      });
      const cma = { appActionCall: { createWithResponse } } as unknown as CMAClient;

      expect(await new SfccClient(cma, ids).search(type)).toEqual({ items });
      expect(createWithResponse.mock.calls[0][1].parameters).not.toHaveProperty('offset');
    }
  );
});

describe('SfccClient fetchByKey', () => {
  const ids = { app: 'app', space: 'space', environment: 'master' } as BaseAppSDK['ids'];

  const clientFor = (options = {}) => {
    const createWithResponse = vi.fn().mockResolvedValue({
      response: { body: JSON.stringify({ ok: true, data: { id: 'item' } }) },
    });
    const cma = { appActionCall: { createWithResponse } } as unknown as CMAClient;
    return { client: new SfccClient(cma, ids, options), createWithResponse };
  };

  it('splits stored category keys into catalog and category IDs', async () => {
    const { client, createWithResponse } = clientFor();
    await client.fetchByKey('category', 'catalog-1:shoes');
    expect(createWithResponse.mock.calls[0][1].parameters).toEqual({
      type: 'fetchCategory',
      catalogId: 'catalog-1',
      resourceId: 'shoes',
    });
  });

  it('fetches products by plain ID', async () => {
    const { client, createWithResponse } = clientFor({ siteId: 'OtherSite' });
    await client.fetchByKey('product', 'sku-1');
    expect(createWithResponse.mock.calls[0][1].parameters).toEqual({
      type: 'fetchProduct',
      resourceId: 'sku-1',
      siteId: 'OtherSite',
    });
  });

  it.each(['customerGroup', 'promotion', 'campaign', 'coupon', 'store'] as const)(
    'dispatches %s keys to fetchResource',
    async (fieldType) => {
      const { client, createWithResponse } = clientFor();
      await client.fetchByKey(fieldType, 'abc');
      expect(createWithResponse.mock.calls[0][1].parameters).toEqual({
        type: 'fetchResource',
        resource: fieldType,
        resourceId: 'abc',
      });
    }
  );

  it('surfaces function errors as thrown errors', async () => {
    const createWithResponse = vi.fn().mockResolvedValue({
      response: { body: JSON.stringify({ ok: false, error: { message: 'Item not found' } }) },
    });
    const cma = { appActionCall: { createWithResponse } } as unknown as CMAClient;
    await expect(new SfccClient(cma, ids).fetchByKey('store', 'gone')).rejects.toThrow(
      'Item not found'
    );
  });
});

describe('sfccApi action manifest', () => {
  const ids = { app: 'app', space: 'space', environment: 'master' } as BaseAppSDK['ids'];
  const declared = new Map(
    manifest.actions
      .find((action) => action.id === 'sfccApi')!
      .parameters.map((parameter) => [parameter.id, parameter.type])
  );

  it('declares every parameter the client sends, with matching types', async () => {
    const createWithResponse = vi.fn().mockResolvedValue({
      response: { body: JSON.stringify({ ok: true, data: { items: [] } }) },
    });
    const cma = { appActionCall: { createWithResponse } } as unknown as CMAClient;
    const client = new SfccClient(cma, ids, {
      siteId: 'site',
      catalogId: 'catalog',
      includeVariants: true,
    });

    await client.searchProducts('q');
    await client.searchCategories('q');
    await client.fetchProduct('p');
    await client.fetchCategory('c', 'cat');
    await client.searchResource('store', 'q', 50);
    await client.fetchResource('store', 's');

    const typeOf = (value: unknown) =>
      typeof value === 'number' ? 'Number' : typeof value === 'boolean' ? 'Boolean' : 'Symbol';
    for (const [, { parameters }] of createWithResponse.mock.calls) {
      for (const [key, value] of Object.entries(parameters)) {
        if (value === undefined) continue;
        expect(declared.get(key), key).toBe(typeOf(value));
      }
    }
  });
});
