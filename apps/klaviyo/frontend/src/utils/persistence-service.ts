import { BaseExtensionSDK } from '@contentful/app-sdk';
import { FieldData } from './klaviyo-api-service';

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
        console.log('[persistence] Retrieved mappings from localStorage:', parsedData);
        return parsedData;
      } catch (parseError) {
        console.error('[persistence] Error parsing localStorage data:', parseError);
        return [];
      }
    }

    // If localStorage is empty, return empty array
    console.log('[persistence] No mappings found in localStorage');
    return [];
  } catch (error) {
    console.error('[persistence] Error retrieving sync data:', error);
    return [];
  }
};

/**
 * Update sync data in localStorage and broadcast changes
 */
export const updateSyncData = async (
  sdk: BaseExtensionSDK,
  data: FieldData[]
): Promise<boolean> => {
  try {
    console.log('[persistence] Updating field mappings:', data);

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
      console.log('[persistence] Broadcast updateFieldMappings event');
    } catch (broadcastError) {
      console.warn('[persistence] Error broadcasting field mapping update:', broadcastError);
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
      console.log('[persistence] Dispatched storage event');
    } catch (storageError) {
      console.warn('[persistence] Error dispatching storage event:', storageError);
    }

    return true;
  } catch (error) {
    console.error('[persistence] Error updating sync data:', error);
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
    console.error('[persistence] Error getting local mappings:', e);
  }
  return [];
};
