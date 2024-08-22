import { vi } from 'vitest';
import { fetchBaseSites } from './fetchBaseSites';
import { makeSdkMock, mockApiEndpoint, mockBaseSite, mockFetch } from '../__mocks__/';
import { BaseAppSDK } from '@contentful/app-sdk';

const originalFetch = global.fetch;
describe('fetchBaseSites', () => {
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('should fetch base sites', async () => {
    const mockSDK = makeSdkMock();
    global.fetch = mockFetch({ baseSites: [{ uid: mockBaseSite }] });
    const baseSites = await fetchBaseSites(
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
    expect(baseSites).toEqual([mockBaseSite]);
  });
  it('should fetch base sites from HAA', async () => {
    const mockSDK = makeSdkMock();
    const mockSDKAction = vi.fn(() =>
      Promise.resolve({
        response: {
          body: JSON.stringify({
            ok: true,
            data: [mockBaseSite],
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
    const baseSites = await fetchBaseSites(
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
    expect(baseSites).toEqual([mockBaseSite]);
  });
  it('should throw an error if the request fails', async () => {
    const mockSDK = makeSdkMock();
    global.fetch = vi.fn(() => Promise.reject(new Error('Failed to fetch')));
    await expect(
      fetchBaseSites(
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
