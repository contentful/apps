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

// Track field changes with timestamps
export interface FieldChangeTracker {
  fieldId: string;
  lastModified: number;
  originalValue: any;
  currentValue: any;
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
 * Interface for storing sync data in Contentful's instance parameters
 */
export interface SyncParameters {
  syncStatuses: SyncStatus[];
  lastUpdated: number;
}

/**
 * Interface for sync options
 */
export interface SyncOptions {
  useSdk?: boolean; // Whether to use SDK for storing sync status vs localStorage
  forceUpdate?: boolean; // Whether to force an update regardless of sync status
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
    logger.error('Error sending data to Klaviyo:', error);
    throw error;
  }
};

// Import the KlaviyoService and OAuth configuration
import { KlaviyoService } from '../services/klaviyo';
import { OAuthService } from '../services/oauth';
import logger from './logger';

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
  isAssetField?: boolean;
}

/**
 * Class for syncing Contentful content to Klaviyo
 */
export class SyncContent {
  entry: any;
  sdk: any;

  constructor(entry: any, sdk?: any) {
    logger.log('SyncContent constructor:', entry);
    this.entry = entry;
    this.sdk = sdk;
  }
  /**
   * Syncs content from Contentful to Klaviyo
   * @param sdk The Contentful SDK
   * @param mappings Field mappings defining how to map Contentful fields to Klaviyo
   * @param options Additional sync options
   * @returns Promise with the results of the sync operation
   */
  async syncContent(
    sdk: any,
    mappings: Array<{ contentfulFieldId: string; klaviyoBlockName: string; fieldType: string }>,
    options: SyncOptions = {}
  ) {
    try {
      logger.log('Starting content sync with mappings:', mappings);

      // Store SDK reference if not already set
      if (!this.sdk && sdk) {
        this.sdk = sdk;
      }

      // Get installation parameters more robustly
      let params;
      try {
        // Try to get params from sdk.parameters.installation
        params = sdk.parameters?.installation;
        logger.log('Got parameters from sdk.parameters.installation:', params);
      } catch (e) {
        logger.error('Error getting parameters from sdk.parameters.installation:', e);
      }

      // If that failed or didn't have the right structure, try app.getParameters()
      if (!params?.clientId && !params?.installation?.clientId) {
        try {
          const appParams = await sdk.app.getParameters();
          params = appParams?.installation || {};
          logger.log('Got parameters from sdk.app.getParameters():', params);
        } catch (e) {
          logger.error('Error getting parameters from sdk.app.getParameters():', e);
        }
      }

      // Log all available parameters to help debug
      logger.log('SDK parameters:', sdk.parameters);
      logger.log('Final params:', params);

      // Extract clientId, clientSecret, and redirectUri, handling both structures
      const clientId = params?.clientId || params?.installation?.clientId;
      const clientSecret = params?.clientSecret || params?.installation?.clientSecret;
      const redirectUri =
        params?.redirectUri ||
        params?.installation?.redirectUri ||
        params?.klaviyoRedirectUri ||
        `${window.location.origin}:3001/auth/callback`;

      if (!clientId || !clientSecret) {
        throw new Error('OAuth credentials not found in installation parameters');
      }

      logger.log('Client ID:', clientId);
      logger.log('Client Secret:', clientSecret);
      logger.log('Redirect URI:', redirectUri);
      logger.log('Entry:', this.entry);

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
      logger.log('Entry:', this.entry, sdk);
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
        logger.warn('Could not determine content type ID from entry or SDK, using "unknown"');
        contentTypeId = 'unknown';
      }

      logger.log('Using content type ID:', contentTypeId, this.entry);

      // Ensure mappings has the expected format
      let processedMappings = mappings;

      // Check if mappings is an array of objects with the required properties
      if (
        !Array.isArray(mappings) ||
        (mappings.length > 0 && (!mappings[0].contentfulFieldId || !mappings[0].klaviyoBlockName))
      ) {
        logger.log('Received mappings in non-standard format:', mappings);

        // Try to convert to the expected format
        try {
          if (typeof mappings === 'object' && !Array.isArray(mappings)) {
            // Handle object mappings where the key is the field ID and the value is the klaviyo property
            processedMappings = Object.entries(mappings).map(([fieldId, klaviyoProperty]) => ({
              contentfulFieldId: fieldId,
              klaviyoBlockName: String(klaviyoProperty),
              fieldType: 'text',
            }));
          } else if (Array.isArray(mappings)) {
            // Handle array of simpler objects
            processedMappings = mappings
              .map((mapping) => {
                // Try to extract mapping data from different potential formats
                const contentfulFieldId =
                  (mapping as any).contentfulFieldId ||
                  (mapping as any).fieldId ||
                  (mapping as any).id ||
                  (mapping as any).field;

                const klaviyoBlockName =
                  (mapping as any).klaviyoBlockName ||
                  (mapping as any).klaviyoProperty ||
                  (mapping as any).blockName ||
                  (mapping as any).property ||
                  contentfulFieldId; // Default to field ID if no mapping found

                const fieldType = (mapping as any).fieldType || (mapping as any).type || 'text'; // Default to text

                return {
                  contentfulFieldId,
                  klaviyoBlockName,
                  fieldType,
                };
              })
              .filter((m) => m.contentfulFieldId); // Only keep mappings with a valid field ID
          }
        } catch (error) {
          logger.error('Error processing non-standard mapping format:', error);
        }

        logger.log('Processed mappings:', processedMappings);
      }

      // Convert to FieldMapping array for the KlaviyoService
      const fieldMappings: FieldMapping[] = processedMappings
        .map((mapping: any) => {
          // Validate required mapping properties
          if (!mapping.contentfulFieldId || !mapping.klaviyoBlockName) {
            logger.error('Invalid mapping format:', mapping);
            return null;
          }

          // Get field value safely with fallbacks for different SDK structures
          let fieldValue = '';
          let fieldName = mapping.contentfulFieldId;
          let fieldType = mapping.fieldType || 'text';
          let isAssetField = mapping.isAssetField || false;

          try {
            // Try to safely get the field value and metadata
            if (this.entry.fields && this.entry.fields[mapping.contentfulFieldId]) {
              const field = this.entry.fields[mapping.contentfulFieldId];

              // Check if field has direct value property
              if (field && typeof field.value !== 'undefined') {
                fieldValue = field.value;
                fieldName = field.name || mapping.contentfulFieldId;
                fieldType = field.type || mapping.fieldType || 'text';
              }
              // Check if field has getValue method (CMA SDK pattern)
              else if (field && typeof field.getValue === 'function') {
                fieldValue = field.getValue() || '';
                fieldName = mapping.contentfulFieldId;
                fieldType = mapping.fieldType || 'text';

                // Check if this is an asset value
                if (fieldValue && typeof fieldValue === 'object' && (fieldValue as any).sys) {
                  if (
                    ((fieldValue as any).sys.type === 'Link' &&
                      (fieldValue as any).sys.linkType === 'Asset') ||
                    (fieldValue as any).sys.type === 'Asset'
                  ) {
                    isAssetField = true;
                    logger.log(`Detected Asset reference field: ${mapping.contentfulFieldId}`);
                  }
                }
              }
              // Check for localized format (_fieldLocales structure)
              else if (field && field._fieldLocales) {
                // Get the locale value - prefer 'en-US' or use the first available locale
                const localeKeys = Object.keys(field._fieldLocales);
                const locale = localeKeys.includes('en-US') ? 'en-US' : localeKeys[0];

                if (locale && field._fieldLocales[locale]) {
                  fieldValue = field._fieldLocales[locale]._value;
                  fieldName = mapping.contentfulFieldId;
                  fieldType = mapping.fieldType || 'text';

                  // Check if this is a stringified asset reference
                  if (
                    typeof fieldValue === 'string' &&
                    fieldValue.includes('"sys"') &&
                    fieldValue.includes('"linkType":"Asset"')
                  ) {
                    isAssetField = true;
                    logger.log(
                      `Detected stringified Asset reference: ${mapping.contentfulFieldId}`
                    );
                  }

                  // Check if this is a direct asset reference
                  if (
                    fieldValue &&
                    typeof fieldValue === 'object' &&
                    (fieldValue as any).sys &&
                    ((fieldValue as any).sys.type === 'Asset' ||
                      ((fieldValue as any).sys.type === 'Link' &&
                        (fieldValue as any).sys.linkType === 'Asset'))
                  ) {
                    isAssetField = true;
                    logger.log(
                      `Detected direct Asset reference in _fieldLocales: ${mapping.contentfulFieldId}`
                    );
                  }
                }
              }
              // Check localized old format
              else if (field && field['en-US']) {
                fieldValue = field['en-US'];
                fieldName = mapping.contentfulFieldId;
                fieldType = mapping.fieldType || 'text';

                // Check if this is a direct or stringified asset reference
                if (
                  (typeof fieldValue === 'object' &&
                    (fieldValue as any).sys &&
                    (((fieldValue as any).sys.type === 'Link' &&
                      (fieldValue as any).sys.linkType === 'Asset') ||
                      (fieldValue as any).sys.type === 'Asset')) ||
                  (typeof fieldValue === 'string' &&
                    fieldValue.includes('"sys"') &&
                    fieldValue.includes('"linkType":"Asset"'))
                ) {
                  isAssetField = true;
                  logger.log(`Detected Asset reference in en-US: ${mapping.contentfulFieldId}`);
                }
              }
              // Check if the field is a direct object
              else if (field && typeof field === 'object') {
                fieldValue = field;
                fieldName = mapping.contentfulFieldId;
                fieldType = mapping.fieldType || 'text';

                // Check for asset reference in direct object
                if (
                  typeof field === 'object' &&
                  (field as any).sys &&
                  ((field as any).sys.type === 'Asset' ||
                    ((field as any).sys.type === 'Link' && (field as any).sys.linkType === 'Asset'))
                ) {
                  isAssetField = true;
                  logger.log(
                    `Detected Asset reference in field object: ${mapping.contentfulFieldId}`
                  );
                }
              }
              // Fallback to the mapping
              else {
                fieldValue = '';
                fieldName = mapping.contentfulFieldId;
                fieldType = mapping.fieldType || 'text';
              }

              // Additional detection by field name if not already detected as asset
              if (!isAssetField && fieldType === 'text') {
                // Check field name for common image field patterns
                const imageNamePatterns = [
                  'image',
                  'picture',
                  'photo',
                  'avatar',
                  'logo',
                  'banner',
                  'icon',
                  'thumbnail',
                  'cover',
                ];
                if (
                  imageNamePatterns.some(
                    (pattern) =>
                      mapping.contentfulFieldId.toLowerCase().includes(pattern) ||
                      fieldName.toLowerCase().includes(pattern)
                  )
                ) {
                  isAssetField = true;
                  logger.log(`Detected probable image field by name: ${mapping.contentfulFieldId}`);
                }
              }

              // Override fieldType to 'image' if it's an asset field and not explicitly set otherwise
              if (isAssetField && (fieldType === 'text' || !mapping.fieldType)) {
                fieldType = 'image';
                logger.log(`Setting field type to 'image' for: ${mapping.contentfulFieldId}`);
              }
            } else {
              logger.warn(
                `Field ${mapping.contentfulFieldId} not found in entry fields:`,
                this.entry.fields
              );
            }
          } catch (error) {
            logger.error(`Error accessing field ${mapping.contentfulFieldId}:`, error);
            // Continue with empty value rather than failing
          }

          logger.log(`Mapped field ${mapping.contentfulFieldId} -> ${mapping.klaviyoBlockName}:`, {
            fieldValue,
            fieldType,
            isAssetField,
          });

          return {
            contentfulFieldId: mapping.contentfulFieldId,
            klaviyoBlockName: mapping.klaviyoBlockName,
            fieldType: fieldType as 'text' | 'image' | 'entry' | 'reference-array',
            contentTypeId,
            name: fieldName,
            type: fieldType,
            severity: 'info',
            value: fieldValue,
            isAssetField,
          };
        })
        .filter((mapping) => mapping !== null);

      // Ensure we have at least one valid mapping
      if (fieldMappings.length === 0) {
        throw new Error(
          `No valid field mappings could be processed for content type: ${contentTypeId}`
        );
      }

      // Call the KlaviyoService to sync content
      const result = await klaviyoService.syncContent(fieldMappings, this.entry);

      logger.log('Sync completed successfully:', result);

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
          logger.warn(
            `Couldn't get update time for field ${mapping.contentfulFieldId}:`,
            fieldError
          );
          fieldUpdates[mapping.contentfulFieldId] = Date.now();
        }
      }

      // Update sync status after successful sync
      await this.updateSyncStatus(contentTypeId, sdk.contentType?.name || '', true);

      return result;
    } catch (error: any) {
      logger.error('Error syncing content to Klaviyo:', error);

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
          `Failed to sync content to Klaviyo. ${error.message || 'See logger for details.'}`
        );
      }

      throw error;
    }
  }

  // Add a new method to update sync status
  private async updateSyncStatus(
    contentTypeId: string,
    contentTypeName: string,
    synced: boolean = true
  ) {
    try {
      // Check if SDK is accessible
      if (this.sdk && this.sdk.app) {
        // Use SDK to update sync status in Contentful's instance parameters
        await this.updateSyncStatusWithSdk(contentTypeId, contentTypeName, synced);
      } else {
        // Fallback to localStorage
        this.updateSyncStatusWithLocalStorage(contentTypeId, contentTypeName, synced);
      }
    } catch (error) {
      logger.error('Error updating sync status:', error);
    }
  }

  // Update sync status using Contentful's instance parameters
  private async updateSyncStatusWithSdk(
    contentTypeId: string,
    contentTypeName: string,
    synced: boolean = true
  ) {
    try {
      if (!this.sdk || !this.sdk.app) {
        throw new Error('SDK not available');
      }

      // Get the entry ID
      const entryId = this.entry?.sys?.id || '';
      if (!entryId) {
        logger.warn('No entry ID found for sync status update');
        return;
      }

      // Use localStorage as storage for sync data in sidebar context
      // This is necessary because sidebar extensions can't modify app parameters directly
      const storageKey = 'klaviyo_sync_status';
      const existingStatusesStr = localStorage.getItem(storageKey);
      const existingStatuses = existingStatusesStr ? JSON.parse(existingStatusesStr) : [];

      // Current timestamp
      const now = Date.now();

      // Generate a more consistent entry ID - we might be in different contexts with different formats
      const normalizedEntryId = entryId.includes(`${contentTypeId}-`) ? entryId : entryId;

      // Find if we have a status for this entry
      const entryIndex = existingStatuses.findIndex(
        (status: any) =>
          (status.entryId === normalizedEntryId || status.entryId === entryId) &&
          status.contentTypeId === contentTypeId
      );

      if (entryIndex >= 0) {
        // Update existing status
        existingStatuses[entryIndex] = {
          ...existingStatuses[entryIndex],
          entryId: normalizedEntryId,
          lastSynced: now,
          needsSync: !synced,
          syncCompleted: synced,
        };
      } else {
        // Add new status
        existingStatuses.push({
          entryId: normalizedEntryId,
          contentTypeId,
          contentTypeName,
          lastSynced: now,
          needsSync: !synced,
          syncCompleted: synced,
        });
      }

      // Save updated statuses to localStorage
      localStorage.setItem(storageKey, JSON.stringify(existingStatuses));

      // Also try to update via postMessage to parent window
      try {
        window.parent.postMessage(
          {
            type: 'klaviyo-sync-status-update',
            data: {
              entryId: normalizedEntryId,
              contentTypeId,
              contentTypeName,
              lastSynced: now,
              needsSync: !synced,
              syncCompleted: synced,
            },
          },
          '*'
        );
      } catch (postMsgError) {
        logger.warn('Failed to send sync status update via postMessage:', postMsgError);
      }

      // Dispatch event to notify other components
      window.dispatchEvent(
        new CustomEvent('klaviyo-sync-completed', {
          detail: {
            entryId: normalizedEntryId,
            contentTypeId,
            contentTypeName,
            lastSynced: now,
          },
        })
      );

      logger.log(`Sync status updated for ${normalizedEntryId} (${contentTypeId})`);
    } catch (error) {
      logger.error('Error updating sync status with SDK:', error);
      // Fall back to localStorage
      this.updateSyncStatusWithLocalStorage(contentTypeId, contentTypeName, synced);
    }
  }

  // Update sync status using localStorage as fallback
  private updateSyncStatusWithLocalStorage(
    contentTypeId: string,
    contentTypeName: string,
    synced: boolean = true
  ) {
    try {
      // Get current sync statuses
      const storageKey = 'klaviyo_sync_status';
      const existingStatusesStr = localStorage.getItem(storageKey);
      const existingStatuses = existingStatusesStr ? JSON.parse(existingStatusesStr) : [];

      // Find if we have a status for this entry
      const entryId = `${contentTypeId}-${contentTypeName}`;
      const entryIndex = existingStatuses.findIndex((status: any) => status.entryId === entryId);

      // Current timestamp
      const now = Date.now();

      if (entryIndex >= 0) {
        // Update existing status
        existingStatuses[entryIndex] = {
          ...existingStatuses[entryIndex],
          lastSynced: now,
          needsSync: !synced,
          syncCompleted: synced,
        };
      } else {
        // Add new status
        existingStatuses.push({
          entryId,
          contentTypeId,
          contentTypeName,
          lastSynced: now,
          needsSync: !synced,
          syncCompleted: synced,
        });
      }

      // Save updated statuses
      localStorage.setItem(storageKey, JSON.stringify(existingStatuses));

      // Dispatch event to notify other components
      window.dispatchEvent(
        new CustomEvent('klaviyo-sync-completed', {
          detail: { entryId, contentTypeId },
        })
      );
    } catch (error) {
      logger.error('Error updating sync status with localStorage:', error);
    }
  }
}

