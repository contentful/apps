import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import type { GetAsanaProjectsResponse } from '../src/types';
import { getAsanaAccessToken, searchProjects } from './asanaClient';

type ProjectRequestBody = {
  workspaceGid?: string;
  query?: string;
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<GetAsanaProjectsResponse> => {
  const body = event.body as ProjectRequestBody | undefined;
  const workspaceGid = body?.workspaceGid?.trim();
  const query = body?.query?.trim() ?? '';

  if (!workspaceGid) {
    return { projects: [] };
  }

  const accessToken = await getAsanaAccessToken(event, context);
  const projects = await searchProjects(accessToken, workspaceGid, query);
  return { projects };
};
