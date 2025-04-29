import { BaseExtensionSDK } from '@contentful/app-sdk';
import { FieldData } from './klaviyo-api-service';
import logger from './logger';

// Use a consistent storage key across all components
export const STORAGE_KEY = 'klaviyo_field_mappings';

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

    // If localStorage is empty, return empty array
    logger.log('[persistence] No mappings found in localStorage');
    return [];
  } catch (error) {
    logger.error('[persistence] Error retrieving sync data:', error);
    return [];
  }
};

/**
 * Update sync data in localStorage and broadcast changes
 */
export const updateSyncData = async (data: FieldData[]): Promise<boolean> => {
  try {
    logger.log('[persistence] Updating field mappings:', data);

    // Store in localStorage for immediate access across components
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    // Broadcast a message event for other components to listen for
    try {
      window.postMessage(
        {
          type: 'updateFieldMappings',
          fieldMappings: data,
        },
        '*'
      );
      logger.log('[persistence] Broadcast updateFieldMappings event');
    } catch (broadcastError) {
      logger.warn('[persistence] Error broadcasting field mapping update:', broadcastError);
    }

    // Also dispatch a storage event for cross-tab updates
    try {
      // Create and dispatch a storage event for other tabs
      const storageEvent = new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: JSON.stringify(data),
        storageArea: localStorage,
      });
      window.dispatchEvent(storageEvent);
      logger.log('[persistence] Dispatched storage event');
    } catch (storageError) {
      logger.warn('[persistence] Error dispatching storage event:', storageError);
    }

    return true;
  } catch (error) {
    logger.error('[persistence] Error updating sync data:', error);
    return false;
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