// Add this function to manage sync status
export const updateSyncStatus = (
  entryId: string,
  contentTypeId: string,
  fields: Record<string, number> = {},
  sdk?: any
): void => {
  try {
    // If SDK is provided, try to use Contentful's instance parameters
    if (sdk && sdk.app) {
      updateSyncStatusWithSdk(sdk, entryId, contentTypeId, fields);
      return;
    }

    // Fallback to localStorage
    updateSyncStatusWithLocalStorage(entryId, contentTypeId, fields);
  } catch (error) {
    logger.error('Error updating sync status:', error);
  }
};

/**
 * Update sync status using Contentful's instance parameters
 */
export const updateSyncStatusWithSdk = async (
  sdk: any,
  entryId: string,
  contentTypeId: string,
  fields: Record<string, number> = {}
): Promise<void> => {
  try {
    // Get current parameters
    const parameters = await sdk.app.getParameters();
    const syncData: SyncParameters = parameters?.syncData || {
      syncStatuses: [],
      lastUpdated: Date.now(),
    };

    const now = Date.now();
    const statusIndex = syncData.syncStatuses.findIndex(
      (status: SyncStatus) => status.entryId === entryId && status.contentTypeId === contentTypeId
    );

    if (statusIndex >= 0) {
      // Update existing status
      syncData.syncStatuses[statusIndex] = {
        ...syncData.syncStatuses[statusIndex],
        lastSynced: now,
        fieldsUpdatedAt: { ...syncData.syncStatuses[statusIndex].fieldsUpdatedAt, ...fields },
        needsSync: false,
        syncCompleted: true,
      };
    } else {
      // Add new status
      syncData.syncStatuses.push({
        entryId,
        contentTypeId,
        lastSynced: now,
        fieldsUpdatedAt: fields,
        needsSync: false,
        syncCompleted: true,
      });
    }

    // Update timestamp
    syncData.lastUpdated = now;

    // Save back to instance parameters
    await sdk.app.setParameters({
      ...parameters,
      syncData,
    });

    // Dispatch an event to notify components of the sync completion
    window.dispatchEvent(
      new CustomEvent('klaviyo-sync-completed', {
        detail: { entryId, contentTypeId },
      })
    );
  } catch (error) {
    logger.error('Error updating sync status with SDK:', error);
    // Fall back to localStorage if SDK update fails
    updateSyncStatusWithLocalStorage(entryId, contentTypeId, fields);
  }
};

