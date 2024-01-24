import { AppInstallationProps, FreeFormParameters } from 'contentful-management';
import { AppInstallationParameters, Notification } from '../types';

export const parametersFromAppInstallation = (appInstallation: AppInstallationProps) => {
  const appParameters = appInstallation.parameters;
  assertAppInstallationParameters(appParameters);
  return appParameters;
};

function assertAppInstallationParameters(
  parameters: FreeFormParameters | undefined
): asserts parameters is AppInstallationParameters {
  if (!parameters) throw new Error('No parameters found on appInstallation');
  if (typeof parameters !== 'object') throw new Error('Invalid parameters type');
  if (!('tenantId' in parameters)) throw new Error('tenantId missing from parameters');
  if (!('notifications' in parameters)) throw new Error('notifications missing from parameters');
  assertNotifications(parameters.notifications);
}

function assertNotifications(value: any): asserts value is Notification[] {
  if (!Array.isArray(value))
    throw new Error('invalid format for parameters.notifications (not an array)');
  for (const notification of value) {
    if (typeof notification !== 'object') throw new Error('notification is not an object');
    // we could check for more details but if the object is formulated correctly to here
    // we'll assume it's fine
  }
}
