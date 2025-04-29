/**
 * Interface representing field data structure
 */
export interface FieldData {
  id: string;
  name: string;
  type: string;
  value: any;
  isAsset: boolean;
  assetDetails?: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    fileName: string;
    contentType: string;
  }>;
  contentTypeId?: string;
}

/**
 * Interface representing Klaviyo API configuration
 */
export interface KlaviyoConfig {
  apiKey: string;
  privateKey?: string;
  listId?: string;
  endpoint?: string;
}

/**
 * Interface for tracking sync status of entries
 */
export interface SyncStatus {
  entryId: string;
  contentTypeId: string;
  contentTypeName?: string;
  lastSynced: number; // timestamp
  fieldsUpdatedAt?: Record<string, number>; // fieldId -> last update timestamp
  needsSync: boolean;
  syncCompleted: boolean;
}

/**
 * Sends data to Klaviyo API
 * @param config Klaviyo API configuration
 * @param fieldMappings Field mappings for the data
 * @param entryData The entry data to be sent
 * @returns Response from the Klaviyo API
 */
export const sendToKlaviyo = async (
  config: KlaviyoConfig,
  fieldMappings: Record<string, string>,
  entryData: Record<string, FieldData>
): Promise<any> => {
  try {
    if (!config.apiKey) {
      throw new Error('Klaviyo API key is required');
    }

    // Transform field data according to mappings
    const transformedData = Object.entries(fieldMappings).reduce(
      (acc, [contentfulField, klaviyoField]) => {
        if (entryData[contentfulField]) {
          acc[klaviyoField] = entryData[contentfulField].value;
        }
        return acc;
      },
      {} as Record<string, any>
    );

    // Basic validation
    if (!transformedData.email && !transformedData.phone_number) {
      throw new Error('Either email or phone number is required for Klaviyo profiles');
    }

    // Endpoint defaults to profiles if not specified
    const endpoint = config.endpoint || 'profiles';
    const baseUrl = 'https://a.klaviyo.com/api/v2';

    // Build request options
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Klaviyo-API-Key ${config.apiKey}`,
      },
      body: JSON.stringify({
        data: transformedData,
        ...(config.listId && { list_id: config.listId }),
      }),
    };

    // Make the API request
    const response = await fetch(`${baseUrl}/${endpoint}`, options);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Klaviyo API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending data to Klaviyo:', error);
    throw error;
  }
};

// Import the KlaviyoService and OAuth configuration
import { KlaviyoService } from '../services/klaviyo';
import { KlaviyoOAuthConfig } from '../config/klaviyo';
import { OAuthService } from '../services/oauth';

// Define the FieldMapping interface to match the service's requirements
interface FieldMapping {
  contentfulFieldId: string;
  fieldType: 'text' | 'image' | 'entry' | 'reference-array';
  klaviyoBlockName: string;
  contentTypeId?: string;
  fields?: any;
  name: string;
  type: string;
  severity: string;
  value: any;
}

/**
 * Class for syncing Contentful content to Klaviyo
 */
export class SyncContent {
  entry: any;
  constructor(entry: any) {
    console.log('SyncContent constructor:', entry);
    this.entry = entry;
  }
  /**
   * Syncs content from Contentful to Klaviyo
   * @param sdk The Contentful SDK
   * @param mappings Field mappings defining how to map Contentful fields to Klaviyo
   * @returns Promise with the results of the sync operation
   */
  async syncContent(
    sdk: any,
    mappings: Array<{ contentfulFieldId: string; klaviyoBlockName: string; fieldType: string }>
  ) {
    try {
      console.log('Starting content sync with mappings:', mappings);

      const clientId = sdk.parameters.installation.installation.clientId;
      const clientSecret = sdk.parameters.installation.installation.clientSecret;
      const redirectUri =
        sdk.parameters.installation.klaviyoRedirectUri ||
        `${window.location.origin}:3001/auth/callback`;

      console.log('Client ID:', clientId, sdk.parameters.installation);
      console.log('Client Secret:', clientSecret);
      console.log('Redirect URI:', redirectUri);
      console.log('Entry:', this.entry, sdk.entry);
      // Check if we have a valid OAuth token
      const oauthService = new OAuthService({
        clientId,
        clientSecret,
        redirectUri,
      });
      const accessToken = await oauthService.getAccessToken();
      if (!accessToken) {
        sdk.notifier.error('Please connect to Klaviyo first...');
        throw new Error('Authentication required: No access token available');
      }

      // Initialize the KlaviyoService with OAuth configuration
      // We don't need actual client ID and secret for API calls once we have a token
      const klaviyoService = new KlaviyoService({
        clientId,
        clientSecret,
        redirectUri,
        accessToken: accessToken,
        refreshToken: localStorage.getItem('klaviyo_refresh_token') || undefined,
        tokenExpiresAt: parseInt(localStorage.getItem('klaviyo_token_expires_at') || '0', 10),
      });

      // Set the tokens in the service
      klaviyoService.setTokens({
        access_token: accessToken,
        refresh_token: localStorage.getItem('klaviyo_refresh_token') || '',
        token_type: 'Bearer',
        expires_in:
          parseInt(localStorage.getItem('klaviyo_token_expires_at') || '0', 10) - Date.now(),
      });

      // Get entry data and content type ID safely
      console.log('Entry:', this.entry, sdk);
      // Get content type ID safely - use multiple approaches to ensure we get a value
      let contentTypeId;

      // Try to get it from entry.sys.contentType (if it exists)
      if (
        this.entry &&
        this.entry.sys &&
        this.entry.sys.contentType &&
        this.entry.sys.contentType.sys
      ) {
        contentTypeId = this.entry.sys.contentType.sys.id;
      }
      // Try to get it from sdk.ids
      else if (sdk.ids && sdk.ids.contentType) {
        contentTypeId = sdk.ids.contentType;
      }
      // Log a warning but continue with the content type ID
      else {
        console.warn('Could not determine content type ID from entry or SDK, using "unknown"');
        contentTypeId = 'unknown';
      }

      console.log('Using content type ID:', contentTypeId, this.entry);

      // Convert to FieldMapping array for the KlaviyoService
      const fieldMappings: FieldMapping[] = mappings.map((mapping) => ({
        contentfulFieldId: mapping.contentfulFieldId,
        klaviyoBlockName: mapping.klaviyoBlockName,
        fieldType: mapping.fieldType as 'text' | 'image' | 'entry' | 'reference-array',
        contentTypeId,
        fields: this.entry.fields,
        name: this.entry.fields[mapping.contentfulFieldId].name || '',
        type: this.entry.fields[mapping.contentfulFieldId].type || '',
        severity: this.entry.fields[mapping.contentfulFieldId].severity || '',
        value: this.entry.fields[mapping.contentfulFieldId].value || '',
      }));

      // Call the KlaviyoService to sync content
      const result = await klaviyoService.syncContent(fieldMappings, this.entry);

      console.log('Sync completed successfully:', result);

      // Notify the user
      sdk.notifier.success('Content successfully synced to Klaviyo');

      // Create a field update timestamp map
      const fieldUpdates: Record<string, number> = {};

      // For each mapped field, get its last update time
      for (const mapping of mappings) {
        // Get field last update time, defaulting to current time if not available
        try {
          const field = this.entry.fields[mapping.contentfulFieldId];
          const fieldSys = await field?.getSys();
          fieldUpdates[mapping.contentfulFieldId] = fieldSys?.updatedAt || Date.now();
        } catch (fieldError) {
          console.warn(
            `Couldn't get update time for field ${mapping.contentfulFieldId}:`,
            fieldError
          );
          fieldUpdates[mapping.contentfulFieldId] = Date.now();
        }
      }

      // Update sync status after successful sync
      this.updateSyncStatus(contentTypeId, sdk.contentType?.name || '', true);

      return result;
    } catch (error: any) {
      console.error('Error syncing content to Klaviyo:', error);

      // Special handling for OAuth errors
      if (
        error.message &&
        (error.message.includes('Authentication required') ||
          error.message.includes('Authentication failed') ||
          error.message.includes('Your session has expired'))
      ) {
        // Clear token to force re-authentication
        localStorage.removeItem('klaviyo_access_token');
        localStorage.removeItem('klaviyo_refresh_token');
        localStorage.removeItem('klaviyo_token_expires_at');
      }

      // Notify the user of the error
      if (sdk.notifier) {
        sdk.notifier.error(
          `Failed to sync content to Klaviyo. ${error.message || 'See console for details.'}`
        );
      }

      throw error;
    }
  }

  // Add a new method to update sync status
  private updateSyncStatus(contentTypeId: string, contentTypeName: string, synced: boolean = true) {
    try {
      // Get current sync statuses
      const storageKey = 'klaviyo_sync_status';
      const existingStatusesStr = localStorage.getItem(storageKey);
      const existingStatuses = existingStatusesStr ? JSON.parse(existingStatusesStr) : [];

      // Find if we have a status for this entry
      const entryIndex = existingStatuses.findIndex(
        (status: any) => status.entryId === `${contentTypeId}-${contentTypeName}`
      );

      // Current timestamp
      const now = new Date().toISOString();

      if (entryIndex >= 0) {
        // Update existing status
        existingStatuses[entryIndex] = {
          ...existingStatuses[entryIndex],
          lastSynced: now,
          needsSync: !synced,
          syncCompleted: !synced,
        };
      } else {
        // Add new status
        existingStatuses.push({
          entryId: `${contentTypeId}-${contentTypeName}`,
          contentTypeId,
          contentTypeName,
          lastSynced: now,
          needsSync: !synced,
          syncCompleted: !synced,
        });
      }

      // Save updated statuses
      localStorage.setItem(storageKey, JSON.stringify(existingStatuses));

      // Dispatch event to notify other components
      window.dispatchEvent(
        new CustomEvent('klaviyo-sync-completed', {
          detail: { entryId: `${contentTypeId}-${contentTypeName}`, contentTypeId },
        })
      );
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }
}

