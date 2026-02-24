import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import {
  INVALID_CLIENT_RESPONSE,
  NO_ACCESS_TOKEN_RESPONSE,
  VALID_CREDENTIALS_RESPONSE,
} from '../src/const';

type AppParameters = {
  clientId: string;
  clientSecret: string;
  munchkinId: string;
};

export type ValidateCredentialsResponse = {
  valid: boolean;
  message: string;
};

function getCredentials(
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): AppParameters {
  const body = event.body as AppParameters;
  if (body?.clientId?.trim() && body?.clientSecret?.trim() && body?.munchkinId?.trim()) {
    return body as AppParameters;
  }

  return context.appInstallationParameters as AppParameters;
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<ValidateCredentialsResponse> => {
  const creds = getCredentials(event, context);
  const { clientId, clientSecret, munchkinId } = creds;

  const authUrl = `https://${munchkinId}.mktorest.com/identity/oauth/token?${new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  }).toString()}`;

  const authResponse = await fetch(authUrl);

  if (!authResponse.ok) {
    let message = INVALID_CLIENT_RESPONSE;

    try {
      const errorBody = (await authResponse.json()) as {
        error?: string;
        error_description?: string;
      };

      if (errorBody?.error_description) {
        message = `Marketo authentication failed: ${errorBody.error_description}`;
      }
    } catch {
      // If munchkin id is invalid it returns {}
    }

    return {
      valid: false,
      message,
    };
  }

  const auth = await authResponse.json();
  if (!auth.access_token) {
    return {
      valid: false,
      message: NO_ACCESS_TOKEN_RESPONSE,
    };
  }

  return { valid: true, message: VALID_CREDENTIALS_RESPONSE };
};