/**
 * Update sync status using localStorage (fallback method)
 */
export const updateSyncStatusWithLocalStorage = (
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
    logger.error('Error updating sync status with localStorage:', error);
  }
};

// Add this function to check if an entry needs syncing
export const checkNeedsSync = async (
  entryId: string,
  contentTypeId: string,
  fieldsUpdatedAt: Record<string, number>,
  sdk?: any
): Promise<boolean> => {
  try {
    // If SDK is provided, try to use Contentful's instance parameters
    if (sdk && sdk.app) {
      return await checkNeedsSyncWithSdk(sdk, entryId, contentTypeId, fieldsUpdatedAt);
    }

    // Fallback to localStorage
    return checkNeedsSyncWithLocalStorage(entryId, contentTypeId, fieldsUpdatedAt);
  } catch (error) {
    logger.error('Error checking sync status:', error);
    return true; // Default to needs sync if there's an error
  }
};

/**
 * Check if an entry needs syncing using Contentful's instance parameters
 */
export const checkNeedsSyncWithSdk = async (
  sdk: any,
  entryId: string,
  contentTypeId: string,
  fieldsUpdatedAt: Record<string, number>
): Promise<boolean> => {
  try {
    // Get parameters from SDK
    const parameters = await sdk.app.getParameters();
    const syncData: SyncParameters = parameters?.syncData || { syncStatuses: [], lastUpdated: 0 };

    // Find this entry's status
    const existingStatus = syncData.syncStatuses.find(
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
      const statusIndex = syncData.syncStatuses.findIndex(
        (s) => s.entryId === entryId && s.contentTypeId === contentTypeId
      );

      if (statusIndex >= 0) {
        syncData.syncStatuses[statusIndex].needsSync = true;

        // Save updated status back to instance parameters
        await sdk.app.setParameters({
          ...parameters,
          syncData: {
            ...syncData,
            lastUpdated: Date.now(),
          },
        });
      }
    }

    return needsSync;
  } catch (error) {
    logger.error('Error checking sync status with SDK:', error);
    // Fall back to localStorage if SDK check fails
    return checkNeedsSyncWithLocalStorage(entryId, contentTypeId, fieldsUpdatedAt);
  }
};

