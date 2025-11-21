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

export const createEntriesFromDocumentAction = async (
  sdk: PageAppSDK | ConfigAppSDK,
  contentTypeIds: string[],
  googleDocUrl: string
) => {
  try {
    const appDefinitionId = sdk.ids.app;

    if (!appDefinitionId) {
      throw new Error('App definition ID not found');
    }

    const appActionId = await getAppActionId(sdk, 'createEntriesFromDocumentAction');

    const result = await sdk.cma.appActionCall.createWithResult(
      {
        appDefinitionId,
        appActionId,
      },
      {
        parameters: { contentTypeIds, googleDocUrl },
      }
    );

    if ('errors' in result && result.errors) {
      throw new Error(JSON.stringify(result.errors));
    }

    return result;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to analyze content types');
  }
};
