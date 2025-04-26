import { SidebarExtensionSDK, ConfigAppSDK, locations } from '@contentful/app-sdk';

// Type for SDK used in persistence functions
type SDKType = SidebarExtensionSDK | ConfigAppSDK;

/**
 * Get sync data from app state
 * @param sdk The Contentful SDK instance
 * @returns The saved field mappings or null if not found
 */
export const getSyncData = async (sdk: SDKType): Promise<any> => {
  try {
    // Handle different SDK types
    if (sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)) {
      // For sidebar, we use the entry field metadata
      const sidebarSdk = sdk as SidebarExtensionSDK;

      // Check if we can access the entry metadata
      try {
        // Get app state from session storage as a workaround
        const storageKey = `klaviyo-mappings-${sidebarSdk.ids.entry}`;
        const storageData = sessionStorage.getItem(storageKey);
        if (storageData) {
          return JSON.parse(storageData);
        }
      } catch (storageError) {
        console.warn('Failed to access session storage:', storageError);
      }

      // Fallback to global state if available
      return [];
    } else if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
      // For config screen, get installation parameters
      const configSdk = sdk as ConfigAppSDK;
      const params = configSdk.parameters.installation;
      return params?.mappings || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting sync data:', error);
    return [];
  }
};

/**
 * Update sync data in app state
 * @param sdk The Contentful SDK instance
 * @param data The data to save
 * @returns Promise resolving when data is saved
 */
export const updateSyncData = async (sdk: SDKType, data: any): Promise<void> => {
  try {
    // Handle different SDK types
    if (sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)) {
      // For sidebar, store the data in session storage
      const sidebarSdk = sdk as SidebarExtensionSDK;

      // Use session storage as a workaround
      try {
        const storageKey = `klaviyo-mappings-${sidebarSdk.ids.entry}`;
        sessionStorage.setItem(storageKey, JSON.stringify(data));
      } catch (storageError) {
        console.warn('Failed to save to session storage:', storageError);
      }
    } else if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
      // For config screen, we don't immediately update installation parameters
      // They will be saved when the user clicks Save in the config screen
      console.log('Config data will be saved on app configuration save', data);
    }
  } catch (error) {
    console.error('Error updating sync data:', error);
    throw error;
  }
};