/**
 * Check if an entry needs syncing using localStorage (fallback method)
 */
export const checkNeedsSyncWithLocalStorage = (
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
    logger.error('Error checking sync status with localStorage:', error);
    return true; // Default to needs sync if there's an error
  }
};

// Add this function to get all sync statuses
export const getAllSyncStatuses = async (
  forceRefresh: boolean = false,
  sdk?: any
): Promise<SyncStatus[]> => {
  try {
    // If SDK is provided, try to use Contentful's instance parameters
    if (sdk && sdk.app) {
      return await getAllSyncStatusesWithSdk(sdk, forceRefresh);
    }

    // Fallback to localStorage
    return getAllSyncStatusesWithLocalStorage(forceRefresh);
  } catch (error) {
    logger.error('Error getting sync statuses:', error);
    return [];
  }
};

/**
 * Get all sync statuses using Contentful's instance parameters
 */
export const getAllSyncStatusesWithSdk = async (
  sdk: any,
  forceRefresh: boolean = false
): Promise<SyncStatus[]> => {
  try {
    // Use a cache key to avoid excessive API calls
    const cacheKey = 'klaviyo_sync_status_cache';

    // Check cache if not forcing refresh
    if (!forceRefresh) {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const { timestamp, statuses } = JSON.parse(cachedData);
        // Use cache if it's less than 5 minutes old
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return statuses;
        }
      }
    }

    // Try to get data from localStorage first (most up-to-date in sidebar context)
    const localStorageKey = 'klaviyo_sync_status';
    const localData = localStorage.getItem(localStorageKey);
    let localStatuses: SyncStatus[] = [];

    if (localData) {
      try {
        localStatuses = JSON.parse(localData);
        logger.log('Loaded sync statuses from localStorage:', localStatuses.length);
      } catch (e) {
        logger.error('Error parsing localStorage data:', e);
      }
    }

    // Also try to get parameters from SDK
    let paramStatuses: SyncStatus[] = [];

    try {
      // Get parameters from SDK
      const parameters = await sdk.app.getParameters();
      const syncData: SyncParameters = parameters?.syncData || { syncStatuses: [], lastUpdated: 0 };
      paramStatuses = syncData.syncStatuses || [];
      logger.log('Loaded sync statuses from parameters:', paramStatuses.length);
    } catch (e) {
      logger.error('Error getting sync statuses from parameters:', e);
    }

    // Merge the two sets of statuses, preferring localStorage (more recent) for duplicates
    const mergedStatuses: SyncStatus[] = [...paramStatuses];

    for (const localStatus of localStatuses) {
      const existingIndex = mergedStatuses.findIndex(
        (s) => s.entryId === localStatus.entryId && s.contentTypeId === localStatus.contentTypeId
      );

      if (existingIndex >= 0) {
        // Local data is more recent - replace
        mergedStatuses[existingIndex] = localStatus;
      } else {
        // New status - add
        mergedStatuses.push(localStatus);
      }
    }

    // Cache the result
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        timestamp: Date.now(),
        statuses: mergedStatuses,
      })
    );

    return mergedStatuses;
  } catch (error) {
    logger.error('Error getting sync statuses with SDK:', error);
    // Fall back to localStorage if SDK fails
    return getAllSyncStatusesWithLocalStorage(forceRefresh);
  }
};

