import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { INVALID_CREDENTIALS_RESPONSE, VALID_CREDENTIALS_RESPONSE } from '../src/const';
import type { AppInstallationParameters } from '../src/types';
import { getMarketoToken } from './getMarketoToken';

export type ValidateCredentialsResponse = {
  valid: boolean;
  message: string;
};

function getCredentials(
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): AppInstallationParameters {
  const body = event.body as unknown as AppInstallationParameters;
  if (body?.clientId?.trim() && body?.clientSecret?.trim() && body?.munchkinId?.trim()) {
    return body as AppInstallationParameters;
  }

  return context.appInstallationParameters as AppInstallationParameters;
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<ValidateCredentialsResponse> => {
  const creds = getCredentials(event, context);
  const { clientId, clientSecret, munchkinId } = creds;

  try {
    await getMarketoToken(clientId, clientSecret, munchkinId);
    return { valid: true, message: VALID_CREDENTIALS_RESPONSE };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : INVALID_CREDENTIALS_RESPONSE;
    return { valid: false, message: errorMessage };
  }
};
