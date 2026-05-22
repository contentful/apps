import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import type { GetAsanaTasksResponse } from '../src/types';
import { getPersonalAccessToken, getProjectTasks, searchTasks } from './asanaClient';

type GetAsanaTasksRequest = {
  projectGid?: string;
  workspaceGid?: string;
  query?: string;
  personalAccessToken?: string;
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<GetAsanaTasksResponse> => {
  const personalAccessToken = getPersonalAccessToken(event, context);
  const body = (event.body as GetAsanaTasksRequest | undefined) ?? {};

  if (!personalAccessToken) {
    return {
      tasks: [],
    };
  }

  if (!body.workspaceGid?.trim()) {
    return {
      tasks: [],
    };
  }

  try {
    const tasks = body.projectGid?.trim()
      ? await getProjectTasks(personalAccessToken, body.projectGid.trim(), body.query ?? '')
      : await searchTasks(personalAccessToken, body.workspaceGid.trim(), body.query ?? '');
    return { tasks };
  } catch {
    throw new Error('Could not search Asana tasks.');
  }
};
