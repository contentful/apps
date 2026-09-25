import { BaseAppSDK } from '@contentful/app-sdk';
import logger from './logger';

// Frontend-facing field-mapping storage. Per PIC-1321, the browser SDK gets
// no direct storage API — reads/writes go through the getFieldMappings /
// setFieldMappings App Actions, which use context.storage server-side (or
// fall back to the legacy klaviyoFieldMappings CMA entry until that ships;
// see functions/getFieldMappings.ts, functions/setFieldMappings.ts, and
// docs/ADRs/0007). Same exported names/signatures as the old direct-CMA
// implementation so call sites didn't need to change, only the import path.

async function getAppActionIdByName(sdk: BaseAppSDK, name: string): Promise<string> {
  const appActions = await sdk.cma.appAction.getManyForEnvironment({
    spaceId: sdk.ids.space,
    environmentId: sdk.ids.environment,
  });
  const appAction = appActions.items.find((action: any) => action.name === name);
  if (!appAction) {
    throw new Error(`App action "${name}" not found`);
  }
  return appAction.sys.id;
}

function parseActionResponseBody(response: any): any {
  const body = response?.response?.body;
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body);
  } catch (e) {
    logger.error('Failed to parse app action response body:', e);
    return undefined;
  }
}

/**
 * Get klaviyo field mappings for a specific entry via the Get Field Mappings App Action.
 * @param sdk The Contentful SDK instance
 * @param entryId The ID of the entry whose mappings you want
 * @returns Array of field mappings for the entryId, or empty array if none found
 */
export const getEntryKlaviyoFieldMappings = async (
  sdk: BaseAppSDK,
  entryId: string
): Promise<any[]> => {
  try {
    const appActionId = await getAppActionIdByName(sdk, 'Get Field Mappings');
    const response = await sdk.cma.appActionCall.createWithResponse(
      { appActionId, appDefinitionId: sdk.ids.app || '' },
      { parameters: { entryId } }
    );
    const body = parseActionResponseBody(response);
    return Array.isArray(body?.mappings) ? body.mappings : [];
  } catch (error) {
    logger.error('Error fetching field mappings via Get Field Mappings action:', error);
    return [];
  }
};

/**
 * Set klaviyo field mappings for a specific entry via the Set Field Mappings App Action.
 * @param sdk The Contentful SDK instance
 * @param entryId The ID of the entry
 * @param mappings Array of field mapping objects for this entry
 */
export const setEntryKlaviyoFieldMappings = async (
  sdk: BaseAppSDK,
  entryId: string,
  mappings: any[]
): Promise<void> => {
  try {
    const appActionId = await getAppActionIdByName(sdk, 'Set Field Mappings');
    await sdk.cma.appActionCall.createWithResponse(
      { appActionId, appDefinitionId: sdk.ids.app || '' },
      { parameters: { entryId, mappings } }
    );
  } catch (error) {
    logger.error('Error writing field mappings via Set Field Mappings action:', error);
  }
};
