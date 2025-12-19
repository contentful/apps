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

export const createEntries = async (
  sdk: PageAppSDK | ConfigAppSDK,
  contentTypeIds: string[],
  entries?: any[], // Optional: entries from plan to avoid re-analysis
  documentJson?: unknown // Optional: document JSON if entries not provided (fallback)
) => {
  try {
    const appDefinitionId = sdk.ids.app;

    if (!appDefinitionId) {
      throw new Error('App definition ID not found');
    }

    const appActionId = await getAppActionId(sdk, 'createEntries');
    const result = await sdk.cma.appActionCall.createWithResult(
      {
        appDefinitionId,
        appActionId,
      },
      {
        parameters: {
          contentTypeIds,
          ...(entries && entries.length > 0 ? { entries } : {}),
          ...(documentJson && (!entries || entries.length === 0) ? { documentJson } : {}),
        },
      }
    );

    if ('errors' in result && result.errors) {
      throw new Error(JSON.stringify(result.errors));
    }

    return result;
  } catch (error) {
    console.error('Error creating entries from document', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to create entries from document'
    );
  }
};

export const createPreview = async (
  sdk: PageAppSDK | ConfigAppSDK,
  contentTypeIds: string[],
  documentJson: unknown
) => {
  try {
    const appDefinitionId = sdk.ids.app;

    if (!appDefinitionId) {
      throw new Error('App definition ID not found');
    }

    console.log('Creating preview from document', documentJson, contentTypeIds);

    const appActionId = await getAppActionId(sdk, 'createPreview');
    const result = await sdk.cma.appActionCall.createWithResult(
      {
        appDefinitionId,
        appActionId,
      },
      {
        parameters: { contentTypeIds, documentJson },
      }
    );

    if ('errors' in result && result.errors) {
      throw new Error(JSON.stringify(result.errors));
    }

    return result;
  } catch (error) {
    console.error('Error creating plan from document', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create plan from document');
  }
};
