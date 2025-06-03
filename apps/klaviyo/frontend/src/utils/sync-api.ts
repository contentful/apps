/**
 * Sync API Service
 *
 * Utilities for interacting with the backend sync status API
 */

import logger from './logger';

// Define interface for sync status
export interface SyncStatus {
  entryId: string;
  contentTypeId: string;
  contentTypeName?: string;
  lastSynced: number;
  fieldsUpdatedAt?: Record<string, number>;
  needsSync: boolean;
  syncCompleted: boolean;
  lastSyncedVersion?: number;
}

/**
 * Get access token from localStorage
 */
const getAccessToken = (): { accessToken: string } => {
  try {
    const keysString = localStorage.getItem('klaviyo_api_keys');
    if (keysString) {
      const keys = JSON.parse(keysString);
      if (keys.accessToken) {
        logger.log('Found access token in localStorage');
        return { accessToken: keys.accessToken };
      }
    }
    logger.warn('Access token not found in localStorage or has invalid format');
  } catch (error) {
    logger.error('Error retrieving access token from localStorage:', error);
  }
  return { accessToken: '' };
};

/**
 * Mark an entry for sync via the API
 */
export const markEntryForSyncViaApi = async (
  entryId: string,
  contentTypeIdOrFieldIds?: string | string[],
  contentTypeName?: string,
  sdk?: any,
  extraParams?: Record<string, any>
): Promise<boolean> => {
  try {
    const client = sdk.cma;
    const { accessToken } = getAccessToken();
    let parameters: any = {
      ...(extraParams || {}),
      entryId,
      accessToken,
    };
    if (Array.isArray(contentTypeIdOrFieldIds)) {
      parameters.fieldIds = contentTypeIdOrFieldIds;
    } else {
      parameters.contentTypeId = contentTypeIdOrFieldIds;
    }
    if (!parameters || typeof parameters !== 'object') {
      logger.error('App Action call missing required parameters:', parameters);
      throw new Error('App Action call missing required parameters');
    }
    logger.log('App Action call parameters:', parameters);
    try {
    } catch (e) {
      console.error('Sending App Action parameters (raw):', parameters);
    }
    const result = await client.appActionCall.createWithResponse(
      {
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        appDefinitionId: sdk.ids.app,
        appActionId: '5SUT62FpO3cuWVr9A7BrpK',
      },
      { parameters }
    );
    if (result.status && result.status >= 400) {
      throw new Error(result.message || `Error ${result.status}`);
    }
    if (result.response && result.response.body) {
      try {
        const parsed = JSON.parse(result.response.body);
        return parsed;
      } catch (e) {
        logger.error('Failed to parse app action response body as JSON:', result.response.body, e);
        return result.response.body;
      }
    }
    return result;
  } catch (error) {
    logger.error('Error marking entry for sync:', error);
    return false;
  }
};