/**
 * Get all sync statuses using localStorage (fallback method)
 */
export const getAllSyncStatusesWithLocalStorage = (forceRefresh: boolean = false): SyncStatus[] => {
  try {
    const storageKey = 'klaviyo_sync_status';
    const statusesStr = localStorage.getItem(storageKey);

    // Clear cache if force refresh is requested
    if (forceRefresh) {
      localStorage.removeItem(`${storageKey}_cache`);
    }

    if (!statusesStr) return [];

    const statuses = JSON.parse(statusesStr);
    logger.log('getAllSyncStatusesWithLocalStorage found', statuses.length, 'statuses');
    return statuses;
  } catch (error) {
    logger.error('Error getting sync statuses with localStorage:', error);
    return [];
  }
};

// Add this function to mark an entry as needing sync
export const markEntryForSync = async (
  entryId: string,
  contentTypeId: string,
  contentTypeName?: string,
  sdk?: any
): Promise<void> => {
  try {
    // If SDK is provided, try to use Contentful's instance parameters
    if (sdk && sdk.app) {
      await markEntryForSyncWithSdk(sdk, entryId, contentTypeId, contentTypeName);
      return;
    }

    // Fallback to localStorage
    markEntryForSyncWithLocalStorage(entryId, contentTypeId, contentTypeName);
  } catch (error) {
    logger.error('Error marking entry for sync:', error);
  }
};

