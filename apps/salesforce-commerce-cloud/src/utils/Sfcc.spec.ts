import { BaseAppSDK, CMAClient } from '@contentful/app-sdk';
import { describe, expect, it, vi } from 'vitest';
import SfccClient from './Sfcc';

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
