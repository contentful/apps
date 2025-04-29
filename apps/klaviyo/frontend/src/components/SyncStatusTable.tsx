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
} from '@contentful/f36-components';
import {
  SyncStatus,
  getAllSyncStatuses,
  markEntryForSync,
  SyncContent,
} from '../utils/klaviyo-api-service';
import logger from '../utils/logger';

interface SyncStatusTableProps {
  onRefresh?: () => void;
  sdk: any;
}

export const SyncStatusTable: React.FC<SyncStatusTableProps> = ({ onRefresh, sdk }) => {
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);

  // Move loadSyncStatuses outside useEffect so it can be called from other functions
  const loadSyncStatuses = () => {
    // Force a fresh load of sync statuses
    const statuses = getAllSyncStatuses(true); // Add a force refresh parameter
    logger.log('Loaded sync statuses:', statuses);
    setSyncStatuses(statuses);

    // Call the parent onRefresh if provided
    if (onRefresh) onRefresh();
  };

  useEffect(() => {
    // Initial load
    loadSyncStatuses();

    // Also check for updates every 30 seconds
    const interval = setInterval(loadSyncStatuses, 30000);

    // Listen for storage events to update in real-time across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'klaviyo_sync_status') {
        loadSyncStatuses();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Add event listener for sync completion
    const handleSyncCompletion = (event: CustomEvent) => {
      logger.log('Sync status changed, refreshing table');
      loadSyncStatuses();
    };

    window.addEventListener('klaviyo-sync-completed', handleSyncCompletion as EventListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('klaviyo-sync-completed', handleSyncCompletion as EventListener);
    };
  }, []); // Include onRefresh in dependencies since we're using it in loadSyncStatuses

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
        // Get the entry from Contentful
        const entry = await sdk.space.getEntry(status.entryId);

        // Create a new SyncContent instance
        const syncContent = new SyncContent(entry);

        // Get the field mappings for this content type
        const mappings = await sdk.parameters.installation;
        const fieldMappings = mappings.fieldMappings || [];

        // Perform the actual sync
        await syncContent.syncContent(sdk, fieldMappings);

        // Refresh the status table
        loadSyncStatuses();
      } else {
        // If it's already synced, mark it for sync
        markEntryForSync(status.entryId, status.contentTypeId, status.contentTypeName);
        loadSyncStatuses();
      }
    } catch (error: any) {
      logger.error('Error syncing content:', error);
      sdk.notifier.error(`Failed to sync content: ${error.message}`);
    }
  };

  return (
    <Box>
      <Stack spacing="spacingM">
        <Box>
          <Heading>Sync Status</Heading>
          <Text>Entries that need to be synced with Klaviyo</Text>
        </Box>

        <Button
          variant="secondary"
          onClick={loadSyncStatuses} // Simplified this since we have the function accessible
        >
          Refresh Status
        </Button>

        {syncStatuses.length === 0 ? (
          <Text>No entries have been synced yet.</Text>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Content Type</TableCell>
                <TableCell>Last Synced</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {syncStatuses.map((status) => (
                <TableRow key={`${status.contentTypeId}-${status.entryId}`}>
                  <TableCell>{status.contentTypeName || status.contentTypeId}</TableCell>
                  <TableCell>
                    <Stack spacing="spacingXs">
                      <Text>{formatDate(status.lastSynced)}</Text>
                      <Text fontColor="gray500">{timeSinceSync(status.lastSynced)}</Text>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant={status.needsSync ? 'negative' : 'positive'}
                      onClick={() => toggleSyncStatus(status)}>
                      {status.needsSync ? 'Needs Sync' : 'Up to Date'}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Flex gap="spacingXs">
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => openEntry(status.entryId, status.contentTypeId)}>
                        Open Entry
                      </Button>
                    </Flex>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Stack>
    </Box>
  );
};
