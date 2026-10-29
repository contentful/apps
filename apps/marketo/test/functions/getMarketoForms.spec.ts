import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler as originalHandler } from '../../functions/getMarketoForms';
import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { MarketoAuthenticationError, MarketoApiError } from '../../functions/exceptions';
import type { MarketoFormsResponse } from '../../src/types';

globalThis.fetch = vi.fn();

type HandlerResponse = {
  contentBlocks: MarketoFormsResponse;
};

const handler: (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
) => Promise<HandlerResponse> = originalHandler as any;

describe('getMarketoForms handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContext: FunctionEventContext = {
    appInstallationParameters: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      munchkinId: 'test-munchkin',
    },
    spaceId: 'test-space',
    environmentId: 'test-env',
  };

  const mockEvent: AppActionRequest<'Custom'> = {
    type: FunctionTypeEnum.AppActionCall,
    headers: {},
    body: {},
  };

  it('should successfully fetch and return Marketo forms', async () => {
    const mockAuthResponse = {
      access_token: 'test-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    const mockFormsResponse = {
      success: true,
      result: [
        {
          id: 'form-1',
          name: 'Contact Form',
          url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/1.json',
        },
        {
          id: 'form-2',
          name: 'Newsletter Signup',
          url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/2.json',
        },
      ],
    };

    const mockFetch = vi.mocked(fetch);
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockFormsResponse,
      } as Response);

    const result = await handler(mockEvent, mockContext);

    expect(result).toEqual({
      forms: [
        {
          id: 'form-1',
          name: 'Contact Form',
          url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/1.json',
        },
        {
          id: 'form-2',
          name: 'Newsletter Signup',
          url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/2.json',
        },
      ],
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'https://test-munchkin.mktorest.com/identity/oauth/token?grant_type=client_credentials&client_id=test-client-id&client_secret=test-client-secret'
    );

    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://test-munchkin.mktorest.com/rest/asset/v1/forms.json?maxReturn=200&offset=0',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-access-token',
        },
      }
    );
  });

  it('should throw MarketoAuthenticationError when authentication fails', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({
        error: 'invalid_client',
        error_description: 'Invalid client credentials',
      }),
    } as Response);

    await expect(handler(mockEvent, mockContext)).rejects.toThrow(MarketoAuthenticationError);
  });

  it('should throw MarketoApiError when getForms API call fails', async () => {
    const mockAuthResponse = {
      access_token: 'test-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    const mockErrorResponse = {
      success: false,
      errors: [
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded. Please try again later.',
        },
      ],
      message: 'Rate limit exceeded',
    };

    const mockFetch = vi.mocked(fetch);
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => mockErrorResponse,
      } as Response);

    await expect(handler(mockEvent, mockContext)).rejects.toThrow(MarketoApiError);
  });

  describe('pagination', () => {
    const PAGE_SIZE = 200;
    const AUTH_URL =
      'https://test-munchkin.mktorest.com/identity/oauth/token?grant_type=client_credentials&client_id=test-client-id&client_secret=test-client-secret';
    const formsUrl = (offset: number) =>
      `https://test-munchkin.mktorest.com/rest/asset/v1/forms.json?maxReturn=200&offset=${offset}`;

    const buildPage = (count: number, startId = 0) =>
      Array.from({ length: count }, (_, i) => ({
        id: `form-${startId + i}`,
        name: `Form ${startId + i}`,
        url: `https://test-munchkin.mktorest.com/rest/asset/v1/form/${startId + i}.json`,
      }));

    // Serves Marketo responses by URL; any other URL fails the test.
    const mockRoutes = (routes: Record<string, unknown>) => {
      vi.mocked(fetch).mockImplementation(async (url) => {
        const body = routes[String(url)];
        if (body === undefined) throw new Error(`Unexpected request: ${url}`);
        return { ok: true, json: async () => body } as Response;
      });
    };

    const authResponse = { access_token: 'test-access-token' };
    const pageResponse = (count: number, startId = 0) => ({
      success: true,
      result: buildPage(count, startId),
    });
    const withOffset = (offset: unknown): AppActionRequest<'Custom'> => ({
      ...mockEvent,
      body: { offset } as AppActionRequest<'Custom'>['body'],
    });
    const formsRequests = () =>
      vi
        .mocked(fetch)
        .mock.calls.map(([url]) => String(url))
        .filter((url) => url.includes('forms.json'));

    it('should return nextOffset when the page is full', async () => {
      mockRoutes({
        [AUTH_URL]: authResponse,
        [formsUrl(0)]: pageResponse(PAGE_SIZE),
      });

      const result = (await handler(mockEvent, mockContext)) as MarketoFormsResponse;

      expect(result.forms).toHaveLength(PAGE_SIZE);
      expect(result.nextOffset).toBe(PAGE_SIZE);
    });

    it('should request the page at the given offset and omit nextOffset on a short page', async () => {
      mockRoutes({
        [AUTH_URL]: authResponse,
        [formsUrl(400)]: pageResponse(3, 400),
      });

      const result = (await handler(withOffset(400), mockContext)) as MarketoFormsResponse;

      expect(result.forms?.map((form) => form.id)).toEqual(['form-400', 'form-401', 'form-402']);
      expect(result.nextOffset).toBeUndefined();
    });

    it('should return no forms and no nextOffset when the offset is past the last page', async () => {
      mockRoutes({
        [AUTH_URL]: authResponse,
        [formsUrl(600)]: {
          success: true,
          warnings: ['No assets found for the given search criteria.'],
        },
      });

      const result = await handler(withOffset(600), mockContext);

      expect(result).toEqual({ forms: [] });
    });

    it.each([-200, 'abc', 1.5])(
      'should fall back to offset 0 for invalid offset %s',
      async (offset) => {
        mockRoutes({
          [AUTH_URL]: authResponse,
          [formsUrl(0)]: pageResponse(1),
        });

        await handler(withOffset(offset), mockContext);

        expect(formsRequests()).toEqual([formsUrl(0)]);
      }
    );
  });
});
