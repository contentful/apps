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
export const updateSyncData = async (
  sdk: any,
  fieldMappings: any[] = [],
  contentTypeMappings: Record<string, any> = {}
): Promise<boolean> => {
  try {
    // Log the input parameters for debugging
    logger.log('onConfigure persistence', sdk, {
      ...sdk.parameters?.installation,
      fieldMappings,
      contentTypeMappings,
    });

    // Make sure we always have arrays for both
    const mappings = Array.isArray(fieldMappings) ? fieldMappings : [];
    const contentTypes = contentTypeMappings || {};

    // First save to localStorage for immediate local effect and backup
    try {
      localStorage.setItem('klaviyo_field_mappings', JSON.stringify(mappings));
      localStorage.setItem('klaviyo_content_types', JSON.stringify(contentTypes));
      logger.log('[persistence] Saved mappings to localStorage');
    } catch (localStorageError) {
      logger.error('[persistence] Error saving to localStorage:', localStorageError);
    }

    // Only try to use SDK if we're in the right context where it's expected to be available
    if (sdk && sdk.app && typeof sdk.app.onConfigure === 'function') {
      try {
        // Get the current parameters from app installation
        const currentParameters = sdk.parameters?.installation || {};

        // Prepare new parameters object with updated values
        const updatedParameters = {
          ...currentParameters,
          fieldMappings: mappings,
          contentTypeMappings: contentTypes,
        };

        // Update app parameters via SDK
        await sdk.app.onConfigure(() => ({
          parameters: updatedParameters,
        }));

        logger.log('[persistence] Updated mappings via SDK');
        return true;
      } catch (sdkError) {
        logger.error('[persistence] Error updating mappings via SDK:', sdkError);
        // Continue - we've already saved to localStorage as backup
      }
    } else {
      logger.log('[persistence] SDK app.onConfigure not available, using localStorage only');
    }

    return true;
  } catch (error) {
    logger.error('Error updating sync status with localStorage:', error);
    return false;
  }
};

/**
 * Manual function to directly check localStorage
 */
export const getLocalMappings = (): any[] => {
  try {
    const data = localStorage.getItem('klaviyo_field_mappings');
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    logger.error('[persistence] Error retrieving mappings from localStorage:', error);
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
