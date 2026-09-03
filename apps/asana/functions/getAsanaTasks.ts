import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import type { GetAsanaTasksResponse } from '../src/types';
import { getAsanaAccessToken, getProjectTasks, searchTasks } from './asanaClient';

type GetAsanaTasksRequest = {
  projectGid?: string;
  workspaceGid?: string;
  query?: string;
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<GetAsanaTasksResponse> => {
  const body = (event.body as GetAsanaTasksRequest | undefined) ?? {};

  if (!body.workspaceGid?.trim()) {
    return {
      tasks: [],
    };
  }

  const accessToken = await getAsanaAccessToken(event, context);
  if (!accessToken) {
    return {
      tasks: [],
    };
  }

  try {
    const tasks = body.projectGid?.trim()
      ? await getProjectTasks(accessToken, body.projectGid.trim(), body.query ?? '')
      : await searchTasks(accessToken, body.workspaceGid.trim(), body.query ?? '');
    return { tasks };
  } catch {
    throw new Error('Could not search Asana tasks.');
  }
};
