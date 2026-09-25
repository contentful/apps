import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import type { CheckAsanaStatusResponse } from '../src/types';
import { getOAuthSdk } from './initiateOauth';

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  _event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<CheckAsanaStatusResponse> => {
  const sdk = getOAuthSdk(context);

  try {
    const token = await sdk.token();
    return { connected: Boolean(token?.accessToken) };
  } catch {
    return { connected: false };
  }
};
