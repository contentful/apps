import { vi } from 'vitest';
import { fetchProductPreviews } from './fetchProductPreviews';
import { mockApiEndpoint, mockBaseSite, mockFetch, makeSdkMock } from '../__mocks__';
import { BaseAppSDK } from '@contentful/app-sdk';

const originalFetch = global.fetch;
describe('fetchProductPreviews', () => {
  afterAll(() => {
    global.fetch = originalFetch;
  });
  it('should fetch product previews', async () => {
    const mockSDK = makeSdkMock();
    const mockSDKAction = vi.fn(() =>
      Promise.resolve({
        response: {
          body: JSON.stringify({
            success: true,
            products: [{ id: '123' }],
          }),
        },
      })
    );
    mockSDK.ids.app = 'TEST_SAP_AIR_APP_ID';
    mockSDK.cma = {
      appActionCall: {
        createWithResponse: mockSDKAction,
      },
    };
    global.fetch = mockFetch({});
    const productPreviews = await fetchProductPreviews(
      ['1', '2'],
      {
        installation: {
          apiEndpoint: mockApiEndpoint,
          baseSites: mockBaseSite,
        },
        instance: 'electronics',
        invocation: '123',
      },
      mockSDK.ids as BaseAppSDK['ids'],
      mockSDK.cma as any
    );
    expect(productPreviews).toEqual([
      {
        id: '123',
      },
    ]);
  });
  it('should fetch product previews from HAA', async () => {
    const mockSDK = makeSdkMock();
    global.fetch = mockFetch({});
    const productPreviews = await fetchProductPreviews(
      ['1', '2'],
      {
        installation: {
          apiEndpoint: mockApiEndpoint,
          baseSites: mockBaseSite,
        },
        instance: 'electronics',
        invocation: '123',
      },
      mockSDK.ids as BaseAppSDK['ids'],
      mockSDK.cma as any
    );
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
    const mockSDK = makeSdkMock();
    global.fetch = vi.fn(() => Promise.reject(new Error('Failed to fetch')));
    await expect(
      fetchProductPreviews(
        ['1', '2'],
        {
          installation: {
            apiEndpoint: mockApiEndpoint,
            baseSites: mockBaseSite,
          },
          instance: 'electronics',
          invocation: '123',
        },
        mockSDK.ids as BaseAppSDK['ids'],
        mockSDK.cma as any
      )
    ).rejects.toThrow();
  });
});
