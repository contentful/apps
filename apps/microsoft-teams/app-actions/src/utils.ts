import { AppActionCallContext } from '@contentful/node-apps-toolkit';

export async function fetchTenantId(
  cma: AppActionCallContext['cma'],
  appInstallationId: string
): Promise<string> {
  const appInstallation = await cma.appInstallation.get({ appDefinitionId: appInstallationId });
  const appInstallationParams = appInstallation.parameters;
  if (typeof appInstallationParams === 'object' && 'tenantId' in appInstallationParams) {
    return appInstallationParams['tenantId'];
  } else {
    throw new Error('No Tenant Id was found in the installation parameters');
  }
}
