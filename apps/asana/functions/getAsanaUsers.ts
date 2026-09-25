import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import type { GetAsanaUsersResponse } from '../src/types';
import { getAsanaAccessToken, searchUsers } from './asanaClient';

type GetAsanaUsersRequest = {
  workspaceGid?: string;
  query?: string;
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<GetAsanaUsersResponse> => {
  const body = (event.body as GetAsanaUsersRequest | undefined) ?? {};

  if (!body.workspaceGid?.trim()) {
    return {
      users: [],
    };
  }

  const accessToken = await getAsanaAccessToken(event, context);
  if (!accessToken) {
    return {
      users: [],
    };
  }

  try {
    const users = await searchUsers(accessToken, body.workspaceGid.trim(), body.query ?? '');
    return { users };
  } catch {
    throw new Error('Could not search Asana users.');
  }
};
