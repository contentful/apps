import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import type { GetAsanaProjectsResponse } from '../src/types';
import { getPersonalAccessToken, searchProjects } from './asanaClient';

type ProjectRequestBody = {
  workspaceGid?: string;
  query?: string;
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<GetAsanaProjectsResponse> => {
  const personalAccessToken = getPersonalAccessToken(event, context);
  const body = event.body as ProjectRequestBody | undefined;
  const workspaceGid = body?.workspaceGid?.trim();
  const query = body?.query?.trim() ?? '';

  if (!workspaceGid) {
    return { projects: [] };
  }

  const projects = await searchProjects(personalAccessToken, workspaceGid, query);
  return { projects };
};
