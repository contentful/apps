import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import type { ValidateAsanaCredentialsResponse } from '../src/types';
import { VALIDATION_MESSAGES } from '../src/const';
import { getAsanaAccessToken, getWorkspaces } from './asanaClient';

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<ValidateAsanaCredentialsResponse> => {
  // Config Screen "Test key" passes the not-yet-saved API key value directly so it can be
  // validated before the installation parameters are persisted.
  const body = (event.body as { apiKey?: string } | undefined) ?? {};
  const providedApiKey = body.apiKey?.trim();

  const accessToken = providedApiKey || (await getAsanaAccessToken(event, context));

  if (!accessToken) {
    throw new Error(VALIDATION_MESSAGES.tokenRequired);
  }

  try {
    const workspaces = await getWorkspaces(accessToken);
    return {
      valid: true,
      message: workspaces.length
        ? VALIDATION_MESSAGES.validCredentials
        : 'Your Asana token is valid, but no workspaces are visible to it.',
    };
  } catch (error) {
    return {
      valid: false,
      message: error instanceof Error ? error.message : VALIDATION_MESSAGES.invalidCredentials,
    };
  }
};
