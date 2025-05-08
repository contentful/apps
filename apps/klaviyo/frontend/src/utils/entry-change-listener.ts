import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { fetchEntrySyncStatus, markEntryForSyncViaApi, SyncStatus } from './sync-api';
import logger from './logger';

/**
 * Initialize minimal change listeners for a Contentful entry in the sidebar
 *
 * This version still watches local entry changes for immediate feedback,
 * but defers actual determination of sync status to the backend app.
 *
 * @param sdk The Contentful SDK instance
 * @param fieldMappings Array of field mappings or field IDs to monitor
 * @returns Cleanup function to remove listeners
 */
export const initializeEntryChangeMonitoring = (
  sdk: SidebarExtensionSDK,
  fieldMappings: Array<{ id?: string; contentfulFieldId?: string } | string>
): (() => void) => {
  try {
    logger.log('Initializing entry change monitoring for Klaviyo (API version)');

    // Extract field IDs from different mapping formats
    const fieldIds: string[] = fieldMappings
      .map((mapping) => {
        if (typeof mapping === 'string') {
          return mapping;
        } else if (mapping.id) {
          return mapping.id;
        } else if (mapping.contentfulFieldId) {
          return mapping.contentfulFieldId;
        } else {
          return '';
        }
      })
      .filter((id) => !!id);

    if (fieldIds.length === 0) {
      logger.warn('No valid field IDs provided for change monitoring');
      return () => {}; // Return empty cleanup function
    }

    // Get entry and content type info
    const entryId = sdk.entry.getSys().id;
    const contentTypeId = sdk.ids.contentType;
    const contentTypeName = sdk.contentType?.name || '';

    // Array to store cleanup functions
    const cleanupFunctions: (() => void)[] = [];

    // Set up minimal change notification (mainly for UI feedback)
    // The actual decision of whether sync is needed will be made by the backend
    for (const fieldId of fieldIds) {
      try {
        const field = sdk.entry.fields[fieldId];
        if (field) {
          // Listen for value changes
          const removeValueListener = field.onValueChanged(() => {
            logger.log(`Field ${fieldId} changed, notifying backend`);

            // Send notification to backend
            markEntryForSyncViaApi(entryId, contentTypeId, contentTypeName, sdk)
              .then(() => {
                logger.log(`Successfully notified backend of changes to entry ${entryId}`);
              })
              .catch((error) => {
                logger.error(`Error notifying backend of entry changes:`, error);
              });
          });

          cleanupFunctions.push(removeValueListener);
        }
      } catch (error) {
        logger.error(`Error setting up change listener for field ${fieldId}:`, error);
      }
    }

    // Return a cleanup function that removes all listeners
    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
      logger.log('Removed all field change listeners');
    };
  } catch (error) {
    logger.error('Error initializing entry change monitoring:', error);
    return () => {}; // Return empty cleanup function in case of error
  }
};

/**
 * Manually check if an entry needs syncing based on its current state
 *
 * This version checks with the backend API
 *
 * @param sdk The Contentful SDK instance
 * @param contentTypeId Content type ID
 * @returns Boolean indicating if the entry needs syncing
 */
export const checkIfEntryNeedsSync = async (
  sdk: SidebarExtensionSDK,
  contentTypeId?: string
): Promise<boolean> => {
  try {
    // Get entry ID and content type info
    const entryId = sdk.entry.getSys().id;
    const ctId = contentTypeId || sdk.ids.contentType;

    // Check with backend API
    const syncStatus = await fetchEntrySyncStatus(entryId, ctId, sdk);

    // If no status exists, or needsSync is true
    return syncStatus === null || (syncStatus as SyncStatus).needsSync;
  } catch (error) {
    logger.error('Error checking if entry needs sync:', error);
    return true; // Default to needing sync if there's an error
  }
};

/**
 * Utility function to register listeners for syncing entries on publish
 *
 * @param sdk The Contentful SDK instance
 */
export const registerPublishListener = (sdk: SidebarExtensionSDK): (() => void) => {
  try {
    // Listen for entry publish events
    const removeHandler = sdk.entry.onSysChanged((sys) => {
      try {
        // Check if this is a publish event (published version changed)
        if (sys.publishedVersion && sys.version === sys.publishedVersion) {
          logger.log('Entry was published, notifying backend');

          const entryId = sdk.entry.getSys().id;
          const contentTypeId = sdk.ids.contentType;
          const contentTypeName = sdk.contentType?.name || '';

          // Mark for sync in backend
          markEntryForSyncViaApi(entryId, contentTypeId, contentTypeName, sdk)
            .then(() => {
              // Notify the user that the entry needs to be synced
              sdk.notifier.success(
                'Entry has been published. It will be marked for sync in Klaviyo.'
              );
            })
            .catch((error) => {
              logger.error('Error marking published entry for sync:', error);
              sdk.notifier.error('Error marking entry for sync after publish.');
            });
        }
      } catch (error) {
        logger.error('Error in publish listener:', error);
      }
    });

    return removeHandler;
  } catch (error) {
    logger.error('Error registering publish listener:', error);
    return () => {}; // Return empty cleanup function in case of error
  }
};
