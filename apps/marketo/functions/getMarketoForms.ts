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
  MarketoAssetContainerType,
  MarketoFolderRecord,
  MarketoFormRecord,
  MarketoFormsResponse,
  MarketoProgramRecord,
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

// Marketo only ever puts the archive flag (isArchive) on a Folder. A
// Program has no archive flag of its own -- Adobe's documented Program
// schema has no isArchive -- so a Program is archived only in the sense
// that the Folder containing it is archived. The two container types also
// use different field names for their upward pointer: a Folder's parent is
// `parent` (Folder or Program), while a Program's parent is always `folder`
// (always a Folder, never another Program). The walk must dispatch on
// container type to follow the right edge, or it silently dead-ends at
// every Program node and misses any archived ancestor above it.
const containerCacheKey = (containerType: MarketoAssetContainerType, containerId: number) =>
  `${containerType}:${containerId}`;

const fetchFolder = async (baseUrl: string, accessToken: string, folderId: number) => {
  const { body } = await marketoGet<MarketoFolderRecord>(
    baseUrl,
    `/rest/asset/v1/folder/${folderId}.json?type=Folder`,
    accessToken
  );
  return body.result?.[0];
};

const fetchProgram = async (baseUrl: string, accessToken: string, programId: number) => {
  const { body } = await marketoGet<MarketoProgramRecord>(
    baseUrl,
    `/rest/asset/v1/program/${programId}.json`,
    accessToken
  );
  return body.result?.[0];
};

const isContainerArchived = async (
  baseUrl: string,
  accessToken: string,
  containerType: MarketoAssetContainerType,
  containerId: number,
  cache: Map<string, boolean>,
  visited: Set<string> = new Set()
): Promise<boolean> => {
  const key = containerCacheKey(containerType, containerId);
  const cached = cache.get(key);
  if (cached != null) return cached;

  // Guard against a corrupt/self-referential parent chain (plausible in a
  // long-lived Marketo instance) looping forever.
  if (visited.has(key)) {
    cache.set(key, false);
    return false;
  }
  visited.add(key);

  let result: boolean;
  if (containerType === 'Program') {
    const program = await fetchProgram(baseUrl, accessToken, containerId);
    // A Program can never be archived itself -- only climb to its folder.
    result =
      program?.folder != null &&
      (await isContainerArchived(
        baseUrl,
        accessToken,
        program.folder.type,
        program.folder.value,
        cache,
        visited
      ));
  } else {
    const folder = await fetchFolder(baseUrl, accessToken, containerId);
    result =
      Boolean(folder?.isArchive) ||
      (folder?.parent != null &&
        (await isContainerArchived(
          baseUrl,
          accessToken,
          folder.parent.type,
          folder.parent.id,
          cache,
          visited
        )));
  }

  cache.set(key, result);
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
  const containers = new Map<string, { type: MarketoAssetContainerType; id: number }>();
  for (const form of forms) {
    if (form.folder == null) continue;
    const key = containerCacheKey(form.folder.type, form.folder.value);
    containers.set(key, { type: form.folder.type, id: form.folder.value });
  }

  const folderArchiveCache = new Map<string, boolean>();
  const archiveChecks = await Promise.all(
    [...containers.entries()].map(
      async ([key, { type, id }]) =>
        [key, await isContainerArchived(baseUrl, auth.access_token, type, id, folderArchiveCache)] as const
    )
  );
  const archivedContainerKeys = new Set(
    archiveChecks.filter(([, isArchived]) => isArchived).map(([key]) => key)
  );

  const mappedResponse = forms
    .filter(
      (form) =>
        !form.folder || !archivedContainerKeys.has(containerCacheKey(form.folder.type, form.folder.value))
    )
    .map(({ id, url, name }) => ({ id, url, name }));

  return {
    forms: mappedResponse,
  };
};
