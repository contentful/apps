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
// that something above it in its ancestry is archived. The two container
// types also use different field names for their upward pointer: a
// Folder's parent is `parent`, a Program's is `folder` -- both can target
// either a Folder or a Program (Adobe's example response for Program
// happens to show a Folder, but nothing in the public spec rules out a
// Program nested under another Program via the same field). The walk must
// dispatch on container type to follow the right edge, or it silently
// dead-ends at every Program node and misses any archived ancestor above
// it; it must not assume Program's parent is always a Folder.
const containerCacheKey = (containerType: MarketoAssetContainerType, containerId: number) =>
  `${containerType}:${containerId}`;

// A result of `null` means the lookup itself failed (non-OK response,
// Marketo-level error, network error, or an empty/malformed body) -- as
// opposed to a successful lookup that simply found nothing, which isn't a
// case the Asset API actually returns for a valid id. Callers must treat
// `null` as "unknown, assume archived" rather than "not archived": a form
// whose container state can't be resolved is exactly the kind of stale
// reference this filter exists to catch, so failing open here would
// readmit the thing we're trying to exclude.
const fetchFolder = async (
  baseUrl: string,
  accessToken: string,
  folderId: number
): Promise<MarketoFolderRecord | null> => {
  try {
    const { response, body } = await marketoGet<MarketoFolderRecord>(
      baseUrl,
      `/rest/asset/v1/folder/${folderId}.json?type=Folder`,
      accessToken
    );
    if (!response.ok || !body.success || body.result?.[0] == null) {
      console.error(
        `Marketo folder lookup failed for folder ${folderId}: status=${response.status} success=${body.success} message=${body.message}`
      );
      return null;
    }
    return body.result[0];
  } catch (error) {
    console.error(`Marketo folder lookup threw for folder ${folderId}:`, error);
    return null;
  }
};

const fetchProgram = async (
  baseUrl: string,
  accessToken: string,
  programId: number
): Promise<MarketoProgramRecord | null> => {
  try {
    const { response, body } = await marketoGet<MarketoProgramRecord>(
      baseUrl,
      `/rest/asset/v1/program/${programId}.json`,
      accessToken
    );
    if (!response.ok || !body.success || body.result?.[0] == null) {
      console.error(
        `Marketo program lookup failed for program ${programId}: status=${response.status} success=${body.success} message=${body.message}`
      );
      return null;
    }
    return body.result[0];
  } catch (error) {
    console.error(`Marketo program lookup threw for program ${programId}:`, error);
    return null;
  }
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
    if (program == null) {
      // Lookup failed outright -- fail closed rather than readmitting a
      // form whose container state is unknown.
      result = true;
    } else if (program.folder == null) {
      // A Program can never be archived itself -- only its folder chain
      // can tell us. No folder reference at all means nothing above it to
      // check, so it's not archived.
      result = false;
    } else {
      result = await isContainerArchived(
        baseUrl,
        accessToken,
        program.folder.type,
        program.folder.value,
        cache,
        visited
      );
    }
  } else {
    const folder = await fetchFolder(baseUrl, accessToken, containerId);
    if (folder == null) {
      result = true;
    } else {
      result =
        Boolean(folder.isArchive) ||
        (folder.parent != null &&
          (await isContainerArchived(
            baseUrl,
            accessToken,
            folder.parent.type,
            folder.parent.id,
            cache,
            visited
          )));
    }
  }

  cache.set(key, result);
  return result;
};

const FORMS_PAGE_SIZE = 200;

// forms.json has no total-count or "more results" field, so the only
// reliable stop condition is a page coming back shorter than the requested
// page size (including empty). A customer with more forms than one page's
// worth would otherwise have everything past the first MAX_RETURN silently
// dropped -- including forms whose archive status we'd never even get a
// chance to check.
const fetchAllForms = async (
  baseUrl: string,
  accessToken: string
): Promise<MarketoFormRecord[]> => {
  const forms: MarketoFormRecord[] = [];
  let offset = 0;

  while (true) {
    const { response, body } = await marketoGet<MarketoFormRecord>(
      baseUrl,
      `/rest/asset/v1/forms.json?maxReturn=${FORMS_PAGE_SIZE}&offset=${offset}`,
      accessToken
    );

    if (!response.ok || !body.success) {
      throw new MarketoApiError(body.message || 'Marketo getForms request failed', {
        statusCode: response.status,
        errors: body.errors ?? [],
      });
    }

    const page = body.result ?? [];
    forms.push(...page);

    if (page.length < FORMS_PAGE_SIZE) break;
    offset += FORMS_PAGE_SIZE;
  }

  return forms;
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  _event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<MarketoFormsResponse> => {
  const { clientId, clientSecret, munchkinId } =
    context.appInstallationParameters as AppInstallationParameters;

  const auth = await getMarketoToken(clientId, clientSecret, munchkinId);
  const baseUrl = `https://${munchkinId}.mktorest.com`;

  const forms = await fetchAllForms(baseUrl, auth.access_token);
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
