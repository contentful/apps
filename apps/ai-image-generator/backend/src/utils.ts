import { PlainClientAPI } from 'contentful-management';

export async function fetchOpenAiApiKey(
  cma: PlainClientAPI,
  appInstallationId: string
): Promise<string> {
  const appInstallation = await cma.appInstallation.get({ appDefinitionId: appInstallationId });
  const appInstallationParams = appInstallation.parameters;
  if (typeof appInstallationParams === 'object' && 'apiKey' in appInstallationParams) {
    return appInstallationParams['apiKey'];
  } else {
    throw new Error('No OpenAI API Key was found in the installation parameters');
  }
}