/**
 * Mark an entry as needing sync using Contentful's instance parameters
 */
export const markEntryForSyncWithSdk = async (
  sdk: any,
  entryId: string,
  contentTypeId: string,
  contentTypeName?: string
): Promise<void> => {
  try {
    // Get parameters from SDK
    const parameters = await sdk.app.getParameters();
    const syncData: SyncParameters = parameters?.syncData || { syncStatuses: [], lastUpdated: 0 };

    // Find this entry's status
    const existingIndex = syncData.syncStatuses.findIndex(
      (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
    );

    if (existingIndex >= 0) {
      // Update existing status
      syncData.syncStatuses[existingIndex].needsSync = true;
      if (contentTypeName) {
        syncData.syncStatuses[existingIndex].contentTypeName = contentTypeName;
      }
    } else {
      // Add new status
      syncData.syncStatuses.push({
        entryId,
        contentTypeId,
        contentTypeName,
        lastSynced: 0, // Never synced
        needsSync: true,
        syncCompleted: false,
      });
    }

    // Update timestamp and save back to instance parameters
    syncData.lastUpdated = Date.now();
    await sdk.app.setParameters({
      ...parameters,
      syncData,
    });
  } catch (error) {
    logger.error('Error marking entry for sync with SDK:', error);
    // Fall back to localStorage if SDK fails
    markEntryForSyncWithLocalStorage(entryId, contentTypeId, contentTypeName);
  }
};

/**
 * Mark an entry as needing sync using localStorage (fallback method)
 */
export const markEntryForSyncWithLocalStorage = (
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
    logger.error('Error marking entry for sync with localStorage:', error);
  }
};

/**
 * Sets up a listener to track field changes and determine if an entry needs syncing
 * @param sdk The Contentful SDK
 * @param syncedFields Array of field IDs that are synced with Klaviyo
 * @param options Additional options for sync behavior
 * @returns Cleanup function to remove listeners
 */
