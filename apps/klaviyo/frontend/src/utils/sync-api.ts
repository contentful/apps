/**
 * Sync API Service
 *
 * Utilities for interacting with the backend sync status API
 */

import logger from './logger';
import { AppConfigAPI } from '@contentful/app-sdk';
import { API_PROXY_URL } from '../config/klaviyo';
import { getGlobalSDK } from './sdk-helpers';
import { getLocalMappings } from '../services/persistence-service';

// Constants for local storage
const LOCAL_STORAGE_KEY = 'klaviyo_contentful_mappings';

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

// Define the base URL for API requests
const getBaseUrl = () => {
  return API_PROXY_URL.startsWith('http') ? API_PROXY_URL : window.location.origin + API_PROXY_URL;
};

interface SyncResult {
  success: boolean;
  errors?: string[];
  message?: string;
}

/**
 * Fetch sync status for an entry from the backend (DynamoDB)
 */
export const fetchEntrySyncStatus = async (
  entryId: string,
  contentTypeId?: string
): Promise<SyncStatus | null | boolean> => {
  try {
    // Get API keys from localStorage
    const { privateKey, publicKey } = getApiKeys();

    // Using v2 API endpoint if no contentTypeId is provided
    if (!contentTypeId) {
      logger.log(`Fetching sync status for entry ${entryId} (v2 API)`);
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'syncFetchStatus',
          data: {
            entryId,
          },
          // Use retrieved API keys
          privateKey,
          publicKey,
        }),
      });

      if (!response.ok) {
        // If the backend is not available, assume sync is needed
        if (response.status >= 500) {
          logger.warn(`Backend service unavailable when checking sync status: ${response.status}`);
          return true;
        }

        const errorData = await response.json();
        logger.error('Error fetching sync status:', errorData);
        return true; // If we can't determine status, assume sync is needed
      }

      const data = await response.json();
      return data.data?.needsSync === true;
    }

    // Original v1 API endpoint - also update this to use the common base URL
    logger.log(`Fetching sync status for entry ${entryId} of type ${contentTypeId}`);
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'syncFetchDetailedStatus',
        data: {
          entryId,
          contentTypeId,
        },
        // Use retrieved API keys
        privateKey,
        publicKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || !data.data) {
      return null;
    }

    // Transform to match SyncStatus interface
    return {
      entryId: data.data.entryId,
      contentTypeId: data.data.contentTypeId,
      contentTypeName: data.data.contentTypeName,
      lastSynced: data.data.lastSynced || 0,
      fieldsUpdatedAt: data.data.fieldsUpdatedAt || {},
      needsSync: data.data.needsSync || false,
      syncCompleted: data.data.syncCompleted || false,
    };
  } catch (error) {
    logger.error('Error fetching sync status:', error);
    return null;
  }
};

/**
 * Get all sync statuses from the backend
 */
export const fetchAllSyncStatuses = async (token: string): Promise<SyncStatus[]> => {
  try {
    // Get API keys from localStorage
    const { privateKey, publicKey } = getApiKeys();

    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'syncFetchAllStatuses',
        // Use retrieved API keys
        privateKey,
        publicKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data.data)) {
      return [];
    }

    // Transform data to match SyncStatus interface
    return data.data.map((item: any) => ({
      entryId: item.entryId,
      contentTypeId: item.contentTypeId,
      contentTypeName: item.contentTypeName || '',
      lastSynced: item.lastSynced || 0,
      fieldsUpdatedAt: item.fieldsUpdatedAt || {},
      needsSync: item.needsSync || false,
      syncCompleted: item.syncCompleted || false,
    }));
  } catch (error) {
    logger.error('Error fetching all sync statuses:', error);
    return [];
  }
};

/**
 * Get API keys from localStorage
 */
const getApiKeys = (): { privateKey: string; publicKey: string } => {
  try {
    // Try the new keys format first
    const keysString = localStorage.getItem('klaviyo_api_keys');
    if (keysString) {
      const keys = JSON.parse(keysString);
      // Check for correct key names (publicKey/privateKey)
      if (keys.publicKey && keys.privateKey) {
        logger.log('Found API keys in localStorage with new naming');
        return {
          privateKey: keys.privateKey,
          publicKey: keys.publicKey,
        };
      }

      // Check for old key names (apiKey/privateKey)
      if (keys.apiKey && keys.privateKey) {
        logger.log('Found API keys in localStorage with old naming');
        return {
          privateKey: keys.privateKey,
          publicKey: keys.apiKey,
        };
      }
    }

    // If not found or invalid, log a warning
    logger.warn('API keys not found in localStorage or have invalid format');
  } catch (error) {
    logger.error('Error retrieving API keys from localStorage:', error);
  }
  return { privateKey: '', publicKey: '' };
};

/**
 * Mark an entry for sync via the API
 */
