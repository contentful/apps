import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { VALIDATION_MESSAGES } from '../src/const';
import type { CompleteAsanaOAuthResponse } from '../src/types';
import { getOAuthSdk } from './initiateOauth';

type CompleteOauthRequestBody = {
  code?: string;
  state?: string;
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<CompleteAsanaOAuthResponse> => {
  const body = event.body as CompleteOauthRequestBody | undefined;
  const code = body?.code?.trim();
  const state = body?.state?.trim();

  if (!code || !state) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.oauthCodeRequired,
    };
  }

  const sdk = getOAuthSdk(context);

  try {
    const exchangeResponse = await sdk.exchange({ code, state });
    return {
      success: exchangeResponse.success,
      message: exchangeResponse.success
        ? VALIDATION_MESSAGES.oauthConnected
        : VALIDATION_MESSAGES.oauthConnectFailed,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : VALIDATION_MESSAGES.oauthConnectFailed,
    };
  }
};
