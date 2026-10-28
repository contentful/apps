import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { MarketoApiError } from './exceptions';
import { getMarketoToken } from './getMarketoToken';
import type {
  AppInstallationParameters,
  MarketoApiResponse,
  MarketoFolderRecord,
  MarketoFormRecord,
  MarketoFormsResponse,
} from '../src/types';

const marketoGet = async <T>(
  baseUrl: string,
  path: string,
  accessToken: string
): Promise<{ response: Response; body: MarketoApiResponse<T> }> => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return { response, body: await response.json() };
};

// Marketo archives at the folder level (folder.isArchive), never on the form
// itself, so a form's own status can still read "approved" while its folder
// is archived. Cross-referencing each form's folder is the only way to keep
// archived forms out of the picker.
// A failed lookup keeps the folder's forms visible: showing a stray archived
// form is better than hiding a live one.
const isFolderArchived = async (baseUrl: string, accessToken: string, folderId: number) => {
  const { response, body } = await marketoGet<MarketoFolderRecord>(
    baseUrl,
    `/rest/asset/v1/folder/${folderId}.json?type=Folder`,
    accessToken
  );
  if (!body.success) {
    const codes = (body.errors ?? []).map((error) => error.code).join(',');
    console.error(
      `Marketo folder lookup failed for folder ${folderId}: status=${response.status} errors=${codes}`
    );
  }
  return Boolean(body.success && body.result?.[0]?.isArchive);
};

// Marketo rejects more than 10 concurrent API calls per instance, and that
// budget is shared with every other integration on the instance.
const MAX_CONCURRENT_FOLDER_LOOKUPS = 5;

const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
};

// Marketo's maximum page size for asset browse endpoints.
const FORMS_PAGE_SIZE = 200;

const parseOffset = (value: unknown) => {
  const offset = Number(value ?? 0);
  return Number.isInteger(offset) && offset >= 0 ? offset : 0;
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<MarketoFormsResponse> => {
  const { clientId, clientSecret, munchkinId } =
    context.appInstallationParameters as AppInstallationParameters;
  const offset = parseOffset((event.body as { offset?: unknown } | undefined)?.offset);

  const auth = await getMarketoToken(clientId, clientSecret, munchkinId);
  const baseUrl = `https://${munchkinId}.mktorest.com`;

  const { response, body: formsResponse } = await marketoGet<MarketoFormRecord>(
    baseUrl,
    `/rest/asset/v1/forms.json?maxReturn=${FORMS_PAGE_SIZE}&offset=${offset}`,
    auth.access_token
  );

  if (!response.ok || !formsResponse.success) {
    throw new MarketoApiError(formsResponse.message || 'Marketo getForms request failed', {
      statusCode: response.status,
      errors: formsResponse.errors ?? [],
    });
  }

  const forms = formsResponse.result ?? [];
  const folderIds = [
    ...new Set(forms.map((form) => form.folder?.value).filter((id): id is number => id != null)),
  ];

  const folderArchiveChecks = await mapWithConcurrency(
    folderIds,
    MAX_CONCURRENT_FOLDER_LOOKUPS,
    async (folderId) =>
      [folderId, await isFolderArchived(baseUrl, auth.access_token, folderId)] as const
  );
  const archivedFolderIds = new Set(
    folderArchiveChecks.filter(([, isArchived]) => isArchived).map(([folderId]) => folderId)
  );

  const mappedResponse = forms
    .filter((form) => !form.folder || !archivedFolderIds.has(form.folder.value))
    .map(({ id, url, name }) => ({ id, url, name }));

  // Pagination follows the raw page size, so a page emptied by the archive
  // filter doesn't end it early.
  return {
    forms: mappedResponse,
    ...(forms.length === FORMS_PAGE_SIZE && { nextOffset: offset + FORMS_PAGE_SIZE }),
  };
};
