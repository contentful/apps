import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { MarketoApiError } from './exceptions';
import { getMarketoToken } from './getMarketoToken';
import type { AppInstallationParameters, FormObject, MarketoFormsResponse } from '../src/types';

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

  const response = await fetch(
    `${baseUrl}/rest/asset/v1/forms.json?maxReturn=${FORMS_PAGE_SIZE}&offset=${offset}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.access_token}`,
      },
    }
  );

  const formsResponse = await response.json();

  if (!response.ok || !formsResponse.success) {
    const errorMessage = formsResponse.message || 'Marketo getForms request failed';

    throw new MarketoApiError(errorMessage, {
      statusCode: response.status,
      errors: formsResponse.errors,
    });
  }

  // Marketo answers an offset past the last form with success and no result.
  const forms: FormObject[] = formsResponse.result ?? [];

  return {
    forms: forms.map(({ id, url, name }) => ({ id, url, name })),
    ...(forms.length === FORMS_PAGE_SIZE && { nextOffset: offset + FORMS_PAGE_SIZE }),
  };
};
