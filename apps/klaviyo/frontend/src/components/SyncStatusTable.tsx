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
  Tooltip,
  ModalConfirm,
  Spinner,
} from '@contentful/f36-components';
import {
  SyncStatus,
  SyncContent,
  getAllSyncStatuses,
  markEntryForSync,
} from '../services/klaviyo-sync-service';
import logger from '../utils/logger';
import { getSyncData } from '../services/persistence-service';

// Define a new interface for ContentfulEntry with version info
interface ContentfulEntry {
  sys: {
    id: string;
    version: number;
    contentType: {
      sys: {
        id: string;
      };
    };
    space: {
      sys: {
        id: string;
      };
    };
    environment: {
      sys: {
        id: string;
      };
    };
    updatedAt: string;
  };
  fields: Record<string, any>;
}

interface SyncStatusTableProps {
  onRefresh?: () => void;
  sdk: any;
}

export const SyncStatusTable: React.FC<SyncStatusTableProps> = ({ onRefresh, sdk }) => {
  const [statuses, setStatuses] = useState<SyncStatus[]>([]);
  const [entries, setEntries] = useState<ContentfulEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isRefreshingEntries, setIsRefreshingEntries] = useState(false);
  const [fieldMappings, setFieldMappings] = useState<Array<{ id: string; contentTypeId?: string }>>(
    []
  );

  // Load sync statuses
  const loadSyncStatuses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      logger.log('Loading sync statuses using SDK...');

      // Load field mappings
      const mappings = await getSyncData(sdk);
      setFieldMappings(mappings || []);

      // Extract content type IDs that have mappings
      const mappedContentTypeIds = new Set(
        mappings?.filter((m) => m.contentTypeId).map((m) => m.contentTypeId) || []
      );

      logger.log('Content types with mappings:', Array.from(mappedContentTypeIds));

      // Always force refresh to get the latest data
      const syncStatuses = await getAllSyncStatuses(true, sdk);

      // Filter statuses to only include those with content types that have mappings
      let filteredStatuses = syncStatuses;
      if (mappedContentTypeIds.size > 0) {
        filteredStatuses = syncStatuses.filter((status) =>
          mappedContentTypeIds.has(status.contentTypeId)
        );

        logger.log(
          `Filtered sync statuses from ${syncStatuses.length} to ${filteredStatuses.length} based on mappings`
        );
      }

      // Log detailed information about the statuses, especially version info
      logger.log('Loaded filtered sync statuses:', JSON.stringify(filteredStatuses, null, 2));

      // Log version information specifically
      filteredStatuses.forEach((status) => {
        logger.log(
          `Status for entry ${status.entryId}: lastSyncedVersion=${status.lastSyncedVersion}, needsSync=${status.needsSync}`
        );
      });

      // Check localStorage directly as a backup/verification
      const localStorageKey = 'klaviyo_sync_status';
      const localData = localStorage.getItem(localStorageKey);
      let localStatuses: SyncStatus[] = [];

      if (localData) {
        try {
          localStatuses = JSON.parse(localData);
          logger.log('Found data in localStorage:', localStatuses.length, 'statuses');

          // Also filter local statuses
          if (mappedContentTypeIds.size > 0) {
            localStatuses = localStatuses.filter((status) =>
              mappedContentTypeIds.has(status.contentTypeId)
            );
          }
        } catch (e) {
          logger.error('Error parsing localStorage data:', e);
        }
      } else {
        logger.log('No data found in localStorage');
      }

      // If we have syncStatuses from SDK but also have localStorage data,
      // merge them to ensure we have the most up-to-date information
      let mergedStatuses = [...filteredStatuses];

      if (localStatuses.length > 0) {
        // Create a map for faster lookup
        const statusMap = new Map<string, SyncStatus>();
        filteredStatuses.forEach((status) => {
          statusMap.set(`${status.entryId}_${status.contentTypeId}`, status);
        });

        // Add any missing statuses from localStorage or update with more recent data
        localStatuses.forEach((localStatus) => {
          const key = `${localStatus.entryId}_${localStatus.contentTypeId}`;
          const existingStatus = statusMap.get(key);

          if (!existingStatus) {
            // Status exists only in localStorage, add it
            mergedStatuses.push(localStatus);
          } else if (localStatus.lastSynced > existingStatus.lastSynced) {
            // LocalStorage has more recent data, use it
            const index = mergedStatuses.findIndex(
              (s) =>
                s.entryId === localStatus.entryId && s.contentTypeId === localStatus.contentTypeId
            );

            if (index >= 0) {
              mergedStatuses[index] = localStatus;
            }
          }
        });
      }

      // Update the state with merged statuses
      setStatuses(mergedStatuses);

      // Save the merged statuses back to ensure consistency
      localStorage.setItem(localStorageKey, JSON.stringify(mergedStatuses));

      // Try to update SDK parameters too
      if (sdk?.app?.getParameters) {
        try {
          const parameters = await sdk.app.getParameters();
          await sdk.app.setParameters({
            ...parameters,
            syncData: {
              syncStatuses: mergedStatuses,
              lastUpdated: Date.now(),
            },
          });
        } catch (err) {
          logger.error('Error updating app parameters:', err);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sync statuses');
      logger.error('Error loading sync statuses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // New function to fetch all entries from Contentful
  const fetchContentfulEntries = async () => {
    try {
      setIsRefreshingEntries(true);
      logger.log('Fetching Contentful entries...');

      // Get the content type IDs with mappings
      const mappings = (await getSyncData(sdk)) || [];
      const mappedContentTypeIds = new Set(
        mappings.filter((m) => m.contentTypeId).map((m) => m.contentTypeId)
      );

      if (mappedContentTypeIds.size === 0) {
        logger.log('No content types with mappings found');
        sdk.notifier.warning('No content types with field mappings configured');
        setIsRefreshingEntries(false);
        return;
      }

      // Determine space and environment IDs from SDK
      const spaceId = sdk.ids?.space || localStorage.getItem('contentful_space_id');
      const environmentId = sdk.ids?.environment || 'master';

      if (!spaceId) {
        throw new Error('Space ID not available. Cannot fetch entries.');
      }

      // Use CMA to fetch entries, but only for content types with mappings
      const contentTypeQueries = Array.from(mappedContentTypeIds).map((id) => `content_type=${id}`);
      const query = {
        limit: 100,
        // Can't directly filter by multiple content types in one query, so we don't filter here
        // We'll filter the results instead
      };

      const entriesResponse = await sdk.cma.entry.getMany({
        spaceId,
        environmentId,
        query,
      });

      // Filter entries to only include those with mapped content types
      const fetchedEntries = (entriesResponse.items as ContentfulEntry[]).filter((entry) =>
        mappedContentTypeIds.has(entry.sys.contentType.sys.id)
      );

      logger.log(
        `Fetched ${fetchedEntries.length} entries from Contentful with mapped content types`
      );

      setEntries(fetchedEntries);

      // Now compare entries with sync statuses and mark those needing sync
      checkEntriesNeedSync(fetchedEntries, statuses);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Contentful entries');
      logger.error('Error fetching Contentful entries:', err);
      sdk.notifier.error('Failed to fetch entries: ' + err.message);
    } finally {
      setIsRefreshingEntries(false);
    }
  };

  // Function to check if entries need syncing based on their version
  const checkEntriesNeedSync = async (
    contentfulEntries: ContentfulEntry[],
    syncStatuses: SyncStatus[]
  ) => {
    try {
      logger.log('Checking entries that need sync based on version...');

      const updatedStatuses = [...syncStatuses];
      let statusesChanged = false;

      // Create a map of existing statuses for faster lookup
      const statusMap = new Map<string, SyncStatus>();
      syncStatuses.forEach((status) => {
        statusMap.set(`${status.entryId}_${status.contentTypeId}`, status);
      });

      // Process each entry from Contentful
      for (const entry of contentfulEntries) {
        const entryId = entry.sys.id;
        const contentTypeId = entry.sys.contentType.sys.id;
        const currentVersion = entry.sys.version;

        logger.log(
          `Processing entry ${entryId}, content type ${contentTypeId}, version ${currentVersion}`
        );

        // Get matching sync status if exists
        const key = `${entryId}_${contentTypeId}`;
        const existingStatus = statusMap.get(key);

        if (existingStatus) {
          // Log version information to help debug
          logger.log(
            `Existing status found: lastSyncedVersion=${existingStatus.lastSyncedVersion}, currentVersion=${currentVersion}`
          );

          // If entry exists in our tracking, check if version is different
          if (
            !existingStatus.lastSyncedVersion ||
            existingStatus.lastSyncedVersion < currentVersion
          ) {
            // Entry has been updated since last sync
            logger.log(
              `Entry ${entryId} has updated version: ${currentVersion} vs ${
                existingStatus.lastSyncedVersion || 'unknown'
              }`
            );

            // Update the status
            existingStatus.needsSync = true;

            // Also update the version in our tracking so we know what we're comparing against
            if (!existingStatus.lastSyncedVersion) {
              existingStatus.lastSyncedVersion = 0; // Set to 0 if it was undefined before
            }

            statusMap.set(key, existingStatus);
            statusesChanged = true;
          }
        } else {
          // New entry that we haven't tracked before
          logger.log(
            `New entry detected: ${entryId} (${contentTypeId}) with version ${currentVersion}`
          );

          // Add new status for this entry
          const newStatus: SyncStatus = {
            entryId,
            contentTypeId,
            contentTypeName: contentTypeId, // We could fetch the actual name if needed
            lastSynced: 0,
            needsSync: true,
            syncCompleted: false,
            lastSyncedVersion: currentVersion, // Store current version
          };

          updatedStatuses.push(newStatus);
          statusMap.set(key, newStatus);
          statusesChanged = true;
        }
      }

      // If we made changes, update the statuses
      if (statusesChanged) {
        logger.log('Updated sync statuses based on version checks');

        // Update local state
        setStatuses(updatedStatuses);

        // Persist updates to localStorage
        const localStorageKey = 'klaviyo_sync_status';
        localStorage.setItem(localStorageKey, JSON.stringify(updatedStatuses));

        // Also try to update app parameters if SDK is available
        if (sdk?.app?.getParameters) {
          try {
            const parameters = await sdk.app.getParameters();
            await sdk.app.setParameters({
              ...parameters,
              syncData: {
                syncStatuses: updatedStatuses,
                lastUpdated: Date.now(),
              },
            });
          } catch (err) {
            logger.error('Error updating app parameters:', err);
          }
        }

        // Notify the user
        sdk.notifier.success(
          `Detected ${updatedStatuses.filter((s) => s.needsSync).length} entries that need syncing`
        );
      } else {
        sdk.notifier.success('All entries are up to date with Klaviyo');
      }
    } catch (err: any) {
      logger.error('Error checking entries that need sync:', err);
      sdk.notifier.error('Error checking sync status: ' + err.message);
    }
  };

  // Load on mount and listen for sync events
  useEffect(() => {
    loadSyncStatuses();

    // Set up event listener for sync completion
    const handleSyncCompleted = (event: Event) => {
      logger.log('Received sync completed event, refreshing status table...');

      // Check if this is a force refresh event
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.forceRefresh) {
        logger.log('Force refresh requested, clearing cache before reload');
        localStorage.removeItem('klaviyo_sync_status_cache');
      }

      // Always reload sync statuses
      loadSyncStatuses();
    };

    // Listen for sync completed events
    window.addEventListener('klaviyo-sync-completed', handleSyncCompleted);

    // Listen for field mapping updates
    const handleFieldMappingUpdate = (event: MessageEvent) => {
      if (event.data && event.data.type === 'updateFieldMappings') {
        logger.log('Received field mapping update, refreshing status table...');
        loadSyncStatuses();
      }
    };

    window.addEventListener('message', handleFieldMappingUpdate);

    // Listen for storage events (for cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'klaviyo_field_mappings') {
        logger.log('Field mappings changed in storage, refreshing status table...');
        loadSyncStatuses();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Clean up event listeners
    return () => {
      window.removeEventListener('klaviyo-sync-completed', handleSyncCompleted);
      window.removeEventListener('message', handleFieldMappingUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Refresh handler
  const handleRefresh = () => {
    loadSyncStatuses();
    if (onRefresh) {
      onRefresh();
    }
  };

  // New refresh handler to fetch entries and check versions
  const handleCheckEntryVersions = () => {
    fetchContentfulEntries();
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
                console.log('onConfigure erase', updatedParams);
                sdk.app.onConfigure();

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

  // Deduplicate sync statuses
  const deduplicateSyncStatuses = async () => {
    try {
      // Find duplicates (entries with same entryId and contentTypeId)
      const uniqueEntries = new Map<string, SyncStatus>();

      // For each status, keep the most recently synced one
      statuses.forEach((status) => {
        const key = `${status.entryId}_${status.contentTypeId}`;
        const existing = uniqueEntries.get(key);

        // If we don't have this entry yet, or this one is more recent, keep it
        if (!existing || status.lastSynced > existing.lastSynced) {
          uniqueEntries.set(key, status);
        }
      });

      // Convert back to array
      const dedupedStatuses = Array.from(uniqueEntries.values());

      // Update local state
      setStatuses(dedupedStatuses);

      // Update localStorage
      localStorage.setItem('klaviyo_sync_status', JSON.stringify(dedupedStatuses));
      localStorage.removeItem('klaviyo_sync_status_cache');

      // Update SDK parameters if available
      if (sdk?.app?.getParameters) {
        try {
          const parameters = await sdk.app.getParameters();
          await sdk.app.setParameters({
            ...parameters,
            syncData: {
              syncStatuses: dedupedStatuses,
              lastUpdated: Date.now(),
            },
          });
        } catch (err) {
          logger.error('Error updating app parameters:', err);
        }
      }

      // Notify user
      sdk.notifier.success(`Removed ${statuses.length - dedupedStatuses.length} duplicate entries`);

      logger.log('Deduplicated sync statuses', {
        before: statuses.length,
        after: dedupedStatuses.length,
      });
    } catch (err) {
      logger.error('Error deduplicating sync statuses:', err);
      sdk.notifier.error('Failed to deduplicate sync statuses');
    }
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

        // Filter field mappings to only include mappings for this content type
        fieldMappings = fieldMappings.filter(
          (mapping: any) => mapping.contentTypeId === status.contentTypeId
        );

        logger.log(
          `Filtered ${fieldMappings.length} mappings for content type ${status.contentTypeId}`
        );

        // If we still don't have mappings, try to build simple ones
        if (fieldMappings.length === 0) {
          logger.log('No field mappings found, generating default mappings');
          // Create default text field mappings for any fields
          fieldMappings = Object.keys(entry.fields || {}).map((fieldId) => ({
            contentfulFieldId: fieldId,
            fieldType: 'text',
            klaviyoBlockName: fieldId,
            contentTypeId: status.contentTypeId,
          }));
        }

        // Check if we have any mappings
        if (fieldMappings.length === 0) {
          logger.error('No field mappings found or generated');
          sdk.notifier.error('No field mappings found for this entry type');
          return;
        }

        logger.log('Using field mappings:', fieldMappings);

        // Sync the content
        try {
          // When manually syncing, always force an update
          const result = await syncContent.syncContent(sdk, fieldMappings, { forceUpdate: true });
          logger.log('Sync complete:', result);

          // Get the current version from the entry
          const currentVersion = entry.sys.version;
          logger.log(`Entry version for ${status.entryId}: ${currentVersion}`);

          // Update status in our local state
          const updatedStatus = { ...status };
          updatedStatus.needsSync = false;
          updatedStatus.lastSynced = Date.now();
          updatedStatus.syncCompleted = true;

          // Also store version information - ensure it's a number
          updatedStatus.lastSyncedVersion = Number(currentVersion) || 0;
          logger.log(`Setting lastSyncedVersion to ${updatedStatus.lastSyncedVersion}`);

          // Update the statuses array
          const updatedStatuses = statuses.map((s) =>
            s.entryId === status.entryId && s.contentTypeId === status.contentTypeId
              ? updatedStatus
              : s
          );
          setStatuses(updatedStatuses);

          // Also update in localStorage to ensure consistency
          const localStorageKey = 'klaviyo_sync_status';
          localStorage.setItem(localStorageKey, JSON.stringify(updatedStatuses));

          // Clear any cache
          localStorage.removeItem('klaviyo_sync_status_cache');

          // Try to update SDK parameters too
          if (sdk?.app?.getParameters) {
            try {
              const parameters = await sdk.app.getParameters();
              await sdk.app.setParameters({
                ...parameters,
                syncData: {
                  syncStatuses: updatedStatuses,
                  lastUpdated: Date.now(),
                },
              });
            } catch (err) {
              logger.error('Error updating app parameters:', err);
            }
          }

          // Dispatch event manually to ensure other components update
          window.dispatchEvent(
            new CustomEvent('klaviyo-sync-completed', {
              detail: {
                entryId: status.entryId,
                contentTypeId: status.contentTypeId,
                forceRefresh: true,
              },
            })
          );

          // Show success notification
          sdk.notifier.success('Entry synced to Klaviyo successfully');

          // Refresh the entry list
          handleRefresh();
        } catch (err: any) {
          logger.error('Error syncing content:', err);
          sdk.notifier.error(`Sync failed: ${err.message}`);
        }
      } else {
        // Mark as needing sync
        await markEntryForSync(status.entryId, status.contentTypeId, status.contentTypeName, sdk);

        // Update in our local state
        const updatedStatus = { ...status, needsSync: true };
        const updatedStatuses = statuses.map((s) =>
          s.entryId === status.entryId && s.contentTypeId === status.contentTypeId
            ? updatedStatus
            : s
        );
        setStatuses(updatedStatuses);

        sdk.notifier.success('Entry marked for sync');
      }
    } catch (err: any) {
      logger.error('Error toggling sync status:', err);
      sdk.notifier.error(`Error: ${err.message}`);
    }
  };

  return (
    <div>
      <Stack flexDirection="column" spacing="spacingM">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading>Sync Status</Heading>
          <Stack flexDirection="row" spacing="spacingXs">
            <Button variant="secondary" onClick={handleRefresh} isDisabled={isLoading}>
              Refresh
            </Button>
            <Button variant="positive" onClick={handleCheckEntryVersions} isDisabled={isLoading}>
              Check Sync Status
            </Button>
            <Button variant="secondary" onClick={deduplicateSyncStatuses} isDisabled={isLoading}>
              Remove Duplicates
            </Button>
            <Button
              variant="negative"
              onClick={() => setIsConfirmDialogOpen(true)}
              isDisabled={isLoading}>
              Clear All
            </Button>
          </Stack>
        </Flex>

        {error && <Text fontColor="red500">{error}</Text>}

        {isLoading && (
          <Box textAlign="center" padding="spacingM">
            <Spinner />
            <Text>Loading sync statuses...</Text>
          </Box>
        )}

        {!isLoading && statuses.length === 0 ? (
          <Box padding="spacingM" backgroundColor="blue50" style={{ borderRadius: '4px' }}>
            <Text>No entries have been synced yet.</Text>
            <Text>
              Configure field mappings and publish or update entries to see sync statuses here.
            </Text>
          </Box>
        ) : (
          <Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Entry ID</TableCell>
                  <TableCell>Content Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Synced</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statuses.map((status) => (
                  <TableRow key={`${status.entryId}_${status.contentTypeId}`}>
                    <TableCell>
                      <Tooltip content="Click to open entry in Contentful">
                        <Text
                          fontWeight="fontWeightMedium"
                          style={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => openEntry(status.entryId, status.contentTypeId)}>
                          {status.entryId.substring(0, 8)}...
                        </Text>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{status.contentTypeName || status.contentTypeId}</TableCell>
                    <TableCell>
                      {status.needsSync ? (
                        <Badge variant="warning">Needs Sync</Badge>
                      ) : status.syncCompleted ? (
                        <Badge variant="positive">Synced</Badge>
                      ) : (
                        <Badge variant="secondary">Not Synced</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {status.lastSynced ? timeSinceSync(status.lastSynced) : 'Never'}
                    </TableCell>
                    <TableCell>
                      {status.lastSyncedVersion !== undefined && status.lastSyncedVersion !== null
                        ? status.lastSyncedVersion
                        : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={status.needsSync ? 'positive' : 'secondary'}
                        size="small"
                        onClick={() => toggleSyncStatus(status)}>
                        {status.needsSync ? 'Sync Now' : 'Mark for Sync'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Stack>

      <ModalConfirm
        title="Clear all sync status data?"
        isShown={isConfirmDialogOpen}
        onConfirm={() => {
          clearAllSyncStatuses();
          setIsConfirmDialogOpen(false);
        }}
        onCancel={() => setIsConfirmDialogOpen(false)}
        confirmLabel="Clear All"
        intent="negative">
        <Text>
          This will remove all saved sync status information. This action cannot be undone.
        </Text>
      </ModalConfirm>
    </div>
  );
};
