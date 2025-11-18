import { PageAppSDK, ConfigAppSDK } from '@contentful/app-sdk';

/**
 * Fetches the app action ID by name from the current environment
 * @param sdk - The Contentful SDK instance
 * @param actionName - The name of the app action to find
 * @returns The app action ID
 * @throws Error if the app action is not found
 */
export async function getAppActionId(
  sdk: PageAppSDK | ConfigAppSDK,
  actionName: string
): Promise<string> {
  const appActions = await sdk.cma.appAction.getManyForEnvironment({
    environmentId: sdk.ids.environment,
    spaceId: sdk.ids.space,
  });

  const appAction = appActions.items.find((action) => action.name === actionName);

  if (!appAction) {
    throw new Error(`App action "${actionName}" not found`);
  }

  return appAction.sys.id;
}
