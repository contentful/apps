import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import type { GetAsanaWorkspacesResponse } from '../src/types';
import { getAsanaAccessToken, getWorkspaces } from './asanaClient';

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<GetAsanaWorkspacesResponse> => {
  const accessToken = await getAsanaAccessToken(event, context);
  const workspaces = await getWorkspaces(accessToken);
  return { workspaces };
};
