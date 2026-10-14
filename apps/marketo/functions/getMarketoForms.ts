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
// is archived. isArchive also doesn't cascade onto subfolders when a parent
// is archived, so a form in an unarchived subfolder of an archived folder
// stays "live" unless we walk the parent chain ourselves.
const fetchFolder = async (baseUrl: string, accessToken: string, folderId: number) => {
  const { body } = await marketoGet<MarketoFolderRecord>(
    baseUrl,
    `/rest/asset/v1/folder/${folderId}.json?type=Folder`,
    accessToken
  );
  return body.result?.[0];
};

const isFolderArchived = async (
  baseUrl: string,
  accessToken: string,
  folderId: number,
  cache: Map<number, boolean>
): Promise<boolean> => {
  const cached = cache.get(folderId);
  if (cached != null) return cached;

  const folder = await fetchFolder(baseUrl, accessToken, folderId);
  const result =
    Boolean(folder?.isArchive) ||
    (folder?.parent != null &&
      (await isFolderArchived(baseUrl, accessToken, folder.parent.id, cache)));

  cache.set(folderId, result);
  return result;
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  _event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<MarketoFormsResponse> => {
  const { clientId, clientSecret, munchkinId } =
    context.appInstallationParameters as AppInstallationParameters;

  const auth = await getMarketoToken(clientId, clientSecret, munchkinId);
  const baseUrl = `https://${munchkinId}.mktorest.com`;

  const { response, body: formsResponse } = await marketoGet<MarketoFormRecord>(
    baseUrl,
    '/rest/asset/v1/forms.json?maxReturn=200',
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

  const folderArchiveCache = new Map<number, boolean>();
  const folderArchiveChecks = await Promise.all(
    folderIds.map(
      async (folderId) =>
        [
          folderId,
          await isFolderArchived(baseUrl, auth.access_token, folderId, folderArchiveCache),
        ] as const
    )
  );
  const archivedFolderIds = new Set(
    folderArchiveChecks.filter(([, isArchived]) => isArchived).map(([folderId]) => folderId)
  );

  const mappedResponse = forms
    .filter((form) => !form.folder || !archivedFolderIds.has(form.folder.value))
    .map(({ id, url, name }) => ({ id, url, name }));

  return {
    forms: mappedResponse,
  };
};
