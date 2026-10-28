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
  folderUrl,
  mockAuthResponse,
  buildMarketoForm,
  buildMarketoFolder,
  buildFormsApiResponse,
  buildFolderApiResponse,
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

  it('should successfully fetch and return Marketo forms', async () => {
    const form1 = buildMarketoForm({ id: 'form-1', name: 'Contact Form' });
    const form2 = buildMarketoForm({
      id: 'form-2',
      name: 'Newsletter Signup',
      url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/2.json',
      folder: { type: 'Folder', value: 101, folderName: 'Emails' },
    });

    mockFetchRoutes({
      [AUTH_URL]: mockAuthResponse,
      [FORMS_URL]: buildFormsApiResponse([form1, form2]),
      [folderUrl(100)]: buildFolderApiResponse(buildMarketoFolder()),
      [folderUrl(101)]: buildFolderApiResponse(buildMarketoFolder({ id: 101, name: 'Emails' })),
    });

    const result = await handler(mockEvent, mockContext);

    expect(result).toEqual({
      forms: [
        { id: 'form-1', name: 'Contact Form', url: form1.url },
        { id: 'form-2', name: 'Newsletter Signup', url: form2.url },
      ],
    });
  });

  it('should exclude forms whose folder is archived (isArchive=true)', async () => {
    // Reproduces the ES-642 customer scenario: a form carrying a normal
    // "approved" status while sitting in a folder Marketo's UI has archived.
    // Archival is a folder-level property in Marketo, never a form-level
    // one, so the fix must cross-reference each form's folder before
    // returning it.
    const liveForm = buildMarketoForm({ id: 'form-live', name: 'Current Contact Form' });
    const archivedForm = buildMarketoForm({
      id: 'form-archived',
      name: 'z_archived_Old Contact Form',
      url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/archived.json',
      folder: { type: 'Folder', value: 25, folderName: '_Archive' },
    });

    mockFetchRoutes({
      [AUTH_URL]: mockAuthResponse,
      [FORMS_URL]: buildFormsApiResponse([liveForm, archivedForm]),
      [folderUrl(100)]: buildFolderApiResponse(buildMarketoFolder()),
      [folderUrl(25)]: buildFolderApiResponse(
        buildMarketoFolder({ id: 25, name: '_Archive', isArchive: true })
      ),
    });

    const result = await handler(mockEvent, mockContext);

    expect(result.forms).toEqual([
      { id: 'form-live', name: 'Current Contact Form', url: liveForm.url },
    ]);
    expect(result.forms).not.toContainEqual(expect.objectContaining({ id: 'form-archived' }));
  });

  it('should not issue duplicate folder lookups when multiple forms share a folder', async () => {
    const formA = buildMarketoForm({
      id: 'form-a',
      name: 'Archived A',
      url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/a.json',
      folder: { type: 'Folder', value: 25, folderName: '_Archive' },
    });
    const formB = buildMarketoForm({
      id: 'form-b',
      name: 'Archived B',
      url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/b.json',
      folder: { type: 'Folder', value: 25, folderName: '_Archive' },
    });

    let folderLookupCount = 0;
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url === AUTH_URL) return jsonResponse(mockAuthResponse);
      if (url === FORMS_URL) return jsonResponse(buildFormsApiResponse([formA, formB]));
      if (url === folderUrl(25)) {
        folderLookupCount += 1;
        return jsonResponse(
          buildFolderApiResponse(buildMarketoFolder({ id: 25, name: '_Archive', isArchive: true }))
        );
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const result = await handler(mockEvent, mockContext);

    expect(result.forms).toEqual([]);
    expect(folderLookupCount).toBe(1);
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

    it('should request the first page and return nextOffset when the page is full', async () => {
      mockFetchRoutes({
        [AUTH_URL]: mockAuthResponse,
        [formsUrl(0)]: buildFormsApiResponse(buildFormPage(PAGE_SIZE)),
        [folderUrl(100)]: buildFolderApiResponse(buildMarketoFolder()),
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.forms).toHaveLength(PAGE_SIZE);
      expect(result.nextOffset).toBe(PAGE_SIZE);
    });

    it('should request the page at the given offset and omit nextOffset on a short page', async () => {
      mockFetchRoutes({
        [AUTH_URL]: mockAuthResponse,
        [formsUrl(400)]: buildFormsApiResponse(buildFormPage(3, 400)),
        [folderUrl(100)]: buildFolderApiResponse(buildMarketoFolder()),
      });

      const result = await handler(eventWithOffset(400), mockContext);

      expect(result.forms?.map((form) => form.id)).toEqual(['form-400', 'form-401', 'form-402']);
      expect(result.nextOffset).toBeUndefined();
    });

    it('should return no forms and no nextOffset when the offset is past the last page', async () => {
      // Marketo answers an out-of-range offset with success and no result array.
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

    it('should base nextOffset on the raw page size, not the count left after archive filtering', async () => {
      const archivedPage = buildFormPage(PAGE_SIZE, 0, 25);
      mockFetchRoutes({
        [AUTH_URL]: mockAuthResponse,
        [formsUrl(0)]: buildFormsApiResponse(archivedPage),
        [folderUrl(25)]: buildFolderApiResponse(buildMarketoFolder({ id: 25, isArchive: true })),
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.forms).toEqual([]);
      expect(result.nextOffset).toBe(PAGE_SIZE);
    });

    it.each([-200, 'abc', 1.5])(
      'should fall back to offset 0 for invalid offset %s',
      async (offset) => {
        mockFetchRoutes({
          [AUTH_URL]: mockAuthResponse,
          [formsUrl(0)]: buildFormsApiResponse(buildFormPage(1)),
          [folderUrl(100)]: buildFolderApiResponse(buildMarketoFolder()),
        });

        const result = await handler(eventWithOffset(offset), mockContext);

        expect(result.forms).toHaveLength(1);
      }
    );
  });

  describe('folder lookups', () => {
    it('should run at most 5 folder lookups concurrently', async () => {
      // Marketo rejects more than 10 concurrent calls per instance, and the
      // customer's other integrations share that budget.
      const forms = Array.from({ length: 12 }, (_, i) =>
        buildMarketoForm({
          id: `form-${i}`,
          folder: { type: 'Folder', value: 1000 + i, folderName: `Folder ${i}` },
        })
      );

      let inFlight = 0;
      let maxInFlight = 0;
      vi.mocked(fetch).mockImplementation(async (input) => {
        const url = String(input);
        if (url === AUTH_URL) return jsonResponse(mockAuthResponse);
        if (url === FORMS_URL) return jsonResponse(buildFormsApiResponse(forms));
        const folderMatch = url.match(/folder\/(\d+)\.json/);
        if (folderMatch) {
          inFlight += 1;
          maxInFlight = Math.max(maxInFlight, inFlight);
          await new Promise((resolve) => setTimeout(resolve, 5));
          inFlight -= 1;
          return jsonResponse(
            buildFolderApiResponse(buildMarketoFolder({ id: Number(folderMatch[1]) }))
          );
        }
        throw new Error(`Unexpected fetch: ${url}`);
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.forms).toHaveLength(12);
      expect(maxInFlight).toBeLessThanOrEqual(5);
      expect(maxInFlight).toBeGreaterThan(1);
    });

    it('should log a failed folder lookup and keep its forms', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const form = buildMarketoForm({ id: 'form-1' });

      mockFetchRoutes({
        [AUTH_URL]: mockAuthResponse,
        [FORMS_URL]: buildFormsApiResponse([form]),
        [folderUrl(100)]: {
          success: false,
          errors: [{ code: '615', message: 'Concurrent access limit reached' }],
        },
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.forms).toEqual([{ id: 'form-1', name: form.name, url: form.url }]);
      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('folder 100'));
      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('615'));
      consoleError.mockRestore();
    });
  });
});
