import React, { useEffect, useState } from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Box,
  Stack,
  Text,
  Heading,
  Flex,
  Badge,
  Accordion,
  AccordionItem,
  Tooltip,
  ModalConfirm,
} from '@contentful/f36-components';
import {
  SyncStatus,
  SyncContent,
  getAllSyncStatuses,
  markEntryForSync,
} from '../utils/klaviyo-api-service';
import { formatDistanceToNow } from 'date-fns';
import logger from '../utils/logger';

interface SyncStatusTableProps {
  onRefresh?: () => void;
  sdk: any;
}

export const SyncStatusTable: React.FC<SyncStatusTableProps> = ({ onRefresh, sdk }) => {
  const [statuses, setStatuses] = useState<SyncStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // Load sync statuses
  const loadSyncStatuses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      logger.log('Loading sync statuses using SDK...');

      // Always force refresh to get the latest data
      const syncStatuses = await getAllSyncStatuses(true, sdk);

      // Log detailed information about the statuses
      logger.log('Loaded sync statuses:', JSON.stringify(syncStatuses, null, 2));

      if (syncStatuses.length === 0) {
        logger.log('No sync statuses found. Checking localStorage directly...');
        const localStorageKey = 'klaviyo_sync_status';
        const localData = localStorage.getItem(localStorageKey);
        if (localData) {
          logger.log('Found data in localStorage:', localData);
        } else {
          logger.log('No data found in localStorage');
        }
      }

      setStatuses(syncStatuses);
    } catch (err: any) {
      setError(err.message || 'Failed to load sync statuses');
      logger.error('Error loading sync statuses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load on mount and listen for sync events
  useEffect(() => {
    loadSyncStatuses();

    // Set up event listener for sync completion
    const handleSyncCompleted = () => {
      logger.log('Received sync completed event, refreshing status table...');
      loadSyncStatuses();
    };

    // Listen for sync completed events
    window.addEventListener('klaviyo-sync-completed', handleSyncCompleted);

    // Clean up event listener
    return () => {
      window.removeEventListener('klaviyo-sync-completed', handleSyncCompleted);
    };
  }, []);

  // Refresh handler
  const handleRefresh = () => {
    loadSyncStatuses();
    if (onRefresh) {
      onRefresh();
    }
  };

  // Clear all sync statuses
  const clearAllSyncStatuses = () => {
    try {
      // Clear localStorage sync data
      localStorage.removeItem('klaviyo_sync_status');
      localStorage.removeItem('klaviyo_sync_status_cache');

      // Attempt to clear app parameters sync data if possible
      if (sdk?.app?.getParameters) {
        sdk.app
          .getParameters()
          .then((parameters: any) => {
            if (parameters) {
              // Create updated parameters with empty sync data
              const updatedParams = {
                ...parameters,
                syncData: {
                  syncStatuses: [],
                  lastUpdated: Date.now(),
                },
              };

              // Try to update via onConfigure
              if (sdk?.app?.onConfigure) {
                sdk.app.onConfigure(() => ({
                  parameters: updatedParams,
                }));

                logger.log('Updated parameters to clear sync data');
              }
            }
          })
          .catch((err: any) => {
            logger.error('Error updating parameters:', err);
          });
      }

      // Notify user
      sdk.notifier.success('All sync status data has been cleared');

      // Refresh the table
      setStatuses([]);

      // Trigger event to notify other components
      window.dispatchEvent(new CustomEvent('klaviyo-sync-data-cleared'));

      logger.log('All sync status data cleared successfully');
    } catch (err) {
      logger.error('Error clearing sync status data:', err);
      sdk.notifier.error('Failed to clear sync status data');
    }
  };

  // Helper to format date
  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Helper to calculate how long since last sync
  const timeSinceSync = (timestamp: number) => {
    // Check for invalid timestamp
    if (!timestamp || isNaN(timestamp)) return 'Never synced';

    const now = Date.now();
    const diff = now - timestamp;

    // Validate the difference is positive
    if (diff < 0) return 'Just now';

    // Convert to minutes, hours, days
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;

    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  // Open Contentful entry in a new tab
  const openEntry = (entryId: string, contentTypeId: string) => {
    // Construct Contentful URL
    // This assumes we're in a Contentful environment
    try {
      const url = new URL(window.location.href);
      const spaceId = url.pathname.split('/')[2];
      const environmentId = url.pathname.split('/')[4];

      const entryUrl = `https://app.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries/${entryId}`;
      window.open(entryUrl, '_blank');
    } catch (error) {
      logger.error('Error opening entry:', error);
    }
  };

  // Add a function to manually mark an entry for sync (for testing)
  const toggleSyncStatus = async (status: SyncStatus) => {
    try {
      if (status.needsSync) {
        // Show loading notification
        sdk.notifier.success('Syncing to Klaviyo...', { duration: 3000 });

        logger.log('Getting entry:', status.entryId);

        // Get the entry from Contentful
        const entry = await sdk.space.getEntry(status.entryId);

        logger.log('Retrieved entry:', entry);

        // Create a new SyncContent instance with SDK reference
        const syncContent = new SyncContent(entry, sdk);

        // Try multiple ways to get field mappings
        let fieldMappings = [];

        // First try to get from app parameters (most reliable)
        try {
          const appParams = await sdk.app.getParameters();
          logger.log('App parameters:', appParams);

          if (appParams?.installation?.fieldMappings) {
            fieldMappings = appParams.installation.fieldMappings;
          }
        } catch (err) {
          logger.error('Error getting app parameters:', err);
        }

        // If that didn't work, try parameters.installation
        if (fieldMappings.length === 0) {
          try {
            const installParams = sdk.parameters?.installation;
            logger.log('Installation parameters:', installParams);

            if (installParams?.fieldMappings) {
              fieldMappings = installParams.fieldMappings;
            } else if (installParams?.installation?.fieldMappings) {
              fieldMappings = installParams.installation.fieldMappings;
            }
          } catch (err) {
            logger.error('Error accessing installation parameters:', err);
          }
        }

        // If we still don't have mappings, try to build simple ones
        if (fieldMappings.length === 0) {
          const entryFields = Object.keys(entry.fields || {});
          logger.log('Building simple mappings from entry fields:', entryFields);

          // Create basic mappings using field names
          fieldMappings = entryFields.map((fieldId) => ({
            contentfulFieldId: fieldId,
            klaviyoBlockName: fieldId,
            fieldType: 'text',
          }));
        }

        // Perform the sync operation
        try {
          await syncContent.syncContent(sdk, fieldMappings, { useSdk: true });
          sdk.notifier.success('Content synced to Klaviyo');
        } catch (syncErr) {
          sdk.notifier.error(`Sync failed: ${(syncErr as Error).message || 'Unknown error'}`);
          logger.error('Sync error:', syncErr);
        }
      } else {
        // Mark for sync
        await markEntryForSync(status.entryId, status.contentTypeId, status.contentTypeName, sdk);
        sdk.notifier.success('Entry marked for sync');
      }

      // Refresh the status list
      await loadSyncStatuses();
    } catch (err) {
      logger.error('Error toggling sync status:', err);
      sdk.notifier.error('Failed to update sync status');
    }
  };

  return (
    <Box>
      <Stack spacing="spacingM" flexDirection="column" alignItems="flex-start">
        <Flex justifyContent="space-between" alignItems="flex-start" padding="spacingS">
          <Button
            variant="secondary"
            size="small"
            onClick={handleRefresh}
            isLoading={isLoading}
            isDisabled={isLoading}>
            Refresh
          </Button>
          <Button
            style={{ marginLeft: '16px' }}
            variant="negative"
            size="small"
            onClick={() => setIsConfirmDialogOpen(true)}
            isDisabled={statuses.length === 0 || isLoading}>
            Clear All
          </Button>
        </Flex>

        {error && <Text fontColor="red600">Error: {error}</Text>}

        {statuses.length === 0 && !isLoading && !error && (
          <Text>No entries have been synced yet.</Text>
        )}

        {statuses.length > 0 && (
          <Accordion style={{ width: '100%', padding: '16px' }}>
            {statuses.map((status) => (
              <AccordionItem
                key={`${status.contentTypeId}-${status.entryId}`}
                title={
                  <Flex
                    alignItems="center"
                    justifyContent="space-between"
                    style={{ width: '100%' }}>
                    <Text fontWeight={status.needsSync ? 'fontWeightDemiBold' : 'fontWeightMedium'}>
                      {status.contentTypeName || status.contentTypeId}
                      {status.needsSync && (
                        <Badge variant="negative" style={{ marginLeft: '10px' }}>
                          Needs Sync
                        </Badge>
                      )}
                    </Text>
                    <Text fontColor="gray500" marginLeft="spacingM">
                      Last synced: {timeSinceSync(status.lastSynced)}
                    </Text>
                  </Flex>
                }>
                <Box padding="spacingM">
                  <Stack spacing="spacingM">
                    <Stack spacing="spacingXs">
                      <Text fontWeight="fontWeightDemiBold">Last Synced:</Text>
                      <Text>{formatDate(status.lastSynced)}</Text>
                    </Stack>

                    {status.fieldsUpdatedAt && Object.keys(status.fieldsUpdatedAt).length > 0 && (
                      <Box>
                        <Heading as="h4" marginBottom="spacingXs">
                          Changed Fields
                        </Heading>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Field</TableCell>
                              <TableCell>Last Updated</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.entries(status.fieldsUpdatedAt).map(([fieldId, timestamp]) => (
                              <TableRow key={fieldId}>
                                <TableCell>{fieldId}</TableCell>
                                <TableCell>
                                  <Stack spacing="spacingXs">
                                    <Text>{formatDate(timestamp)}</Text>
                                    <Text fontColor="gray500">
                                      {timestamp > status.lastSynced ? (
                                        <Badge variant="negative">Changed since last sync</Badge>
                                      ) : (
                                        'No changes'
                                      )}
                                    </Text>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    )}

                    <Flex gap="spacingXs">
                      <Button
                        size="small"
                        variant={status.needsSync ? 'primary' : 'secondary'}
                        onClick={() => toggleSyncStatus(status)}>
                        {status.needsSync ? 'Sync Now' : 'Mark for Sync'}
                      </Button>
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => openEntry(status.entryId, status.contentTypeId)}>
                        Open Entry
                      </Button>
                    </Flex>
                  </Stack>
                </Box>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </Stack>

      {/* Confirmation Dialog for clearing all mappings */}
      {isConfirmDialogOpen && (
        <ModalConfirm
          title="Clear All Sync Data"
          confirmLabel="Clear All"
          cancelLabel="Cancel"
          intent="negative"
          isShown={isConfirmDialogOpen}
          onConfirm={() => {
            clearAllSyncStatuses();
            setIsConfirmDialogOpen(false);
          }}
          onCancel={() => setIsConfirmDialogOpen(false)}>
          <Text>
            This will delete all Klaviyo sync status data. Entries that have been synced will no
            longer show their sync history.
            <br />
            <br />
            <strong>This action cannot be undone.</strong> Are you sure you want to continue?
          </Text>
        </ModalConfirm>
      )}
    </Box>
  );
};
