/**
 * Sync API Service
 *
 * Utilities for interacting with the backend sync status API
 */

import { SyncStatus } from './klaviyo-api-service';
import logger from './logger';
import { AppConfigAPI } from '@contentful/app-sdk';

// Define the base URL for the serverless function
// This should be set in your environment or app config
const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:3001';

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
    // Using v2 API endpoint if no contentTypeId is provided
    if (!contentTypeId) {
      logger.log(`Fetching sync status for entry ${entryId} (v2 API)`);

      const response = await fetch(`/api/klaviyo/sync/status/${entryId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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
      return data.needsSync === true;
    }

    // Original v1 API endpoint
    logger.log(`Fetching sync status for entry ${entryId} of type ${contentTypeId}`);

    const response = await fetch(
      `${API_BASE_URL}/api/klaviyo/sync-status?entryId=${encodeURIComponent(
        entryId
      )}&contentTypeId=${encodeURIComponent(contentTypeId)}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data) {
      return null;
    }

    // Transform to match SyncStatus interface
    return {
      entryId: data.entryId,
      contentTypeId: data.contentTypeId,
      contentTypeName: data.contentTypeName,
      lastSynced: data.lastSynced || 0,
      fieldsUpdatedAt: data.fieldsUpdatedAt || {},
      needsSync: data.needsSync || false,
      syncCompleted: data.syncCompleted || false,
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
    const response = await fetch(`${API_BASE_URL}/api/klaviyo/sync-status/all`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    // Transform data to match SyncStatus interface
    return data.map((item) => ({
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
 * Mark an entry for syncing via the backend API
 */
export const markEntryForSyncViaApi = async (
  entryId: string,
  contentTypeIdOrFieldIds?: string | string[],
  contentTypeName?: string
): Promise<boolean> => {
  try {
    // Using v2 API endpoint if contentTypeIdOrFieldIds is an array (fieldIds)
    if (Array.isArray(contentTypeIdOrFieldIds)) {
      const fieldIds = contentTypeIdOrFieldIds;
      const response = await fetch(`/api/klaviyo/sync/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryId,
          fieldIds,
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
    const response = await fetch(`${API_BASE_URL}/api/klaviyo/mark-for-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entryId,
        contentTypeId,
        contentTypeName: contentTypeName || '',
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
    const response = await fetch(`${API_BASE_URL}/api/klaviyo/update-sync-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entryId,
        contentTypeId,
        lastSynced: Date.now(),
        fieldsUpdatedAt: fields || {},
        needsSync: false,
        syncCompleted: true,
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
 * Triggers immediate sync of an entry to Klaviyo
 */
export async function syncEntryToKlaviyo(
  entryId: string,
  contentTypeId: string
): Promise<SyncResult> {
  try {
    const response = await fetch(`/api/klaviyo/sync/entry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entryId,
        contentTypeId,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          errors: [
            'Authentication failed. Please check your Klaviyo credentials in the app configuration.',
          ],
        };
      }

      const errorData = await response.json();
      return {
        success: false,
        errors: Array.isArray(errorData.errors)
          ? errorData.errors
          : [errorData.message || 'Unknown error occurred'],
      };
    }

    return await response.json();
  } catch (error) {
    logger.error('Exception during sync:', error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
    };
  }
}

/**
 * Validates Klaviyo API credentials
 */
export async function validateKlaviyoCredentials(
  privateKey: string,
  publicKey: string
): Promise<{ valid: boolean; message?: string }> {
  try {
    const response = await fetch(`/api/klaviyo/validate-credentials`, {
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
      const errorData = await response.json();
      return {
        valid: false,
        message: errorData.message || `Validation failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      valid: data.valid === true,
      message: data.message,
    };
  } catch (error) {
    logger.error('Exception during credential validation:', error);
    return {
      valid: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred during validation',
    };
  }
}
