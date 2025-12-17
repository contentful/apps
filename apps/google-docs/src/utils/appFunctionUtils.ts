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
    const availableActions = appActions.items.map((a) => a.name).join(', ');
    console.error(`App action "${actionName}" not found. Available actions: ${availableActions}`);
    throw new Error(
      `App action "${actionName}" not found. Available actions: ${availableActions || 'none'}`
    );
  }

  return appAction.sys.id;
}

export const createEntriesFromDocumentAction = async (
  sdk: PageAppSDK | ConfigAppSDK,
  contentTypeIds: string[],
  documentId: string,
  oauthToken: string
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
        parameters: { contentTypeIds, documentId, oauthToken },
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

export interface GoogleDoc {
  id: string;
  name: string;
  webViewLink: string;
  modifiedTime: string;
}

export interface ListGoogleDocsResponse {
  documents: GoogleDoc[];
  nextPageToken?: string;
}

export const listGoogleDocsAction = async (
  sdk: PageAppSDK | ConfigAppSDK,
  pageToken?: string,
  pageSize?: number
): Promise<ListGoogleDocsResponse> => {
  try {
    const appDefinitionId = sdk.ids.app;

    if (!appDefinitionId) {
      throw new Error('App definition ID not found');
    }

    // Get all app actions to debug if needed
    const appActions = await sdk.cma.appAction.getManyForEnvironment({
      environmentId: sdk.ids.environment,
      spaceId: sdk.ids.space,
    });

    const listDocsAction = appActions.items.find((action) => action.name === 'listGoogleDocs');
    if (!listDocsAction) {
      const availableActions = appActions.items.map((a) => a.name).join(', ');
      throw new Error(
        `App action "listGoogleDocs" not found. Available actions: ${
          availableActions || 'none'
        }. ` + `Please ensure the app has been rebuilt and redeployed with the new functions.`
      );
    }

    const response = await sdk.cma.appActionCall.createWithResponse(
      {
        appDefinitionId,
        appActionId: listDocsAction.sys.id,
      },
      {
        parameters: { pageToken, pageSize },
      }
    );

    // Parse the response body - it may be double-encoded
    const parsed = JSON.parse(response.response.body);

    // If the parsed result has a 'body' property that's a string, parse it again
    // This handles the case where Contentful wraps our response
    if (parsed.body && typeof parsed.body === 'string') {
      const innerParsed = JSON.parse(parsed.body);
      // If the inner parsed result has documents, return it directly
      if (innerParsed.documents) {
        return innerParsed;
      }
      // Otherwise return the inner parsed result
      return innerParsed;
    }

    // If parsed result has documents directly, return it
    if (parsed.documents) {
      return parsed;
    }

    // Otherwise return the parsed result as-is
    return parsed;
  } catch (error) {
    console.error('Error listing Google Docs', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to list Google Docs');
  }
};

export const fetchGoogleDocAction = async (
  sdk: PageAppSDK | ConfigAppSDK,
  documentId: string
): Promise<unknown> => {
  try {
    const appDefinitionId = sdk.ids.app;

    if (!appDefinitionId) {
      throw new Error('App definition ID not found');
    }

    if (!documentId) {
      throw new Error('Document ID is required');
    }

    // Get all app actions to debug if needed
    const appActions = await sdk.cma.appAction.getManyForEnvironment({
      environmentId: sdk.ids.environment,
      spaceId: sdk.ids.space,
    });

    const fetchDocAction = appActions.items.find((action) => action.name === 'fetchGoogleDoc');
    if (!fetchDocAction) {
      const availableActions = appActions.items.map((a) => a.name).join(', ');
      throw new Error(
        `App action "fetchGoogleDoc" not found. Available actions: ${
          availableActions || 'none'
        }. ` + `Please ensure the app has been rebuilt and redeployed with the new functions.`
      );
    }

    const response = await sdk.cma.appActionCall.createWithResponse(
      {
        appDefinitionId,
        appActionId: fetchDocAction.sys.id,
      },
      {
        parameters: { documentId },
      }
    );

    // Parse the response body - it may be double-encoded
    const parsed = JSON.parse(response.response.body);

    // If the parsed result has a 'body' property that's a string, parse it again
    // This handles the case where Contentful wraps our response
    if (parsed.body && typeof parsed.body === 'string') {
      try {
        const innerParsed = JSON.parse(parsed.body);
        return innerParsed;
      } catch {
        // If parsing fails, return the body as-is (might be the document data)
        return parsed.body;
      }
    }

    // Otherwise return the parsed result as-is
    return parsed;
  } catch (error) {
    console.error('Error fetching Google Doc', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch Google Doc');
  }
};
