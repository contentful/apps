import { getInstallationParametersFromCma } from './getInstallationParameters';
import { NotFoundException } from '../errors';

export async function getWorkspaceId(
  spaceId: string,
  environmentId: string,
  workspaceIdFromParameters?: string
): Promise<string> {
  if (workspaceIdFromParameters) {
    return workspaceIdFromParameters;
  }
  let workspaceId;
  const installationParameters = await getInstallationParametersFromCma(spaceId, environmentId);
  const workspaces = installationParameters?.workspaces;
  if (workspaces && workspaces.length > 0) {
    workspaceId = workspaces[0];
  }

  if (!workspaceId) {
    throw new NotFoundException({ errMessage: 'WorkspaceId not found', environmentId, spaceId });
  }
  return workspaceId;
}
