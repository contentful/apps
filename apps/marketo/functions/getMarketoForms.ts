import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { MarketoAuthenticationError, MarketoApiError } from './exceptions';

type AppInstallationParameters = {
  clientId: string;
  clientSecret: string;
  munchkinId: string;
};

export type MarketoFormsResponse = {
  forms: { id: number; url: string; name: string }[];
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  _event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<MarketoFormsResponse> => {
  const { clientId, clientSecret, munchkinId } =
    context.appInstallationParameters as AppInstallationParameters;

  const authUrl = `https://${munchkinId}.mktorest.com/identity/oauth/token?${new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  }).toString()}`;

  const authResponse = await fetch(authUrl);

  if (!authResponse.ok) {
    throw new MarketoAuthenticationError(
      `Marketo authentication failed: ${authResponse.status} ${authResponse.statusText}`
    );
  }

  const auth = await authResponse.json();

  const response = await fetch(
    `https://${munchkinId}.mktorest.com/rest/asset/v1/forms.json?maxReturn=200`,
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
