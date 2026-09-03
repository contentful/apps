import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import type { ExchangeAsanaOAuthCodeResponse } from '../src/types';
import { exchangeAuthorizationCode } from './asanaClient';

type ExchangeAsanaOAuthCodeRequest = {
  code?: string;
  codeVerifier?: string;
  redirectUri?: string;
  clientId?: string;
  clientSecret?: string;
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: FunctionEventContext
): Promise<ExchangeAsanaOAuthCodeResponse> => {
  const body = (event.body as ExchangeAsanaOAuthCodeRequest | undefined) ?? {};

  if (
    !body.code ||
    !body.codeVerifier ||
    !body.redirectUri ||
    !body.clientId ||
    !body.clientSecret
  ) {
    return { success: false, message: 'Missing required OAuth parameters.' };
  }

  try {
    const tokens = await exchangeAuthorizationCode({
      clientId: body.clientId,
      clientSecret: body.clientSecret,
      redirectUri: body.redirectUri,
      code: body.code,
      codeVerifier: body.codeVerifier,
    });

    return {
      success: true,
      message: 'Connected to Asana.',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error && error.message ? error.message : 'Could not connect to Asana.',
    };
  }
};
