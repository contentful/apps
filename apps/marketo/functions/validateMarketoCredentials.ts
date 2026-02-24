import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';

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
    return {
      valid: false,
      message: `Marketo authentication failed: ${authResponse.statusText}`,
    };
  }

  const auth = await authResponse.json();
  if (!auth.access_token) {
    return {
      valid: false,
      message: 'Marketo did not return an access token.',
    };
  }

  return { valid: true, message: 'Connection successful. Your Marketo credentials are valid.' };
};
