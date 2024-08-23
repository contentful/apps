import { vi } from 'vitest';
import { fetchProductList, fetchProductListHAA } from './fetchProductList';
import { mockApiEndpoint, mockBaseSite, mockFetch, makeSdkMock } from '../__mocks__';
import { BaseAppSDK } from '@contentful/app-sdk';

const originalFetch = global.fetch;
describe('fetchProductList', () => {
  afterAll(() => {
    global.fetch = originalFetch;
  });
  it('should fetch product list', async () => {
    global.fetch = mockFetch({
      pagination: { totalPages: 1 },
      products: [{ id: '123' }],
    });
    const response = await fetchProductList({
      baseSite: 'electronics-spa',
      searchQuery: 'product',
      page: 1,
      parameters: {
        installation: {
          apiEndpoint: mockApiEndpoint,
          baseSites: mockBaseSite,
        },
        instance: 'electronics',
        invocation: '123',
      },
      updateTotalPages: () => {},
    });
    expect(response.products).toEqual([
      {
        id: '123',
        image: '',
        name: '',
        productUrl: 'localhost:9002/occ/v2/electronics-spa/products/',
        sku: '',
      },
    ]);
  });

  it('should fetch product list from HAA', async () => {
    const mockSDKAction = vi.fn(() =>
      Promise.resolve({
        response: {
          body: JSON.stringify({
            success: true,
            pagination: { totalPages: 1 },
            products: [{ id: '123' }],
          }),
        },
      })
    );
    const mockSDK = makeSdkMock();
    mockSDK.ids.app = 'TEST_SAP_AIR_APP_ID';
    mockSDK.cma = {
      appActionCall: {
        createWithResponse: mockSDKAction,
      },
    };
    const response = await fetchProductListHAA({
      baseSite: 'electronics-spa',
      searchQuery: 'product',
      page: 1,
      parameters: {
        installation: {
          apiEndpoint: mockApiEndpoint,
          baseSites: mockBaseSite,
        },
        instance: 'electronics',
        invocation: '123',
      },
      updateTotalPages: () => {},
      ids: mockSDK.ids as BaseAppSDK['ids'],
      cma: mockSDK.cma as any,
    });
    expect(response.products).toEqual([
      {
        id: '123',
      },
    ]);
  });

  it('should throw an error if the request fails', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Failed to fetch')));
    await expect(
      fetchProductList({
        baseSite: 'electronics-spa',
        searchQuery: 'product',
        page: 1,
        parameters: {
          installation: {
            apiEndpoint: mockApiEndpoint,
            baseSites: mockBaseSite,
          },
          instance: 'electronics',
          invocation: '123',
        },
        updateTotalPages: () => {},
      })
    ).rejects.toThrow();
  });

  it('should return an empty array if base site is not provided', async () => {
    const response = await fetchProductList({
      baseSite: '',
      searchQuery: 'product',
      page: 1,
      parameters: {
        installation: {
          apiEndpoint: mockApiEndpoint,
          baseSites: mockBaseSite,
        },
        instance: 'electronics',
        invocation: '123',
      },
      updateTotalPages: () => {},
    });
    expect(response.products).toEqual([]);
  });

  it('should return an empty array if no products are found', async () => {
    global.fetch = mockFetch({
      pagination: { totalPages: 1 },
      products: [],
    });
    const response = await fetchProductList({
      baseSite: 'electronics-spa',
      searchQuery: 'product',
      page: 1,
      parameters: {
        installation: {
          apiEndpoint: mockApiEndpoint,
          baseSites: mockBaseSite,
        },
        instance: 'electronics',
        invocation: '123',
      },
      updateTotalPages: () => {},
    });
    expect(response.products).toEqual([]);
  });
});
