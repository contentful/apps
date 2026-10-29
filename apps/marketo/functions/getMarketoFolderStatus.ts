import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { getMarketoToken } from './getMarketoToken';
import { isRateLimited, marketoGet } from './marketoGet';
import type {
  AppInstallationParameters,
  MarketoFolderRecord,
  MarketoFolderRef,
  MarketoFolderStatusResponse,
} from '../src/types';

// Keeps each call to a small, bounded number of Marketo requests so the
// caller can pace calls against Marketo's per-instance rate limit.
const MAX_FOLDERS_PER_CALL = 10;
const MAX_CONCURRENT_LOOKUPS = 2;

// Folders arrive as "Folder:123,Program:45".
const parseFolders = (value: unknown): MarketoFolderRef[] =>
  String(value ?? '')
    .split(',')
    .map((entry) => entry.match(/^(Folder|Program):(\d+)$/))
    .filter((match) => match !== null)
    .map(([, type, id]) => ({ id: Number(id), type: type as MarketoFolderRef['type'] }))
    .slice(0, MAX_FOLDERS_PER_CALL);

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

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<MarketoFolderStatusResponse> => {
  const { clientId, clientSecret, munchkinId } =
    context.appInstallationParameters as AppInstallationParameters;
  const folders = parseFolders((event.body as { folders?: unknown } | undefined)?.folders);

  const auth = await getMarketoToken(clientId, clientSecret, munchkinId);
  const baseUrl = `https://${munchkinId}.mktorest.com`;

  const lookups = await mapWithConcurrency(folders, MAX_CONCURRENT_LOOKUPS, async (folder) => {
    const { response, body } = await marketoGet<MarketoFolderRecord>(
      baseUrl,
      `/rest/asset/v1/folder/${folder.id}.json?type=${folder.type}`,
      auth.access_token
    );
    if (isRateLimited(body)) {
      return null;
    }
    // Any other failure keeps the folder's forms visible: showing a stray
    // archived form is better than hiding a live one.
    if (!body.success) {
      const codes = (body.errors ?? []).map((error) => error.code).join(',');
      console.error(
        `Marketo folder lookup failed for folder ${folder.id}: status=${response.status} errors=${codes}`
      );
    }
    return { ...folder, isArchive: Boolean(body.success && body.result?.[0]?.isArchive) };
  });

  const checked = lookups.filter((lookup) => lookup !== null);
  return {
    folders: checked,
    ...(checked.length < folders.length && { rateLimited: true }),
  };
};
