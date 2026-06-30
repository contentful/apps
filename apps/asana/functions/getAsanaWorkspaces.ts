import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import type { GetAsanaWorkspacesResponse } from '../src/types';
import { getPersonalAccessToken, getWorkspaces } from './asanaClient';

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<GetAsanaWorkspacesResponse> => {
  const personalAccessToken = getPersonalAccessToken(event, context);
  const workspaces = await getWorkspaces(personalAccessToken);
  return { workspaces };
};