export const setupEntryChangeListener = (
  sdk: any,
  syncedFields: string[],
  options: SyncOptions = {}
): (() => void) => {
  if (!sdk || !sdk.entry || !Array.isArray(syncedFields)) {
    logger.error('Invalid SDK or synced fields for change listener');
    return () => {}; // Return empty cleanup function
  }

  logger.log(`Setting up change listeners for ${syncedFields.length} fields`);

  // Get entry ID and content type info
  const entryId = sdk.entry.getSys().id;
  const contentTypeId = sdk.ids.contentType;
  const contentTypeName = sdk.contentType?.name || '';

  // Initialize field trackers
  const fieldTrackers: Record<string, FieldChangeTracker> = {};

  // Store current sync status
  let syncStatus: SyncStatus | undefined;
  let lastSyncTimestamp = 0;

  // Get initial sync status
  (async () => {
    try {
      // Try to get sync status from Contentful if SDK is present and useSdk option is true
      if (options.useSdk && sdk.app) {
        const statuses = await getAllSyncStatusesWithSdk(sdk);
        syncStatus = statuses.find(
          (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
        );
      } else {
        // Fallback to localStorage
        syncStatus = getSyncStatusForEntryWithLocalStorage(entryId, contentTypeId);
      }

      lastSyncTimestamp = syncStatus?.lastSynced || 0;
      logger.log(
        `Initial sync status for ${entryId}: last synced at ${new Date(
          lastSyncTimestamp
        ).toISOString()}`
      );
    } catch (error) {
      logger.error('Error getting initial sync status:', error);
    }
  })();

  // Initialize field values
  for (const fieldId of syncedFields) {
    try {
      const field = sdk.entry.fields[fieldId];
      if (field) {
        const currentValue = field.getValue();

        fieldTrackers[fieldId] = {
          fieldId,
          lastModified: Date.now(),
          originalValue: JSON.stringify(currentValue),
          currentValue: JSON.stringify(currentValue),
        };

        logger.log(`Initialized tracker for field ${fieldId}`);
      }
    } catch (error) {
      logger.error(`Error initializing tracker for field ${fieldId}:`, error);
    }
  }

  // Array to store cleanup functions
  const cleanupFunctions: (() => void)[] = [];

  // Set up change listeners for each field
  for (const fieldId of syncedFields) {
    try {
      const field = sdk.entry.fields[fieldId];
      if (field) {
        // Listen for value changes
        const removeValueListener = field.onValueChanged((value: any) => {
          logger.log(`Field ${fieldId} value changed`);

          const stringifiedValue = JSON.stringify(value);
          const tracker = fieldTrackers[fieldId];

          if (tracker) {
            // Update tracker
            tracker.lastModified = Date.now();
            tracker.currentValue = stringifiedValue;

            // Check if value actually changed (not just metadata)
            const valueChanged = tracker.originalValue !== stringifiedValue;

            if (valueChanged) {
              logger.log(`Field ${fieldId} content changed, marking for sync`);

              // Update field timestamps in sync status
              const fieldsUpdatedAt: Record<string, number> = {
                [fieldId]: tracker.lastModified,
              };

              // Mark entry for sync using appropriate method
              if (options.useSdk && sdk.app) {
                markEntryForSyncWithSdk(sdk, entryId, contentTypeId, contentTypeName);
                updateFieldTimestampsWithSdk(sdk, entryId, contentTypeId, fieldsUpdatedAt);
              } else {
                markEntryForSyncWithLocalStorage(entryId, contentTypeId, contentTypeName);
                updateFieldTimestampsWithLocalStorage(entryId, contentTypeId, fieldsUpdatedAt);
              }
            } else {
              logger.log(`Field ${fieldId} metadata changed but content is the same`);
            }
          }
        });

        cleanupFunctions.push(removeValueListener);
      }
    } catch (error) {
      logger.error(`Error setting up change listener for field ${fieldId}:`, error);
    }
  }

  // Also listen for entry saves to check all fields
  try {
    const removeSysListener = sdk.entry.onSysChanged((sys: any) => {
      logger.log('Entry sys changed, checking if sync is needed');

      // Only check on published or updated states
      if (sys.version && (sys.publishedVersion || sys.updatedAt)) {
        checkAndMarkForSync(
          sdk,
          syncedFields,
          fieldTrackers,
          entryId,
          contentTypeId,
          contentTypeName,
          options
        );
      }
    });

    cleanupFunctions.push(removeSysListener);
  } catch (error) {
    logger.error('Error setting up sys change listener:', error);
  }

  // Return a cleanup function that removes all listeners
  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup());
    logger.log('Removed all field change listeners');
  };
};

/**
 * Helper function to check all tracked fields and mark for sync if needed
 */
