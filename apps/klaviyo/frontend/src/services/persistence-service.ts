import { BaseExtensionSDK } from '@contentful/app-sdk';
import { FieldData } from '../services/klaviyo-sync-service';
import logger from '../utils/logger';
import { getGlobalSDK } from '../utils/sdk-helpers';

// Use a consistent storage key across all components
export const STORAGE_KEY = 'klaviyo_field_mappings';
export const APP_DEF_ID_KEY = 'appDefinitionId';

/**
 * Get sync data from localStorage
 */
export const getSyncData = async (sdk: BaseExtensionSDK): Promise<FieldData[]> => {
  try {
    // Always use localStorage for sharing between components
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      try {
        const parsedData = JSON.parse(localData);
        logger.log('[persistence] Retrieved mappings from localStorage:', parsedData);
        return parsedData;
      } catch (parseError) {
        logger.error('[persistence] Error parsing localStorage data:', parseError);
        return [];
      }
    }

    // If localStorage is empty, try SDK parameters as a fallback
    try {
      // Get the global SDK
      const globalSdk = await getGlobalSDK();

      if (globalSdk && globalSdk.app) {
        const parameters = await globalSdk.app.getParameters();
        if (parameters && parameters.installation && parameters.installation.fieldMappings) {
          const mappings = parameters.installation.fieldMappings;
          logger.log('[persistence] Retrieved mappings from SDK parameters:', mappings);

          // Also save to localStorage for faster access next time
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));

          return mappings;
        }
      }
    } catch (sdkError) {
      logger.error('[persistence] Error retrieving data from SDK:', sdkError);
    }

    // If localStorage is empty, return empty array
    logger.log('[persistence] No mappings found in localStorage or SDK');
    return [];
  } catch (error) {
    logger.error('[persistence] Error retrieving sync data:', error);
    return [];
  }
};

/**
 * Update sync data in both localStorage and app parameters
 */
export const updateSyncData = async (data: FieldData[]): Promise<void> => {
  try {
    // Always update localStorage for immediate sharing
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    logger.log('[persistence] Saved mappings to localStorage');

    // Attempt to update via SDK if available
    try {
      const globalSdk = await getGlobalSDK();

      if (!globalSdk || !globalSdk.app) {
        logger.warn('[persistence] SDK not available for persisting mappings to app parameters');
        return;
      }

      // Get space and environment IDs
      const spaceId = globalSdk.ids.space;
      const environmentId = globalSdk.ids.environment;
      // Get app definition ID from event, SDK, or localStorage
      const appDefinitionId = globalSdk.ids.app || getAppDefinitionId();

      if (!spaceId || !environmentId || !appDefinitionId) {
        logger.error('[persistence] Missing required IDs for updating app parameters', {
          spaceId,
          environmentId,
          appDefinitionId,
        });
        return;
      }

      // Get current parameters
      const parameters = await globalSdk.app.getParameters();

      // Update field mappings in parameters
      const updatedParameters = {
        ...parameters,
        installation: {
          ...(parameters?.installation || {}),
          fieldMappings: data,
        },
      };

      // Store in app parameters
      if (globalSdk.app && globalSdk.app.onConfigure) {
        console.log('onConfigure persistence', globalSdk.app, updatedParameters);
        await globalSdk.app.onConfigure();

        logger.log('[persistence] Updated mappings in app parameters via CMA');
      } else if (globalSdk.app.setParameters) {
        // Fallback to app.setParameters if CMA is not available
        await globalSdk.app.setParameters(updatedParameters);
        logger.log('[persistence] Updated mappings in app parameters');
      }
    } catch (sdkError) {
      logger.error('[persistence] Error updating mappings via SDK:', sdkError);
    }
  } catch (error) {
    logger.error('[persistence] Error updating sync data:', error);
  }
};

/**
 * Manual function to directly check localStorage
 */
export const getLocalMappings = (): FieldData[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    logger.error('[persistence] Error getting local mappings:', e);
  }
  return [];
};

/**
 * Store app definition ID for later use
 */
export const storeAppDefinitionId = (appDefinitionId: string): void => {
  try {
    if (appDefinitionId) {
      localStorage.setItem(APP_DEF_ID_KEY, appDefinitionId);
      logger.log('[persistence] Stored app definition ID:', appDefinitionId);
    }
  } catch (e) {
    logger.error('[persistence] Error storing app definition ID:', e);
  }
};

/**
 * Get stored app definition ID
 */
export const getAppDefinitionId = (): string | null => {
  return localStorage.getItem(APP_DEF_ID_KEY);
};
