import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { MarketoAuthenticationError, MarketoApiError } from './exceptions';
import type { AppInstallationParameters, MarketoFormsResponse } from '../src/types';

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  _event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<MarketoFormsResponse> => {
  const { clientId, clientSecret, munchkinId } =
    context.appInstallationParameters as AppInstallationParameters;

  const baseUrl = `https://${munchkinId}.mktorest.com`;

  const authResponse = await fetch(
    `${baseUrl}/identity/oauth/token?grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
  );

  if (!authResponse.ok) {
    throw new MarketoAuthenticationError(
      `Marketo authentication failed: ${authResponse.status} ${authResponse.statusText}`
    );
  }

  const auth = await authResponse.json();

  const response = await fetch(`${baseUrl}/rest/asset/v1/forms.json?maxReturn=200`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.access_token}`,
    },
  });

  const formsResponse = await response.json();

  if (!response.ok || !formsResponse.success) {
    const errorMessage = formsResponse.message || 'Marketo getForms request failed';

    throw new MarketoApiError(errorMessage, {
      statusCode: response.status,
      errors: formsResponse.errors,
    });
  }

  const mappedResponse = formsResponse.result.map((item: any) => {
    return {
      id: item.id,
      url: item.url,
      name: item.name,
    };
  });

  return {
    forms: mappedResponse,
  };
};
