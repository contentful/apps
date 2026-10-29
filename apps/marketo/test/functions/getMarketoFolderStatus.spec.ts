import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler as originalHandler } from '../../functions/getMarketoFolderStatus';
import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import type { MarketoFolderStatusResponse } from '../../src/types';
import {
  AUTH_URL,
  folderUrl,
  mockAuthResponse,
  buildMarketoFolder,
  buildFolderApiResponse,
  jsonResponse,
} from '../mocks';

globalThis.fetch = vi.fn();

const handler: (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
) => Promise<MarketoFolderStatusResponse> = originalHandler as typeof handler;

describe('getMarketoFolderStatus handler', () => {
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

  const eventFor = (folders: string): AppActionRequest<'Custom'> => ({
    type: FunctionTypeEnum.AppActionCall,
    headers: {},
    body: { folders } as AppActionRequest<'Custom'>['body'],
  });

  const mockFetchRoutes = (routes: Record<string, unknown>) => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url in routes) return jsonResponse(routes[url]);
      throw new Error(`Unexpected fetch: ${url}`);
    });
  };

  it('should report the archive status of each requested folder', async () => {
    mockFetchRoutes({
      [AUTH_URL]: mockAuthResponse,
      [folderUrl(100)]: buildFolderApiResponse(buildMarketoFolder()),
      [folderUrl(25, 'Program')]: buildFolderApiResponse(
        buildMarketoFolder({ id: 25, isArchive: true })
      ),
    });

    const result = await handler(eventFor('Folder:100,Program:25'), mockContext);

    expect(result).toEqual({
      folders: [
        { id: 100, type: 'Folder', isArchive: false },
        { id: 25, type: 'Program', isArchive: true },
      ],
    });
  });

  it('should look up at most 10 folders per call', async () => {
    const requested = Array.from({ length: 12 }, (_, i) => `Folder:${1000 + i}`).join(',');
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url === AUTH_URL) return jsonResponse(mockAuthResponse);
      const id = Number(url.match(/folder\/(\d+)\.json/)![1]);
      return jsonResponse(buildFolderApiResponse(buildMarketoFolder({ id })));
    });

    const result = await handler(eventFor(requested), mockContext);

    expect(result.folders.map((folder) => folder.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => 1000 + i)
    );
  });

  it('should run at most 2 folder lookups concurrently', async () => {
    const requested = Array.from({ length: 6 }, (_, i) => `Folder:${1000 + i}`).join(',');
    let inFlight = 0;
    let maxInFlight = 0;
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url === AUTH_URL) return jsonResponse(mockAuthResponse);
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
      const id = Number(url.match(/folder\/(\d+)\.json/)![1]);
      return jsonResponse(buildFolderApiResponse(buildMarketoFolder({ id })));
    });

    const result = await handler(eventFor(requested), mockContext);

    expect(result.folders).toHaveLength(6);
    expect(maxInFlight).toBe(2);
  });

  it('should omit rate-limited folders and report rateLimited', async () => {
    mockFetchRoutes({
      [AUTH_URL]: mockAuthResponse,
      [folderUrl(100)]: buildFolderApiResponse(buildMarketoFolder()),
      [folderUrl(101)]: {
        success: false,
        errors: [{ code: '606', message: "Max rate limit '100' exceeded with in '20' secs" }],
      },
    });

    const result = await handler(eventFor('Folder:100,Folder:101'), mockContext);

    expect(result).toEqual({
      folders: [{ id: 100, type: 'Folder', isArchive: false }],
      rateLimited: true,
    });
  });

  it('should log any other failed lookup and treat the folder as not archived', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockFetchRoutes({
      [AUTH_URL]: mockAuthResponse,
      [folderUrl(100)]: { success: false, errors: [{ code: '702', message: 'Not found' }] },
    });

    const result = await handler(eventFor('Folder:100'), mockContext);

    expect(result).toEqual({ folders: [{ id: 100, type: 'Folder', isArchive: false }] });
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('folder 100'));
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('702'));
    consoleError.mockRestore();
  });

  it('should skip malformed folder references', async () => {
    mockFetchRoutes({
      [AUTH_URL]: mockAuthResponse,
      [folderUrl(100)]: buildFolderApiResponse(buildMarketoFolder()),
    });

    const result = await handler(eventFor('Folder:100,Folder:abc,Page:5,'), mockContext);

    expect(result.folders).toEqual([{ id: 100, type: 'Folder', isArchive: false }]);
  });
});