export const markEntryForSyncViaApi = async (
  entryId: string,
  contentTypeIdOrFieldIds?: string | string[],
  contentTypeName?: string
): Promise<boolean> => {
  try {
    // Get the base URL (which should be '/api/klaviyo/proxy')
    const baseUrl = getBaseUrl();
    // Get API keys from localStorage
    const { privateKey, publicKey } = getApiKeys();

    // Using v2 API endpoint if contentTypeIdOrFieldIds is an array (fieldIds)
    if (Array.isArray(contentTypeIdOrFieldIds)) {
      const fieldIds = contentTypeIdOrFieldIds;
      // Instead of using /request, use the legacy proxy approach since the sync endpoints aren't in the allowed list
      const response = await fetch(`${baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'syncMark',
          data: {
            entryId,
            fieldIds,
          },
          // Use retrieved API keys
          privateKey,
          publicKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('Error marking entry for sync:', errorData);
        return false;
      }

      return true;
    }

    // Original v1 API endpoint
    const contentTypeId = contentTypeIdOrFieldIds as string;
    // Use the legacy proxy endpoint
    const response = await fetch(`${baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'syncMarkForSync',
        data: {
          entryId,
          contentTypeId,
          contentTypeName: contentTypeName || '',
        },
        // Use retrieved API keys
        privateKey,
        publicKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (error) {
    logger.error('Error marking entry for sync:', error);
    return false;
  }
};

/**
 * Update sync status after successful sync
 */
export const updateSyncStatusViaApi = async (
  entryId: string,
  contentTypeId: string,
  fields?: Record<string, number>
): Promise<boolean> => {
  try {
    const baseUrl = getBaseUrl();
    // Get API keys from localStorage
    const { privateKey, publicKey } = getApiKeys();

    const response = await fetch(`${baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'syncUpdateStatus',
        data: {
          entryId,
          contentTypeId,
          fieldsUpdatedAt: fields,
        },
        // Use retrieved API keys
        privateKey,
        publicKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (error) {
    logger.error('Error updating sync status:', error);
    return false;
  }
};

/**
 * Sync an entry to Klaviyo via the API
 */
export async function syncEntryToKlaviyo(
  entryId: string,
  contentTypeId: string,
  entryData: Record<string, any>,
  spaceId?: string
): Promise<SyncResult> {
  try {
    const baseUrl = getBaseUrl();
    // Get API keys from localStorage
    const { privateKey, publicKey } = getApiKeys();

    // Log what was passed to the function
    console.log('syncEntryToKlaviyo called with:', {
      entryId,
      contentTypeId,
      entryDataProvided: !!entryData,
      entryDataType: entryData ? typeof entryData : 'undefined',
      entryDataEmpty: entryData ? Object.keys(entryData).length === 0 : true,
      entryDataFields: entryData ? Object.keys(entryData) : [],
    });

    // If entry data wasn't provided or is empty, try to get it from the SDK
    let entry = entryData;

    if (!entry || Object.keys(entry).length === 0) {
      console.log('Entry data is empty or undefined, trying to get it from SDK');
      try {
        // First, attempt to get entry data from Contentful SDK with retry logic
        let sdk = null;
        for (let retry = 0; retry < 3; retry++) {
          sdk = await getGlobalSDK();
          if (sdk?.entry?.fields) {
            console.log(`SDK retrieved on attempt ${retry + 1}`);
            break;
          }
          console.log(`SDK not fully available on attempt ${retry + 1}, waiting...`);
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        if (sdk?.entry?.fields) {
          console.log('SDK entry fields found, processing them');
          const fields = sdk.entry.fields;
          entry = {};

          // Process each field to get its value
          for (const fieldId of Object.keys(fields)) {
            try {
              const field = fields[fieldId];

              // Make sure field has getValue method
              if (typeof field.getValue !== 'function') {
                console.warn(`Field ${fieldId} has no getValue method`);
                continue;
              }

              // Get the value (handles localized content)
              const value = field.getValue();

              console.log(`Processing field ${fieldId}:`, {
                type: typeof value,
                isNull: value === null,
                isUndefined: value === undefined,
                isObject: typeof value === 'object',
                isArray: Array.isArray(value),
              });

              if (value !== undefined && value !== null) {
                entry[fieldId] = value;
              }
            } catch (fieldError) {
              console.warn(`Error processing field ${fieldId}:`, fieldError);
            }
          }

          // Try to get entry sys data for title
          if (!entry.title && typeof sdk.entry.getSys === 'function') {
            try {
              const sys = sdk.entry.getSys();
              entry.title = `Entry ${sys.id}`;
            } catch (sysError) {
              console.warn('Error getting entry sys for title:', sysError);
            }
          }

          console.log('Using entry data from SDK:', entry);
          console.log('SDK entry fields count:', Object.keys(entry).length);
        } else {
          console.warn('SDK entry not available after retries, using fallbacks');

          // Add fallback data since we couldn't get it from the SDK
          entry = {
            title: `Entry ${entryId}`,
            contentType: contentTypeId,
            _note:
              "This is a fallback entry with minimal data as the full entry data couldn't be accessed",
          };
        }
      } catch (err) {
        console.warn('Error fetching entry data from SDK:', err);

        // Use fallback minimal data
        entry = {
          title: `Entry ${entryId}`,
          contentType: contentTypeId,
          _error:
            'Could not access entry data: ' + (err instanceof Error ? err.message : String(err)),
        };
      }
    }

    // Final check for entry data and ensure minimum content
    if (!entry || Object.keys(entry).length === 0) {
      console.warn('No entry data available after all attempts, using minimal fallback data');
      entry = {
        title: `Entry ${entryId} from ${contentTypeId}`,
        contentType: contentTypeId,
        _fallback: true,
        _timestamp: new Date().toISOString(),
        _note: 'This is fallback content created because no entry data could be accessed',
      };
    }

    // Log what's being sent to the API
    console.log('Sending to API:', {
      action: 'syncEntry',
      entryId,
      contentTypeId,
      entryDataKeys: entry ? Object.keys(entry) : [],
      entryDataSize: entry ? JSON.stringify(entry).length : 0,
    });

    // Fetch the current field mappings from the API to ensure they're included
    const mappings = await getSavedFieldMappings(contentTypeId);
    console.log('Retrieved mappings for content type:', contentTypeId, mappings);

    // Prepare the cleaned entry data to send
    const cleanedEntry = { ...entry };

    // Check mappings against entry data and log info about missing fields
    for (const mapping of mappings) {
      const fieldId = mapping.contentfulFieldId;
      if (!cleanedEntry[fieldId]) {
        console.log(
          `Warning: Mapped field "${fieldId}" not found in entry data. Available fields: ${Object.keys(
            cleanedEntry
          ).join(', ')}`
        );
      } else {
        console.log(
          `Field "${fieldId}" found in entry data with type: ${typeof cleanedEntry[fieldId]}`
        );
      }
    }

    // Send the request with improved error handling
    try {
      const payload: any = {
        entryId,
        contentTypeId,
        entryData: cleanedEntry,
        fieldMappings: mappings,
      };
      if (spaceId) {
        payload.spaceId = spaceId;
      }
      const response = await fetch(`${baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText || `API error: ${response.status}` };
        }

        console.error('API error response:', errorData);
        return {
          success: false,
          errors: [
            errorData.message || `API error: ${response.status} - ${errorText.substring(0, 200)}`,
          ],
        };
      }

      const result = await response.json();
      console.log('API success response:', result);
      return {
        success: result.data?.success,
        message: result.data?.message,
        errors: result.data?.errors,
      };
    } catch (error: any) {
      console.error('Network or parsing error in syncEntryToKlaviyo:', error);
      return {
        success: false,
        errors: [error.message || 'Unknown network or parsing error'],
      };
    }
  } catch (error: any) {
    console.error('Exception in syncEntryToKlaviyo:', error);
    return {
      success: false,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Validate Klaviyo API credentials
 */
export async function validateKlaviyoCredentials(
  privateKey: string,
  publicKey: string
): Promise<{ valid: boolean; message?: string }> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/validate-credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        privateKey,
        publicKey,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Invalid credentials';

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        logger.error('Error parsing error response:', e, errorText);
      }

      return { valid: false, message: errorMessage };
    }

    const data = await response.json();
    return {
      valid: data.valid,
      message: data.message,
    };
  } catch (error: any) {
    return {
      valid: false,
      message: error.message || 'Connection error',
    };
  }
}

/**
 * Get saved field mappings for a specific content type
 */
export const getSavedFieldMappings = async (contentTypeId: string): Promise<any[]> => {
  try {
    // Get mappings from localStorage
    const allMappings = getLocalMappings();

    // Filter by content type ID
    const typeMappings = allMappings.filter((mapping) => mapping.contentTypeId === contentTypeId);

    logger.log(`Found ${typeMappings.length} field mappings for content type ${contentTypeId}`);

    // Format mappings for Klaviyo
    return typeMappings.map((mapping) => ({
      contentfulFieldId: mapping.id,
      klaviyoBlockName: mapping.name || mapping.id,
      fieldType: mapping.type === 'RichText' ? 'richText' : 'text',
    }));
  } catch (error) {
    logger.error('Error getting field mappings:', error);
    return [];
  }
};

/**
 * Safely saves field mappings to localStorage
 * @param mappings Field mappings to save
 * @returns True if successful, false otherwise
 */
export const saveLocalMappings = (mappings: any[]): boolean => {
  try {
    if (!Array.isArray(mappings)) {
      logger.warn('[saveLocalMappings] Attempted to save non-array mappings:', mappings);
      return false;
    }

    localStorage.setItem('klaviyo_field_mappings', JSON.stringify(mappings));
    logger.log(
      '[saveLocalMappings] Successfully saved',
      mappings.length,
      'mappings to localStorage'
    );
    return true;
  } catch (error) {
    logger.error('[saveLocalMappings] Error saving mappings to localStorage:', error);
    return false;
  }
};
