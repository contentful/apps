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

const AUTH_URL =
  'https://test-munchkin.mktorest.com/identity/oauth/token?grant_type=client_credentials&client_id=test-client-id&client_secret=test-client-secret';
const FORMS_URL = 'https://test-munchkin.mktorest.com/rest/asset/v1/forms.json?maxReturn=200';

const folderUrl = (folderId: number) =>
  `https://test-munchkin.mktorest.com/rest/asset/v1/folder/${folderId}.json?type=Folder`;

const jsonResponse = (body: unknown, ok = true) =>
  ({
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  }) as Response;

const mockAuthResponse = {
  access_token: 'test-access-token',
  token_type: 'Bearer',
  expires_in: 3600,
};

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
    const mockFormsResponse = {
      success: true,
      result: [
        {
          id: 'form-1',
          name: 'Contact Form',
          url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/1.json',
          status: 'approved',
          folder: { type: 'Folder', value: 100, folderName: 'Landing Pages' },
        },
        {
          id: 'form-2',
          name: 'Newsletter Signup',
          url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/2.json',
          status: 'approved',
          folder: { type: 'Folder', value: 101, folderName: 'Emails' },
        },
      ],
    };

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(async (input) => {
      const url = String(input);
      if (url === AUTH_URL) return jsonResponse(mockAuthResponse);
      if (url === FORMS_URL) return jsonResponse(mockFormsResponse);
      if (url === folderUrl(100)) {
        return jsonResponse({
          success: true,
          result: [{ id: 100, name: 'Landing Pages', isArchive: false }],
        });
      }
      if (url === folderUrl(101)) {
        return jsonResponse({
          success: true,
          result: [{ id: 101, name: 'Emails', isArchive: false }],
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

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
  });

  it('should exclude forms whose folder is archived (isArchive=true)', async () => {
    // Reproduces the ES-642 customer scenario: a form carrying a normal
    // "approved" status while sitting in a folder Marketo's UI has archived.
    // Archival is a folder-level property in Marketo, never a form-level
    // one, so the fix must cross-reference each form's folder before
    // returning it.
    const mockFormsResponse = {
      success: true,
      result: [
        {
          id: 'form-live',
          name: 'Current Contact Form',
          url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/live.json',
          status: 'approved',
          folder: { type: 'Folder', value: 100, folderName: 'Landing Pages' },
        },
        {
          id: 'form-archived',
          name: 'z_archived_Old Contact Form',
          url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/archived.json',
          status: 'approved', // deliberately still "approved" -- Marketo never
          // demotes a form's own status when its folder is archived.
          folder: { type: 'Folder', value: 25, folderName: '_Archive' },
        },
      ],
    };

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(async (input) => {
      const url = String(input);
      if (url === AUTH_URL) return jsonResponse(mockAuthResponse);
      if (url === FORMS_URL) return jsonResponse(mockFormsResponse);
      if (url === folderUrl(100)) {
        return jsonResponse({
          success: true,
          result: [{ id: 100, name: 'Landing Pages', isArchive: false }],
        });
      }
      if (url === folderUrl(25)) {
        return jsonResponse({
          success: true,
          result: [{ id: 25, name: '_Archive', isArchive: true }],
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const result = await handler(mockEvent, mockContext);

    expect(result.forms).toEqual([
      {
        id: 'form-live',
        name: 'Current Contact Form',
        url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/live.json',
      },
    ]);
    expect(result.forms).not.toContainEqual(
      expect.objectContaining({ id: 'form-archived' })
    );
  });

  it('should not issue duplicate folder lookups when multiple forms share a folder', async () => {
    const mockFormsResponse = {
      success: true,
      result: [
        {
          id: 'form-a',
          name: 'Archived A',
          url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/a.json',
          status: 'approved',
          folder: { type: 'Folder', value: 25, folderName: '_Archive' },
        },
        {
          id: 'form-b',
          name: 'Archived B',
          url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/b.json',
          status: 'approved',
          folder: { type: 'Folder', value: 25, folderName: '_Archive' },
        },
      ],
    };

    const mockFetch = vi.mocked(fetch);
    let folderLookupCount = 0;
    mockFetch.mockImplementation(async (input) => {
      const url = String(input);
      if (url === AUTH_URL) return jsonResponse(mockAuthResponse);
      if (url === FORMS_URL) return jsonResponse(mockFormsResponse);
      if (url === folderUrl(25)) {
        folderLookupCount += 1;
        return jsonResponse({
          success: true,
          result: [{ id: 25, name: '_Archive', isArchive: true }],
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const result = await handler(mockEvent, mockContext);

    expect(result.forms).toEqual([]);
    expect(folderLookupCount).toBe(1);
  });

  it('should keep a form when it has no folder information (defensive fallback)', async () => {
    const mockFormsResponse = {
      success: true,
      result: [
        {
          id: 'form-no-folder',
          name: 'Legacy Form',
          url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/legacy.json',
          status: 'approved',
        },
      ],
    };

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(async (input) => {
      const url = String(input);
      if (url === AUTH_URL) return jsonResponse(mockAuthResponse);
      if (url === FORMS_URL) return jsonResponse(mockFormsResponse);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const result = await handler(mockEvent, mockContext);

    expect(result.forms).toEqual([
      {
        id: 'form-no-folder',
        name: 'Legacy Form',
        url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/legacy.json',
      },
    ]);
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
});
