import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { markEntryForSyncViaApi } from './sync-api';
import logger from './logger';

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