// Add this function to manage sync status
export const updateSyncStatus = (
  entryId: string,
  contentTypeId: string,
  fields: Record<string, number> = {}
): void => {
  try {
    const storageKey = 'klaviyo_sync_status';
    const existingStatusesStr = localStorage.getItem(storageKey);
    const existingStatuses = existingStatusesStr ? JSON.parse(existingStatusesStr) : [];

    const now = Date.now();
    const statusIndex = existingStatuses.findIndex(
      (status: SyncStatus) => status.entryId === entryId && status.contentTypeId === contentTypeId
    );

    if (statusIndex >= 0) {
      // Update existing status
      existingStatuses[statusIndex] = {
        ...existingStatuses[statusIndex],
        lastSynced: now,
        fieldsUpdatedAt: { ...existingStatuses[statusIndex].fieldsUpdatedAt, ...fields },
        needsSync: false,
        syncCompleted: true,
      };
    } else {
      // Add new status
      existingStatuses.push({
        entryId,
        contentTypeId,
        lastSynced: now,
        fieldsUpdatedAt: fields,
        needsSync: false,
        syncCompleted: true,
      });
    }

    localStorage.setItem(storageKey, JSON.stringify(existingStatuses));

    // Dispatch an event to notify components of the sync completion
    window.dispatchEvent(
      new CustomEvent('klaviyo-sync-completed', {
        detail: { entryId, contentTypeId },
      })
    );
  } catch (error) {
    console.error('Error updating sync status:', error);
  }
};

