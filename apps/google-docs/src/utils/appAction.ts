import { PageAppSDK, ConfigAppSDK } from '@contentful/app-sdk';
import { FinalEntriesResult } from '../../functions/agents/documentParserAgent/schema';

/** Contentful app action responses wrap the result in sys.result */
interface AppActionResponse<T> {
  sys: { result: T };
}

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

/**
 * Generic helper to call an app action with parameters
 * @param sdk - The Contentful SDK instance
 * @param actionName - The name of the app action to call
 * @param parameters - The parameters to pass to the app action
 * @returns The result from the app action
 * @throws Error if the app action fails
 */
export async function callAppAction<T = unknown>(
  sdk: PageAppSDK | ConfigAppSDK,
  actionName: string,
  parameters: Record<string, unknown>
): Promise<T> {
  try {
    const appDefinitionId = sdk.ids.app;

    if (!appDefinitionId) {
      throw new Error('App definition ID not found');
    }

    const appActionId = await getAppActionId(sdk, actionName);
    if (!appActionId) {
      throw new Error(`App action "${actionName}" not found`);
    }
    const result = await sdk.cma.appActionCall.createWithResult(
      {
        appDefinitionId,
        appActionId,
      },
      {
        parameters,
      }
    );

    if ('errors' in result && result.errors) {
      throw new Error(JSON.stringify(result.errors));
    }

    return result as T;
  } catch (error) {
    console.error(`Error calling app action "${actionName}"`, error);
    throw new Error(
      error instanceof Error ? error.message : `Failed to call app action "${actionName}"`
    );
  }
}

/**
 * Call an app action and get the raw response (for OAuth and other special cases)
 * @param sdk - The Contentful SDK instance
 * @param actionName - The name of the app action to call
 * @param parameters - The parameters to pass to the app action
 * @returns The raw response with response.body
 */
export async function callAppActionWithResponse(
  sdk: PageAppSDK | ConfigAppSDK,
  actionName: string,
  parameters: Record<string, unknown>
): Promise<{ response: { body: string } }> {
  try {
    const appDefinitionId = sdk.ids.app;

    if (!appDefinitionId) {
      throw new Error('App definition ID not found');
    }

    const appActionId = await getAppActionId(sdk, actionName);
    if (!appActionId) {
      throw new Error(`App action "${actionName}" not found`);
    }

    const result = await sdk.cma.appActionCall.createWithResponse(
      {
        appDefinitionId,
        appActionId,
      },
      {
        parameters,
      }
    );

    return result;
  } catch (error) {
    console.error(`Error calling app action "${actionName}"`, error);
    throw new Error(
      error instanceof Error ? error.message : `Failed to call app action "${actionName}"`
    );
  }
}

/**
 * Analyzes content type structure and relationships using AI
 * @param sdk - The Contentful SDK instance
 * @param contentTypeIds - Array of content type IDs to analyze
 * @returns Analysis result from the app action
 */
export const createContentTypesAnalysisAction = async (
  sdk: PageAppSDK | ConfigAppSDK,
  contentTypeIds: string[],
  oauthToken: string
) => {
  return callAppAction(sdk, 'createContentTypesAnalysis', { contentTypeIds, oauthToken });
};

/**
 * Processes a document and extracts entries for preview
 * @param sdk - The Contentful SDK instance
 * @param contentTypeIds - Array of content type IDs to use for entry creation
 * @param documentId - The Google Doc ID to process
 * @param oauthToken - OAuth token for Google API access
 * @returns The extracted entries result
 */
export const createPreviewAction = async (
  sdk: PageAppSDK | ConfigAppSDK,
  contentTypeIds: string[],
  documentId: string,
  oauthToken: string
): Promise<FinalEntriesResult> => {
  const response = await callAppAction<AppActionResponse<FinalEntriesResult>>(
    sdk,
    'createPreview',
    { contentTypeIds, documentId, oauthToken }
  );
  return response.sys.result;
};
