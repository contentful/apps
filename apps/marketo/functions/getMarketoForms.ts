import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { MarketoApiError } from './exceptions';
import { getMarketoToken } from './getMarketoToken';
import { isRateLimited, marketoGet } from './marketoGet';
import type {
  AppInstallationParameters,
  MarketoFormRecord,
  MarketoFormsResponse,
} from '../src/types';

// Marketo's maximum page size for asset browse endpoints.
const FORMS_PAGE_SIZE = 200;

const parseOffset = (value: unknown) => {
  const offset = Number(value ?? 0);
  return Number.isInteger(offset) && offset >= 0 ? offset : 0;
};

// Returns one page of forms with their folder references. Archive status is
// a folder-level property in Marketo, so the caller checks folders separately
// (getMarketoFolderStatus) and can cache the answers across pages and loads.
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

  if (isRateLimited(formsResponse)) {
    return { rateLimited: true };
  }

  if (!response.ok || !formsResponse.success) {
    throw new MarketoApiError(formsResponse.message || 'Marketo getForms request failed', {
      statusCode: response.status,
      errors: formsResponse.errors ?? [],
    });
  }

  const forms = formsResponse.result ?? [];

  return {
    forms: forms.map(({ id, url, name, folder }) => ({
      id,
      url,
      name,
      ...(folder && { folder: { id: folder.value, type: folder.type } }),
    })),
    ...(forms.length === FORMS_PAGE_SIZE && { nextOffset: offset + FORMS_PAGE_SIZE }),
  };
};