// Add this function to check if an entry needs syncing
export const checkNeedsSync = (
  entryId: string,
  contentTypeId: string,
  fieldsUpdatedAt: Record<string, number>
): boolean => {
  try {
    // Get existing sync statuses
    const storageKey = 'klaviyo_sync_status';
    const existingStatusesJson = localStorage.getItem(storageKey);
    const existingStatuses: SyncStatus[] = existingStatusesJson
      ? JSON.parse(existingStatusesJson)
      : [];

    // Find this entry's status
    const existingStatus = existingStatuses.find(
      (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
    );

    if (!existingStatus) {
      // Never synced before, so it needs sync
      return true;
    }

    // Check if any fields have been updated since last sync
    let needsSync = false;

    for (const [fieldId, updatedAt] of Object.entries(fieldsUpdatedAt)) {
      // If this field has been updated since last sync
      if (updatedAt > existingStatus.lastSynced) {
        needsSync = true;
        break;
      }
    }

    // Update the status if needed
    if (needsSync) {
      const statuses = [...existingStatuses];
      const statusIndex = statuses.findIndex(
        (s) => s.entryId === entryId && s.contentTypeId === contentTypeId
      );

      if (statusIndex >= 0) {
        statuses[statusIndex].needsSync = true;
        localStorage.setItem(storageKey, JSON.stringify(statuses));
      }
    }

    return needsSync;
  } catch (error) {
    console.error('Error checking sync status:', error);
    return true; // Default to needs sync if there's an error
  }
};

// Add this function to get all sync statuses
export const getAllSyncStatuses = (forceRefresh: boolean = false): SyncStatus[] => {
  try {
    const storageKey = 'klaviyo_sync_status';
    const statusesStr = localStorage.getItem(storageKey);

    // Clear cache if force refresh is requested
    if (forceRefresh) {
      localStorage.removeItem(`${storageKey}_cache`);
    }

    if (!statusesStr) return [];
    return JSON.parse(statusesStr);
  } catch (error) {
    console.error('Error getting sync statuses:', error);
    return [];
  }
};

// Add this function to mark an entry as needing sync
export const markEntryForSync = (
  entryId: string,
  contentTypeId: string,
  contentTypeName?: string
): void => {
  try {
    // Get existing sync statuses
    const storageKey = 'klaviyo_sync_status';
    const existingStatusesJson = localStorage.getItem(storageKey);
    const existingStatuses: SyncStatus[] = existingStatusesJson
      ? JSON.parse(existingStatusesJson)
      : [];

    // Find this entry's status
    const existingIndex = existingStatuses.findIndex(
      (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
    );

    if (existingIndex >= 0) {
      // Update existing status
      existingStatuses[existingIndex].needsSync = true;
      if (contentTypeName) {
        existingStatuses[existingIndex].contentTypeName = contentTypeName;
      }
    } else {
      // Add new status
      existingStatuses.push({
        entryId,
        contentTypeId,
        contentTypeName,
        lastSynced: 0, // Never synced
        needsSync: true,
        syncCompleted: false,
      });
    }

    // Save back to localStorage
    localStorage.setItem(storageKey, JSON.stringify(existingStatuses));
  } catch (error) {
    console.error('Error marking entry for sync:', error);
  }
};
