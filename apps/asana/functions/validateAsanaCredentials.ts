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
  const accessToken = await getAsanaAccessToken(event, context);

  if (!accessToken) {
    return {
      valid: false,
      message: VALIDATION_MESSAGES.tokenRequired,
    };
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
