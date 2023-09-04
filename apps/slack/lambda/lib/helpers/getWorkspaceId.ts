import { getInstallationParametersFromCma } from './getInstallationParameters';
import { NotFoundException } from '../errors';

type GetWorkspaceIdParams = {
  spaceId: string;
  environmentId: string;
  host: string;
  workspaceIdFromParameters?: string;
};

export async function getWorkspaceId(params: GetWorkspaceIdParams): Promise<string> {
  const { spaceId, environmentId, host, workspaceIdFromParameters } = params;

  if (workspaceIdFromParameters) {
    return workspaceIdFromParameters;
  }
  let workspaceId;
  const installationParameters = await getInstallationParametersFromCma(
    spaceId,
    environmentId,
    host
  );
  const workspaces = installationParameters?.workspaces;
  if (workspaces && workspaces.length > 0) {
    workspaceId = workspaces[0];
  }

  if (!workspaceId) {
    throw new NotFoundException({ errMessage: 'WorkspaceId not found', environmentId, spaceId });
  }
  return workspaceId;
}
