import { PageAppSDK, ConfigAppSDK } from '@contentful/app-sdk';
import { ERROR_MESSAGES } from './constants/messages';

/**
 * Call a specified app action and return the result if there are no errors or processing states. The function is written such that processing and failure states are considered
 * "non-happy paths". Returning the result implies that the call was successful and the happy path is complete.
 * @param sdk - The Contentful SDK instance
 * @param actionName - The name of the app action to call
 * @param parameters - The parameters to pass to the app action
 * @returns The the appropriate object based on the call status (failed, succeeded, processing). Ideally we get the success and the result object
 *          matches the expected type defined by the generic.
 */
export async function callAppActionWithResult<T>(
  sdk: PageAppSDK | ConfigAppSDK,
  actionName: string,
  parameters: Record<string, unknown>
): Promise<T> {
  const appDefinitionId = sdk.ids.app;

  if (!appDefinitionId) {
    throw new Error('App definition ID not found');
  }

  const appActionId = await getAppActionId(sdk, actionName);
  if (!appActionId) {
    throw new Error('App action not found');
  }

  const response = await sdk.cma.appActionCall.createWithResult(
    {
      appDefinitionId,
      appActionId,
    },
    {
      parameters,
    }
  );

  if (response.sys.status === 'failed') {
    console.error(`App action "${actionName}" failed`, response.sys.error);
    throw new Error('App action failed');
  } else if (response.sys.status === 'processing') {
    throw new Error(
      `Incomplete request, app action: ${actionName} is in the state of "Processing"`
    );
  }

  return response.sys.result as unknown as T;
}

/**
 * Fetches the app action ID by name from the current environment
 * @param sdk - The Contentful SDK instance
 * @param actionName - The name of the app action to find
 * @returns The app action ID
 * @throws Error if the app action is not found
 */
async function getAppActionId(sdk: PageAppSDK | ConfigAppSDK, actionName: string): Promise<string> {
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
