import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { VALIDATION_MESSAGES } from '../src/const';
import type { DisconnectAsanaResponse } from '../src/types';
import { getOAuthSdk } from './initiateOauth';

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  _event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<DisconnectAsanaResponse> => {
  const sdk = getOAuthSdk(context);

  try {
    await sdk.revoke();
    return { success: true, message: VALIDATION_MESSAGES.oauthDisconnected };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : VALIDATION_MESSAGES.oauthDisconnectFailed,
    };
  }
};
