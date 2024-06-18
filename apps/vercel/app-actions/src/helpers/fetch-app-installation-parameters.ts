import { FreeFormParameters, PlainClientAPI } from 'contentful-management';
import { AppInstallationContextProps, AppInstallationParameters } from '../types';

const REQUIRED_PARAMS = [
  'vercelAccessToken',
  'selectedProject',
  'contentTypePreviewPathSelections',
  'selectedApiPath',
  'teamId',
];

function assertAppInstallationParameters(
  parameters: FreeFormParameters | undefined
): asserts parameters is AppInstallationParameters {
  if (!parameters) throw new Error('No parameters found on appInstallation');
  if (typeof parameters !== 'object') throw new TypeError('Invalid parameters type');
  for (const requiredParam of REQUIRED_PARAMS) {
    if (!(requiredParam in parameters))
      throw new TypeError(`'${requiredParam}' missing from parameters`);
  }
}

export const fetchAppInstallationParameters = async (
  context: AppInstallationContextProps,
  cmaClient: PlainClientAPI
): Promise<AppInstallationParameters> => {
  const { spaceId, environmentId, appInstallationId } = context;
  const appInstallation = await cmaClient.appInstallation.get({
    spaceId,
    environmentId,
    appDefinitionId: appInstallationId,
  });
  const parameters = appInstallation.parameters;
  assertAppInstallationParameters(parameters);
  return parameters;
};
