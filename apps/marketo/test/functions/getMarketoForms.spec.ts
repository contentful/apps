import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler as originalHandler } from '../../functions/getMarketoForms';
import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { MarketoAuthenticationError, MarketoApiError } from '../../functions/exceptions';
import type { MarketoFormsResponse } from '../../src/types';
import {
  AUTH_URL,
  FORMS_URL,
  formsUrl,
  mockAuthResponse,
  buildMarketoForm,
  buildFormsApiResponse,
  jsonResponse,
} from '../mocks';

globalThis.fetch = vi.fn();

const handler: (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
) => Promise<MarketoFormsResponse> = originalHandler as typeof handler;

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

  // Routes a fake fetch by URL, backed by a plain { [url]: responseBody } map.
  // Every test only needs to describe the URLs it actually cares about.
  const mockFetchRoutes = (routes: Record<string, unknown>) => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url in routes) return jsonResponse(routes[url]);
      throw new Error(`Unexpected fetch: ${url}`);
    });
  };

  it('should return each form with its folder reference', async () => {
    const form1 = buildMarketoForm({ id: 'form-1', name: 'Contact Form' });
    const form2 = buildMarketoForm({
      id: 'form-2',
      name: 'Newsletter Signup',
      url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/2.json',
      folder: { type: 'Program', value: 101, folderName: 'Webinar' },
    });

    mockFetchRoutes({
      [AUTH_URL]: mockAuthResponse,
      [FORMS_URL]: buildFormsApiResponse([form1, form2]),
    });

    const result = await handler(mockEvent, mockContext);

    expect(result).toEqual({
      forms: [
        {
          id: 'form-1',
          name: 'Contact Form',
          url: form1.url,
          folder: { id: 100, type: 'Folder' },
        },
        {
          id: 'form-2',
          name: 'Newsletter Signup',
          url: form2.url,
          folder: { id: 101, type: 'Program' },
        },
      ],
    });
  });

  it('should keep a form when it has no folder information (defensive fallback)', async () => {
    const formWithoutFolder = buildMarketoForm({
      id: 'form-no-folder',
      name: 'Legacy Form',
      url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/legacy.json',
      folder: undefined,
    });

    mockFetchRoutes({
      [AUTH_URL]: mockAuthResponse,
      [FORMS_URL]: buildFormsApiResponse([formWithoutFolder]),
    });

    const result = await handler(mockEvent, mockContext);

    expect(result.forms).toEqual([
      { id: 'form-no-folder', name: 'Legacy Form', url: formWithoutFolder.url },
    ]);
  });

  it('should throw MarketoAuthenticationError when authentication fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
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

    vi.mocked(fetch)
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

  it.each(['606', '615'])(
    'should report rateLimited instead of throwing when Marketo returns %s',
    async (code) => {
      mockFetchRoutes({
        [AUTH_URL]: mockAuthResponse,
        [FORMS_URL]: { success: false, errors: [{ code, message: 'Limit exceeded' }] },
      });

      const result = await handler(mockEvent, mockContext);

      expect(result).toEqual({ rateLimited: true });
    }
  );

  describe('pagination', () => {
    const PAGE_SIZE = 200;

    const buildFormPage = (count: number, startId = 0, folderId = 100) =>
      Array.from({ length: count }, (_, i) =>
        buildMarketoForm({
          id: `form-${startId + i}`,
          name: `Form ${startId + i}`,
          folder: { type: 'Folder', value: folderId, folderName: 'Landing Pages' },
        })
      );

    const eventWithOffset = (offset: unknown): AppActionRequest<'Custom'> => ({
      ...mockEvent,
      body: { offset } as AppActionRequest<'Custom'>['body'],
    });

    it('should request the page at the given offset and omit nextOffset on a short page', async () => {
      mockFetchRoutes({
        [AUTH_URL]: mockAuthResponse,
        [formsUrl(400)]: buildFormsApiResponse(buildFormPage(3, 400)),
      });

      const result = await handler(eventWithOffset(400), mockContext);

      expect(result.forms?.map((form) => form.id)).toEqual(['form-400', 'form-401', 'form-402']);
      expect(result.nextOffset).toBeUndefined();
    });

    it('should return no forms and no nextOffset when the offset is past the last page', async () => {
      // Out-of-range offsets succeed with no result array.
      mockFetchRoutes({
        [AUTH_URL]: mockAuthResponse,
        [formsUrl(600)]: {
          success: true,
          warnings: ['No assets found for the given search criteria.'],
        },
      });

      const result = await handler(eventWithOffset(600), mockContext);

      expect(result).toEqual({ forms: [] });
    });

    it('should return nextOffset when the page is full', async () => {
      mockFetchRoutes({
        [AUTH_URL]: mockAuthResponse,
        [formsUrl(0)]: buildFormsApiResponse(buildFormPage(PAGE_SIZE)),
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.forms).toHaveLength(PAGE_SIZE);
      expect(result.nextOffset).toBe(PAGE_SIZE);
    });

    it.each([-200, 'abc', 1.5])(
      'should fall back to offset 0 for invalid offset %s',
      async (offset) => {
        mockFetchRoutes({
          [AUTH_URL]: mockAuthResponse,
          [formsUrl(0)]: buildFormsApiResponse(buildFormPage(1)),
        });

        const result = await handler(eventWithOffset(offset), mockContext);

        expect(result.forms).toHaveLength(1);
      }
    );
  });
});
