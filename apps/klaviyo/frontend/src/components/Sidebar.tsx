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

  // Get full entry data including deep fields
  const getFullEntryData = async (): Promise<Record<string, any>> => {
    try {
      // Check that SDK and entry are available
      if (!sdk || !sdk.entry || !sdk.entry.fields) {
        logger.error('SDK or entry not fully available for data collection');
        throw new Error('SDK or entry not fully available');
      }

      // Wait a moment to ensure entry is fully loaded
      await new Promise((resolve) => setTimeout(resolve, 100));

      const entryFields = sdk.entry.fields;
      const processedFields: Record<string, any> = {};

      logger.log(`Found ${Object.keys(entryFields).length} fields in entry`);

      // First pass to collect field IDs for logging
      const fieldIds = Object.keys(entryFields);
      logger.log('Available fields:', fieldIds);

      // Process fields to get current values
      fieldIds.forEach((fieldId) => {
        try {
          const field = entryFields[fieldId];

          if (!field) {
            logger.warn(`Field ${fieldId} exists in keys but is undefined`);
            return;
          }

          // Check if field has getValue method
          if (typeof field.getValue !== 'function') {
            logger.warn(`Field ${fieldId} has no getValue method`, field);
            return;
          }

          // For localized content, take the current locale value
          const rawValue = field.getValue();

          logger.log(`Processing field "${fieldId}":`, {
            type: typeof rawValue,
            isNull: rawValue === null,
            isUndefined: rawValue === undefined,
            isObject: typeof rawValue === 'object',
            isArray: Array.isArray(rawValue),
            hasNodeType: rawValue && typeof rawValue === 'object' && 'nodeType' in rawValue,
          });

          if (rawValue !== undefined && rawValue !== null) {
            // For rich text, include the entire document
            if (rawValue && typeof rawValue === 'object' && rawValue.nodeType === 'document') {
              processedFields[fieldId] = rawValue;
            }
            // For arrays (like references)
            else if (Array.isArray(rawValue)) {
              processedFields[fieldId] = rawValue.map((item) => {
                if (item && item.sys && item.sys.id) {
                  return {
                    id: item.sys.id,
                    linkType: item.sys.linkType || 'Entry',
                  };
                }
                return item;
              });
            }
            // For simple values
            else {
              processedFields[fieldId] = rawValue;
            }
          }
        } catch (error) {
          logger.warn(`Error processing field ${fieldId}:`, error);
        }
      });

      // Add the entry title as a special field if not already present
      if (!processedFields.title && sdk.entry.getSys) {
        try {
          const entrySys = sdk.entry.getSys();
          processedFields.title = entrySys.id ? `Entry ${entrySys.id}` : null;

          // Also try to get the content type name
          if (sdk.contentType && sdk.contentType.name) {
            processedFields.contentTypeName = sdk.contentType.name;
          }
        } catch (error) {
          logger.warn('Error getting entry title:', error);
        }
      }

      // Add some default content if we have no fields
      if (Object.keys(processedFields).length === 0) {
        logger.warn('No field data found, adding default entry data');
        processedFields.title = `Entry ${sdk.ids.entry}`;
        processedFields.defaultContent =
          'This entry has no content fields or they could not be accessed';
      }

      logger.log('Final processed fields:', processedFields);
      logger.log('Field count:', Object.keys(processedFields).length);

      return processedFields;
    } catch (error) {
      logger.error('Error collecting complete entry data:', error);
      throw error;
    }
  };

  // Handle sync button click
  const handleSync = async () => {
    try {
      setSyncing(true);
      setErrors([]);

      console.log('handleSync called', sdk);
      // Check that SDK and essential components are available
      if (!sdk || !sdk.ids || !sdk.ids.entry || !sdk.ids.contentType) {
        throw new Error('SDK or entry information not available');
      }

      // Get content type information
      const contentTypeId = sdk.ids.contentType;
      const entryId = sdk.ids.entry;

      // Verify we have an entry ID
      if (!entryId) {
        const entrySys = sdk.entry?.getSys ? sdk.entry.getSys() : null;
        throw new Error(
          `Entry ID not available. SDK entry state: ${entrySys ? 'has sys' : 'no sys'}`
        );
      }

      logger.log(`Syncing entry ${entryId} of type ${contentTypeId} to Klaviyo...`);

      // Get complete entry data
      let processedFields: Record<string, any>;
      try {
        processedFields = await getFullEntryData();
      } catch (fieldError) {
        logger.error('Failed to get entry data:', fieldError);
        setErrors(['Failed to retrieve entry data. Please reload the entry and try again.']);
        sdk.notifier.error('Failed to retrieve entry data');
        setSyncing(false);
        return;
      }

      // Check if we have any fields
      if (!processedFields || Object.keys(processedFields).length === 0) {
        logger.error('No fields found in entry data');
        setErrors(['No content fields found in this entry. Please add content before syncing.']);
        sdk.notifier.error('No content to sync to Klaviyo');
        setSyncing(false);
        return;
      }

      logger.log('Prepared entry fields:', processedFields);
      logger.log('Entry fields count:', Object.keys(processedFields).length);

      // Call the API to sync the entry with field data
      const result = await syncEntryToKlaviyo(entryId, contentTypeId, processedFields);

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
