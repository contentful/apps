import React, { useCallback, useEffect, useState } from 'react';
import { Button, Flex, FormControl, Note, Text, TextLink } from '@contentful/f36-components';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import {
  initializeEntryChangeMonitoring,
  checkIfEntryNeedsSync,
  registerPublishListener,
} from '../utils/entry-change-listener';
import { syncEntryToKlaviyo } from '../utils/sync-api';
import { useSDK } from '@contentful/react-apps-toolkit';
import { getFieldMappings } from '../utils/field-mappings';
import { ErrorList } from './ErrorList';
import logger from '../utils/logger';

interface FieldMapping {
  contentfulFieldId: string;
  klaviyoBlockName?: string;
  id?: string;
  fieldType?: string;
}

const Sidebar = () => {
  const sdk = useSDK<SidebarExtensionSDK>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [needsSync, setNeedsSync] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);

  // Check if entry needs syncing on initial load
  const checkSyncStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      logger.log('Checking if entry needs syncing...');
      const result = await checkIfEntryNeedsSync(sdk);
      logger.log(`Sync status check result: ${result ? 'Needs sync' : 'Already synced'}`);
      setNeedsSync(result);
    } catch (error) {
      logger.error('Error checking sync status:', error);
      setErrors((prev) => [...prev, 'Error checking sync status']);
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  // Initialize on mount
  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const initialize = async () => {
      try {
        setIsLoading(true);
        setErrors([]);

        // Get field mappings
        const mappings = await getFieldMappings(sdk);
        setFieldMappings(mappings);

        if (!mappings || mappings.length === 0) {
          logger.warn('No field mappings found for this content type');
          return;
        }

        // Initialize the change monitoring
        cleanup = initializeEntryChangeMonitoring(sdk, mappings);

        // Register a listener for publish events
        const publishCleanup = registerPublishListener(sdk);

        // Check initial sync status
        await checkSyncStatus();

        // Update cleanup to include publish listener
        const originalCleanup = cleanup;
        cleanup = () => {
          if (originalCleanup) originalCleanup();
          publishCleanup();
        };
      } catch (error) {
        logger.error('Error initializing sidebar:', error);
        setErrors((prev) => [...prev, 'Failed to initialize Klaviyo sidebar']);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      if (cleanup) cleanup();
    };
  }, [sdk, checkSyncStatus]);

  // Handle sync button click
  const handleSync = async () => {
    try {
      setSyncing(true);
      setErrors([]);

      // Get content type information
      const contentTypeId = sdk.ids.contentType;
      const entryId = sdk.entry.getSys().id;

      logger.log(`Syncing entry ${entryId} to Klaviyo...`);

      // Call the API to sync the entry
      const result = await syncEntryToKlaviyo(entryId, contentTypeId);

      if (result.success) {
        // Show success message
        sdk.notifier.success('Entry successfully synced to Klaviyo');
        setNeedsSync(false);
        setLastSyncTime(new Date().toLocaleString());
      } else if (result.errors && result.errors.length > 0) {
        // Show errors
        setErrors(result.errors);
        sdk.notifier.error('Failed to sync entry to Klaviyo. See details in the sidebar.');
      } else {
        // Generic error
        setErrors(['Unknown error occurred during sync']);
        sdk.notifier.error('Failed to sync entry to Klaviyo');
      }
    } catch (error) {
      logger.error('Error syncing to Klaviyo:', error);
      setErrors((prev) => [
        ...prev,
        'Failed to sync to Klaviyo: ' + (error instanceof Error ? error.message : 'Unknown error'),
      ]);
      sdk.notifier.error('Failed to sync entry to Klaviyo');
    } finally {
      setSyncing(false);
      // Refresh sync status after sync attempt
      checkSyncStatus();
    }
  };

  // Format time display
  const formatTimeDisplay = () => {
    if (!lastSyncTime) return null;

    return (
      <Text fontColor="gray500" fontWeight="fontWeightMedium">
        Last synced: {lastSyncTime}
      </Text>
    );
  };

  return (
    <Flex flexDirection="column" padding="spacingM" gap="spacingM">
      <Text fontWeight="fontWeightMedium">Klaviyo Sync</Text>

      {errors.length > 0 && <ErrorList errors={errors} />}

      {fieldMappings.length === 0 ? (
        <Note variant="warning">
          No field mappings found for this content type. Please configure mappings in the app
          configuration.
        </Note>
      ) : (
        <Flex flexDirection="column" gap="spacingS">
          {needsSync ? (
            <Note variant="warning">This entry has changes that need to be synced to Klaviyo.</Note>
          ) : (
            <Note variant="positive">Entry is in sync with Klaviyo.</Note>
          )}

          {formatTimeDisplay()}

          <FormControl>
            <Button
              variant="primary"
              isFullWidth
              onClick={handleSync}
              isLoading={isLoading || syncing}
              isDisabled={isLoading}>
              {syncing ? 'Syncing...' : 'Sync to Klaviyo'}
            </Button>
          </FormControl>

          <Text fontColor="gray500" fontWeight="fontWeightMedium">
            <TextLink
              href="https://www.klaviyo.com/dashboard"
              target="_blank"
              rel="noopener noreferrer">
              Open Klaviyo Dashboard
            </TextLink>
          </Text>
        </Flex>
      )}
    </Flex>
  );
};

export default Sidebar;