const checkAndMarkForSync = async (
  sdk: any,
  syncedFields: string[],
  fieldTrackers: Record<string, FieldChangeTracker>,
  entryId: string,
  contentTypeId: string,
  contentTypeName: string,
  options: SyncOptions = {}
) => {
  try {
    // Get current sync status
    let syncStatus: SyncStatus | undefined;

    if (options.useSdk && sdk.app) {
      // Get sync status from SDK
      const statuses = await getAllSyncStatusesWithSdk(sdk);
      syncStatus = statuses.find(
        (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
      );
    } else {
      // Get sync status from localStorage
      syncStatus = getSyncStatusForEntryWithLocalStorage(entryId, contentTypeId);
    }

    const lastSyncTimestamp = syncStatus?.lastSynced || 0;

    // Track which fields have changed
    const changedFields: Record<string, number> = {};
    let hasChanges = false;

    // Check each field
    for (const fieldId of syncedFields) {
      try {
        const field = sdk.entry.fields[fieldId];
        if (field) {
          const currentValue = field.getValue();
          const tracker = fieldTrackers[fieldId];

          if (tracker) {
            const stringifiedValue = JSON.stringify(currentValue);

            // Check if different from original value
            if (stringifiedValue !== tracker.originalValue) {
              tracker.currentValue = stringifiedValue;
              tracker.lastModified = Date.now();
              changedFields[fieldId] = tracker.lastModified;
              hasChanges = true;

              logger.log(`Field ${fieldId} has changed since original state`);
            }

            // Check if field has changed since last sync
            if (tracker.lastModified > lastSyncTimestamp) {
              hasChanges = true;
              changedFields[fieldId] = tracker.lastModified;
              logger.log(
                `Field ${fieldId} changed since last sync at ${new Date(
                  lastSyncTimestamp
                ).toISOString()}`
              );
            }
          }
        }
      } catch (error) {
        logger.error(`Error checking field ${fieldId}:`, error);
      }
    }

    // If any fields have changed, mark for sync
    if (hasChanges) {
      logger.log('Changes detected, marking entry for sync');

      if (options.useSdk && sdk.app) {
        await markEntryForSyncWithSdk(sdk, entryId, contentTypeId, contentTypeName);
        await updateFieldTimestampsWithSdk(sdk, entryId, contentTypeId, changedFields);
      } else {
        markEntryForSyncWithLocalStorage(entryId, contentTypeId, contentTypeName);
        updateFieldTimestampsWithLocalStorage(entryId, contentTypeId, changedFields);
      }
    } else {
      logger.log('No changes detected that need syncing');
    }
  } catch (error) {
    logger.error('Error checking fields for changes:', error);
  }
};

/**
 * Helper function to get sync status for a specific entry
 */
const getSyncStatusForEntry = async (
  entryId: string,
  contentTypeId: string,
  sdk?: any
): Promise<SyncStatus | undefined> => {
  try {
    if (sdk && sdk.app) {
      const allStatuses = await getAllSyncStatusesWithSdk(sdk);
      return allStatuses.find(
        (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
      );
    } else {
      return getSyncStatusForEntryWithLocalStorage(entryId, contentTypeId);
    }
  } catch (error) {
    logger.error('Error getting sync status for entry:', error);
    return undefined;
  }
};

/**
 * Helper function to get sync status for a specific entry using localStorage
 */
const getSyncStatusForEntryWithLocalStorage = (
  entryId: string,
  contentTypeId: string
): SyncStatus | undefined => {
  try {
    const allStatuses = getAllSyncStatusesWithLocalStorage();
    return allStatuses.find(
      (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
    );
  } catch (error) {
    logger.error('Error getting sync status for entry with localStorage:', error);
    return undefined;
  }
};

/**
 * Helper function to update timestamp information for specific fields
 */
const updateFieldTimestamps = async (
  entryId: string,
  contentTypeId: string,
  fieldTimestamps: Record<string, number>,
  sdk?: any
): Promise<void> => {
  try {
    if (sdk && sdk.app) {
      await updateFieldTimestampsWithSdk(sdk, entryId, contentTypeId, fieldTimestamps);
    } else {
      updateFieldTimestampsWithLocalStorage(entryId, contentTypeId, fieldTimestamps);
    }
  } catch (error) {
    logger.error('Error updating field timestamps:', error);
  }
};

/**
 * Helper function to update timestamp information for specific fields using SDK
 */
const updateFieldTimestampsWithSdk = async (
  sdk: any,
  entryId: string,
  contentTypeId: string,
  fieldTimestamps: Record<string, number>
): Promise<void> => {
  try {
    // Get current parameters
    const parameters = await sdk.app.getParameters();
    const syncData: SyncParameters = parameters?.syncData || { syncStatuses: [], lastUpdated: 0 };

    const statusIndex = syncData.syncStatuses.findIndex(
      (status: SyncStatus) => status.entryId === entryId && status.contentTypeId === contentTypeId
    );

    if (statusIndex >= 0) {
      // Update existing status with field timestamps
      const currentFieldTimestamps = syncData.syncStatuses[statusIndex].fieldsUpdatedAt || {};
      syncData.syncStatuses[statusIndex].fieldsUpdatedAt = {
        ...currentFieldTimestamps,
        ...fieldTimestamps,
      };
    } else {
      // Add new status with field timestamps
      syncData.syncStatuses.push({
        entryId,
        contentTypeId,
        lastSynced: 0, // Never synced
        fieldsUpdatedAt: fieldTimestamps,
        needsSync: true,
        syncCompleted: false,
      });
    }

    // Update timestamp and save back to instance parameters
    syncData.lastUpdated = Date.now();
    await sdk.app.setParameters({
      ...parameters,
      syncData,
    });

    logger.log('Updated field timestamps for entry with SDK:', entryId);
  } catch (error) {
    logger.error('Error updating field timestamps with SDK:', error);
    // Fall back to localStorage if SDK fails
    updateFieldTimestampsWithLocalStorage(entryId, contentTypeId, fieldTimestamps);
  }
};

/**
 * Helper function to update timestamp information for specific fields using localStorage
 */
const updateFieldTimestampsWithLocalStorage = (
  entryId: string,
  contentTypeId: string,
  fieldTimestamps: Record<string, number>
): void => {
  try {
    const storageKey = 'klaviyo_sync_status';
    const existingStatusesStr = localStorage.getItem(storageKey);
    const existingStatuses = existingStatusesStr ? JSON.parse(existingStatusesStr) : [];

    const statusIndex = existingStatuses.findIndex(
      (status: SyncStatus) => status.entryId === entryId && status.contentTypeId === contentTypeId
    );

    if (statusIndex >= 0) {
      // Update existing status
      const currentFieldTimestamps = existingStatuses[statusIndex].fieldsUpdatedAt || {};
      existingStatuses[statusIndex].fieldsUpdatedAt = {
        ...currentFieldTimestamps,
        ...fieldTimestamps,
      };
    } else {
      // Add new status with field timestamps
      existingStatuses.push({
        entryId,
        contentTypeId,
        lastSynced: 0, // Never synced
        fieldsUpdatedAt: fieldTimestamps,
        needsSync: true,
        syncCompleted: false,
      });
    }

    localStorage.setItem(storageKey, JSON.stringify(existingStatuses));
    logger.log('Updated field timestamps for entry with localStorage:', entryId);
  } catch (error) {
    logger.error('Error updating field timestamps with localStorage:', error);
  }
};
