import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { MarketoApiError } from './exceptions';
import { getMarketoToken } from './getMarketoToken';
import type { AppInstallationParameters, MarketoFormsResponse } from '../src/types';

type MarketoForm = {
  id: string;
  url: string;
  name: string;
  folder?: { value: number };
};

const marketoGet = async (baseUrl: string, path: string, accessToken: string) => {
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
const isFolderArchived = async (baseUrl: string, accessToken: string, folderId: number) => {
  const { body } = await marketoGet(
    baseUrl,
    `/rest/asset/v1/folder/${folderId}.json?type=Folder`,
    accessToken
  );
  return Boolean(body?.success && body.result?.[0]?.isArchive);
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  _event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<MarketoFormsResponse> => {
  const { clientId, clientSecret, munchkinId } =
    context.appInstallationParameters as AppInstallationParameters;

  const auth = await getMarketoToken(clientId, clientSecret, munchkinId);
  const baseUrl = `https://${munchkinId}.mktorest.com`;

  const { response, body: formsResponse } = await marketoGet(
    baseUrl,
    '/rest/asset/v1/forms.json?maxReturn=200',
    auth.access_token
  );

  if (!response.ok || !formsResponse.success) {
    throw new MarketoApiError(formsResponse.message || 'Marketo getForms request failed', {
      statusCode: response.status,
      errors: formsResponse.errors,
    });
  }

  const forms: MarketoForm[] = formsResponse.result;
  const folderIds = [
    ...new Set(forms.map((form) => form.folder?.value).filter((id): id is number => id != null)),
  ];

  const folderArchiveChecks = await Promise.all(
    folderIds.map(
      async (folderId) =>
        [folderId, await isFolderArchived(baseUrl, auth.access_token, folderId)] as const
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
