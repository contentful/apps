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
  folderUrl,
  mockAuthResponse,
  buildMarketoForm,
  buildMarketoFolder,
  buildFormsApiResponse,
  buildFolderApiResponse,
  jsonResponse,
} from '../mocks';

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
});
