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
  programUrl,
  mockAuthResponse,
  buildMarketoForm,
  buildMarketoFolder,
  buildMarketoProgram,
  buildFormsApiResponse,
  buildFolderApiResponse,
  buildProgramApiResponse,
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

  it('should exclude forms in an unarchived subfolder of an archived parent folder', async () => {
    // Reproduces the customer's retest of ES-642: Marketo's isArchive flag
    // doesn't cascade from a parent folder down onto its subfolders, so a
    // form sitting in a subfolder must have its whole ancestor chain
    // checked, not just its own folder.
    const liveForm = buildMarketoForm({ id: 'form-live', name: 'Current Contact Form' });
    const nestedArchivedForm = buildMarketoForm({
      id: 'form-nested-archived',
      name: '00976653 II',
      url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/nested.json',
      folder: { type: 'Folder', value: 26, folderName: '2023 Campaigns' },
    });

    mockFetchRoutes({
      [AUTH_URL]: mockAuthResponse,
      [FORMS_URL]: buildFormsApiResponse([liveForm, nestedArchivedForm]),
      [folderUrl(100)]: buildFolderApiResponse(buildMarketoFolder()),
      [folderUrl(26)]: buildFolderApiResponse(
        buildMarketoFolder({
          id: 26,
          name: '2023 Campaigns',
          isArchive: false,
          parent: { id: 25, type: 'Folder' },
        })
      ),
      [folderUrl(25)]: buildFolderApiResponse(
        buildMarketoFolder({ id: 25, name: '_Archive', isArchive: true })
      ),
    });

    const result = await handler(mockEvent, mockContext);

    expect(result.forms).toEqual([
      { id: 'form-live', name: 'Current Contact Form', url: liveForm.url },
    ]);
    expect(result.forms).not.toContainEqual(
      expect.objectContaining({ id: 'form-nested-archived' })
    );
  });

  it('should exclude a form parented directly by a Program whose own folder is archived', async () => {
    // Program has no isArchive of its own (Adobe's documented Program
    // schema has no archive flag). Its upward pointer is `folder`, not
    // `parent`, and always targets a Folder. A form sitting directly under
    // a Program must still be excluded if that Program's containing Folder
    // is archived.
    const liveForm = buildMarketoForm({ id: 'form-live', name: 'Current Contact Form' });
    const programForm = buildMarketoForm({
      id: 'form-in-program',
      name: 'DE Asset Form GDPR 2019',
      url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/program.json',
      folder: { type: 'Program', value: 50, folderName: '2019 Campaign' },
    });

    mockFetchRoutes({
      [AUTH_URL]: mockAuthResponse,
      [FORMS_URL]: buildFormsApiResponse([liveForm, programForm]),
      [folderUrl(100)]: buildFolderApiResponse(buildMarketoFolder()),
      [programUrl(50)]: buildProgramApiResponse(
        buildMarketoProgram({
          id: 50,
          name: '2019 Campaign',
          folder: { type: 'Folder', value: 25, folderName: '_Archive' },
        })
      ),
      [folderUrl(25)]: buildFolderApiResponse(
        buildMarketoFolder({ id: 25, name: '_Archive', isArchive: true })
      ),
    });

    const result = await handler(mockEvent, mockContext);

    expect(result.forms).toEqual([
      { id: 'form-live', name: 'Current Contact Form', url: liveForm.url },
    ]);
    expect(result.forms).not.toContainEqual(expect.objectContaining({ id: 'form-in-program' }));
  });

  it('should exclude a form whose folder sits under a Program, several hops below an archived Folder', async () => {
    // form -> Folder (not archived) -> Program (no isArchive, climbs via
    // .folder) -> Folder (archived). The walk must keep climbing through the
    // Program node instead of dead-ending there.
    const liveForm = buildMarketoForm({ id: 'form-live', name: 'Current Contact Form' });
    const nestedForm = buildMarketoForm({
      id: 'form-nested-under-program',
      name: '00976653 II',
      url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/nested-program.json',
      folder: { type: 'Folder', value: 60, folderName: 'Assets' },
    });

    mockFetchRoutes({
      [AUTH_URL]: mockAuthResponse,
      [FORMS_URL]: buildFormsApiResponse([liveForm, nestedForm]),
      [folderUrl(100)]: buildFolderApiResponse(buildMarketoFolder()),
      [folderUrl(60)]: buildFolderApiResponse(
        buildMarketoFolder({
          id: 60,
          name: 'Assets',
          isArchive: false,
          parent: { id: 50, type: 'Program' },
        })
      ),
      [programUrl(50)]: buildProgramApiResponse(
        buildMarketoProgram({
          id: 50,
          name: '2019 Campaign',
          folder: { type: 'Folder', value: 25, folderName: '_Archive' },
        })
      ),
      [folderUrl(25)]: buildFolderApiResponse(
        buildMarketoFolder({ id: 25, name: '_Archive', isArchive: true })
      ),
    });

    const result = await handler(mockEvent, mockContext);

    expect(result.forms).toEqual([
      { id: 'form-live', name: 'Current Contact Form', url: liveForm.url },
    ]);
    expect(result.forms).not.toContainEqual(
      expect.objectContaining({ id: 'form-nested-under-program' })
    );
  });

  it('should keep a form under a Program whose folder is not archived', async () => {
    // Negative case: a Program is never archived itself, so if its folder
    // isn't archived either, the form must survive the filter.
    const programForm = buildMarketoForm({
      id: 'form-live-program',
      name: 'Current Program Form',
      url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/live-program.json',
      folder: { type: 'Program', value: 51, folderName: 'Active Campaign' },
    });

    mockFetchRoutes({
      [AUTH_URL]: mockAuthResponse,
      [FORMS_URL]: buildFormsApiResponse([programForm]),
      [programUrl(51)]: buildProgramApiResponse(
        buildMarketoProgram({
          id: 51,
          name: 'Active Campaign',
          folder: { type: 'Folder', value: 100, folderName: 'Landing Pages' },
        })
      ),
      [folderUrl(100)]: buildFolderApiResponse(buildMarketoFolder()),
    });

    const result = await handler(mockEvent, mockContext);

    expect(result.forms).toEqual([
      { id: 'form-live-program', name: 'Current Program Form', url: programForm.url },
    ]);
  });

  it('should not loop forever on a self-referential/circular container parent chain', async () => {
    const circularForm = buildMarketoForm({
      id: 'form-circular',
      name: 'Weird Legacy Form',
      url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/circular.json',
      folder: { type: 'Folder', value: 70, folderName: 'Old Stuff' },
    });

    mockFetchRoutes({
      [AUTH_URL]: mockAuthResponse,
      [FORMS_URL]: buildFormsApiResponse([circularForm]),
      [folderUrl(70)]: buildFolderApiResponse(
        buildMarketoFolder({
          id: 70,
          name: 'Old Stuff',
          isArchive: false,
          parent: { id: 70, type: 'Folder' },
        })
      ),
    });

    const result = await handler(mockEvent, mockContext);

    expect(result.forms).toEqual([
      { id: 'form-circular', name: 'Weird Legacy Form', url: circularForm.url },
    ]);
  });

  it('should exclude a form whose folder lookup fails (fail closed, not open)', async () => {
    // If we can't determine a container's archive state, we must not
    // readmit the form -- that's exactly the direction the ES-642 bug
    // leaked in. A failed lookup is treated as archived.
    const unresolvableForm = buildMarketoForm({
      id: 'form-unresolvable',
      name: 'Form With Broken Folder Ref',
      url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/unresolvable.json',
      folder: { type: 'Folder', value: 999, folderName: 'Gone' },
    });

    mockFetchRoutes({
      [AUTH_URL]: mockAuthResponse,
      [FORMS_URL]: buildFormsApiResponse([unresolvableForm]),
      [folderUrl(999)]: { success: false, errors: [{ code: '610', message: 'Not Found' }] },
    });

    const result = await handler(mockEvent, mockContext);

    expect(result.forms).toEqual([]);
  });

  it('should exclude a form whose folder lookup returns a non-OK HTTP status (e.g. 429 rate limit)', async () => {
    const rateLimitedForm = buildMarketoForm({
      id: 'form-rate-limited',
      name: 'Form Behind Rate-Limited Folder',
      url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/rate-limited.json',
      folder: { type: 'Folder', value: 998, folderName: 'Throttled' },
    });

    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url === AUTH_URL) return jsonResponse(mockAuthResponse);
      if (url === FORMS_URL) return jsonResponse(buildFormsApiResponse([rateLimitedForm]));
      if (url === folderUrl(998)) {
        return jsonResponse(
          { success: false, errors: [{ code: '606', message: 'Max rate limit exceeded' }] },
          false
        );
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const result = await handler(mockEvent, mockContext);

    expect(result.forms).toEqual([]);
  });

  it('should exclude a form whose Program lookup throws (network error), while unrelated forms still resolve', async () => {
    const liveForm = buildMarketoForm({ id: 'form-live', name: 'Current Contact Form' });
    const brokenProgramForm = buildMarketoForm({
      id: 'form-broken-program',
      name: 'Form Under Unreachable Program',
      url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/broken-program.json',
      folder: { type: 'Program', value: 997, folderName: 'Unreachable' },
    });

    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url === AUTH_URL) return jsonResponse(mockAuthResponse);
      if (url === FORMS_URL)
        return jsonResponse(buildFormsApiResponse([liveForm, brokenProgramForm]));
      if (url === folderUrl(100)) return jsonResponse(buildFolderApiResponse(buildMarketoFolder()));
      if (url === programUrl(997)) throw new Error('network error');
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const result = await handler(mockEvent, mockContext);

    expect(result.forms).toEqual([
      { id: 'form-live', name: 'Current Contact Form', url: liveForm.url },
    ]);
    expect(result.forms).not.toContainEqual(expect.objectContaining({ id: 'form-broken-program' }));
  });

  it('should exclude a form whose folder lookup returns success=true but an empty result array', async () => {
    const malformedForm = buildMarketoForm({
      id: 'form-malformed',
      name: 'Form With Malformed Folder Response',
      url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/malformed.json',
      folder: { type: 'Folder', value: 996, folderName: 'Empty Result' },
    });

    mockFetchRoutes({
      [AUTH_URL]: mockAuthResponse,
      [FORMS_URL]: buildFormsApiResponse([malformedForm]),
      [folderUrl(996)]: { success: true, result: [] },
    });

    const result = await handler(mockEvent, mockContext);

    expect(result.forms).toEqual([]);
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

  it('should page through forms.json when the first page is full-sized', async () => {
    // forms.json has no total-count/more-results field, so a full-sized
    // page (length === maxReturn) must be treated as "there might be more"
    // and a next page fetched at the next offset, stopping only once a
    // page comes back shorter than the page size.
    const PAGE_SIZE = 200;
    const page1Forms = Array.from({ length: PAGE_SIZE }, (_, i) =>
      buildMarketoForm({
        id: `form-page1-${i}`,
        name: `Page 1 Form ${i}`,
        url: `https://test-munchkin.mktorest.com/rest/asset/v1/form/page1-${i}.json`,
      })
    );
    const page2Forms = [
      buildMarketoForm({
        id: 'form-page2-0',
        name: 'Page 2 Form',
        url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/page2-0.json',
      }),
    ];

    mockFetchRoutes({
      [AUTH_URL]: mockAuthResponse,
      [formsUrl(0)]: buildFormsApiResponse(page1Forms),
      [formsUrl(PAGE_SIZE)]: buildFormsApiResponse(page2Forms),
      [folderUrl(100)]: buildFolderApiResponse(buildMarketoFolder()),
    });

    const result = await handler(mockEvent, mockContext);

    expect(result.forms).toHaveLength(PAGE_SIZE + 1);
    expect(result.forms).toContainEqual(expect.objectContaining({ id: 'form-page1-0' }));
    expect(result.forms).toContainEqual(expect.objectContaining({ id: 'form-page2-0' }));
  });

  it('should stop paging once a page is shorter than the page size (including empty)', async () => {
    const singleForm = buildMarketoForm({ id: 'form-only-one', name: 'Only Form' });

    let secondPageRequested = false;
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url === AUTH_URL) return jsonResponse(mockAuthResponse);
      if (url === formsUrl(0)) return jsonResponse(buildFormsApiResponse([singleForm]));
      if (url === formsUrl(200)) {
        secondPageRequested = true;
        return jsonResponse(buildFormsApiResponse([]));
      }
      if (url === folderUrl(100)) return jsonResponse(buildFolderApiResponse(buildMarketoFolder()));
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const result = await handler(mockEvent, mockContext);

    expect(result.forms).toEqual([{ id: 'form-only-one', name: 'Only Form', url: singleForm.url }]);
    expect(secondPageRequested).toBe(false);
  });

  it('should throw MarketoApiError when a later page of getForms fails', async () => {
    const PAGE_SIZE = 200;
    const page1Forms = Array.from({ length: PAGE_SIZE }, (_, i) =>
      buildMarketoForm({ id: `form-${i}`, name: `Form ${i}` })
    );

    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url === AUTH_URL) return jsonResponse(mockAuthResponse);
      if (url === formsUrl(0)) return jsonResponse(buildFormsApiResponse(page1Forms));
      if (url === formsUrl(PAGE_SIZE)) {
        return jsonResponse(
          { success: false, errors: [{ code: '606', message: 'Max rate limit exceeded' }] },
          false
        );
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    await expect(handler(mockEvent, mockContext)).rejects.toThrow(MarketoApiError);
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
