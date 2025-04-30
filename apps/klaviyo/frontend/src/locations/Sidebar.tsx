import { useCallback, useEffect, useState } from 'react';
import { ConfigAppSDK, locations, SidebarExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '../hooks/useSDK';
import { Button, Flex, Text, Note } from '@contentful/f36-components';
import {
  FieldData,
  markEntryForSync,
  setupEntryChangeListener,
  SyncContent,
} from '../utils/klaviyo-api-service';
import { getSyncData, updateSyncData } from '../utils/persistence-service';
import { getFieldDetails } from '../utils/field-utilities';
import { logger } from '../utils/logger';
import {
  initializeEntryChangeMonitoring,
  registerPublishListener,
} from '../utils/entry-change-listener';
import { getFieldMappings } from '../utils/field-mappings';

// Types
type SDKType = SidebarExtensionSDK | ConfigAppSDK;

// Component to determine if we're in configuration or sidebar mode
export const Sidebar = () => {
  const sdk = useSDK<SDKType>();
  const [mappings, setMappings] = useState<FieldData[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncSuccessful, setSyncSuccessful] = useState(false);

  // Determine current component context (sidebar or config)
  const getCurrentComponent = () => {
    const isSidebar = sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR);

    return isSidebar ? (
      <SidebarComponent
        sdk={sdk as SidebarExtensionSDK}
        mappings={mappings}
        setMappings={setMappings}
        showSuccess={showSuccess}
        setShowSuccess={setShowSuccess}
        buttonDisabled={buttonDisabled}
        setButtonDisabled={setButtonDisabled}
        syncMessage={syncMessage}
        setSyncMessage={setSyncMessage}
        isSyncing={isSyncing}
        setIsSyncing={setIsSyncing}
        error={error}
        setError={setError}
        syncSuccessful={syncSuccessful}
        setSyncSuccessful={setSyncSuccessful}
      />
    ) : (
      <ConfigComponent
        sdk={sdk as ConfigAppSDK}
        setMappings={setMappings}
        loading={loading}
        setLoading={setLoading}
      />
    );
  };

  // Load saved mappings on component mount
  useEffect(() => {
    const loadMappings = async () => {
      try {
        logger.log('[Sidebar] Loading field mappings...');
        const savedMappings = await getSyncData(sdk);
        if (savedMappings && Array.isArray(savedMappings) && savedMappings.length > 0) {
          logger.log('[Sidebar] Loaded mappings:', savedMappings);
          setMappings(savedMappings);
        } else {
          logger.log('[Sidebar] No existing mappings found');
        }
      } catch (error) {
        logger.error('[Sidebar] Error loading mappings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMappings();

    // Also listen for storage events to update in real-time across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'klaviyo_field_mappings') {
        logger.log('[Sidebar] Storage changed, reloading mappings');
        loadMappings();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [sdk]);

  return getCurrentComponent();
};

// Configuration component
const ConfigComponent = ({
  sdk,
}: {
  sdk: ConfigAppSDK;
  setMappings: React.Dispatch<React.SetStateAction<FieldData[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  useEffect(() => {
    sdk.app.onConfigure(() => ({
      parameters: {},
      targetState: {
        EditorInterface: {},
      },
    }));
  }, [sdk]);

  return (
    <Flex flexDirection="column" margin="spacingM">
      <Text>
        This app allows you to sync Contentful entries to Klaviyo as a Universal Content Block.
      </Text>
    </Flex>
  );
};

// Sidebar component
const SidebarComponent = ({
  sdk,
  mappings,
  setMappings,
  showSuccess,
  setShowSuccess,
  buttonDisabled,
  setButtonDisabled,
  syncMessage,
  isSyncing,
  setIsSyncing,
  error,
  setError,
  syncSuccessful,
  setSyncSuccessful,
}: {
  sdk: SidebarExtensionSDK;
  mappings: FieldData[];
  setMappings: React.Dispatch<React.SetStateAction<FieldData[]>>;
  showSuccess: boolean;
  setShowSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  buttonDisabled: boolean;
  setButtonDisabled: React.Dispatch<React.SetStateAction<boolean>>;
  syncMessage: string | null;
  setSyncMessage: React.Dispatch<React.SetStateAction<string | null>>;
  isSyncing: boolean;
  setIsSyncing: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  syncSuccessful: boolean;
  setSyncSuccessful: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  // Handle field selection using Contentful's dialog
  const handleConfigureClick = useCallback(async () => {
    if (!sdk.dialogs) return;

    try {
      logger.log('[Sidebar] Opening field select dialog...');

      // Get all fields from the content type
      const contentType = await sdk.space.getContentType(sdk.ids.contentType);

      // Filter valid fields (non-boolean, non-reference)
      const validFields = contentType.fields
        .filter(
          (field) =>
            field.type !== 'Boolean' &&
            !(field.type === 'Array' && field.name.toLowerCase().includes('reference')) &&
            !field.name.toLowerCase().includes('reference')
        )
        .map((field) => ({
          id: field.id,
          name: field.name,
          type: field.type,
        }));

      // Pre-select already mapped fields
      const preSelectedFields = mappings.map((mapping) => mapping.id);

      // Prepare field selection data
      const dialogOptions = {
        title: 'Configure & Sync to Klaviyo',
        width: 'medium' as 'medium',
        minHeight: 400,
        parameters: {
          currentEntry: JSON.stringify(sdk.entry),
          fields: validFields,
          preSelectedFields,
          contentTypeId: sdk.ids.contentType,
          contentTypeName: sdk.contentType.name,
          showSyncButton: true,
        },
      };

      // Open dialog to select fields
      const result = await sdk.dialogs.openCurrentApp(dialogOptions);

      if (!result) {
        logger.log('[Sidebar] Dialog closed without result');
        return; // User cancelled
      }

      logger.log('[Sidebar] Dialog result:', result);

      // Check if the dialog was closed with mappings
      if (result.mappings && Array.isArray(result.mappings)) {
        logger.log('[Sidebar] Using mappings from dialog result');

        // Update our state with the mappings from the dialog
        setMappings(result.mappings);

        // Also update the mappings in localStorage directly
        localStorage.setItem('klaviyo_field_mappings', JSON.stringify(result.mappings));

        // And notify any other components
        window.postMessage(
          {
            type: 'updateFieldMappings',
            fieldMappings: result.mappings,
          },
          '*'
        );
      }
      // Check if we got field selections or sync result
      else if (result.action === 'sync') {
        // The dialog performed the sync directly
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else if (result.selectedFields && Array.isArray(result.selectedFields)) {
        // Transform selected fields into FieldData format
        const newMappings = await Promise.all(
          result.selectedFields.map(async (fieldId: string) => {
            const details = await getFieldDetails(fieldId, false, sdk);
            return {
              ...details,
              contentTypeId: sdk.ids.contentType,
            };
          })
        );

        // Update state and persistence
        setMappings(newMappings);

        // Save to localStorage directly for immediate sharing
        localStorage.setItem('klaviyo_field_mappings', JSON.stringify(newMappings));

        // Also update via the persistence service
        await updateSyncData(newMappings);

        // Notify other components about the update
        window.postMessage(
          {
            type: 'updateFieldMappings',
            fieldMappings: newMappings,
          },
          '*'
        );
      }
    } catch (error) {
      logger.error('[Sidebar] Error in configure dialog:', error);
    }
  }, [sdk, mappings, setMappings, setShowSuccess]);

  // Set up automatic change detection and sync status updates
  useEffect(() => {
    // Use our new utility function to set up entry monitoring
    const removeFieldChangeListeners = initializeEntryChangeMonitoring(sdk, mappings);

    // Set up publish event listener
    const removePublishListener = registerPublishListener(sdk);

    // Return combined cleanup function
    return () => {
      removeFieldChangeListeners();
      removePublishListener();
    };
  }, [sdk, mappings]);

  // Listen for sys changes (like publish/unpublish)
  useEffect(() => {
    const handleChanged = () => {
      setShowSuccess(false);
    };

    // Listen for field changes
    const removeHandler = sdk.entry.onSysChanged(handleChanged);

    return () => {
      removeHandler();
    };
  }, [sdk, setShowSuccess]);

  // Function to handle the sync button click
  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);

    try {
      // Get field mappings for this content type
      const contentTypeId = sdk.ids.contentType;
      const contentTypeName = sdk.contentType?.name || '';
      const fieldMappings = await getFieldMappings(sdk);

      if (!fieldMappings || fieldMappings.length === 0) {
        throw new Error('No field mappings configured for this content type');
      }

      // Get entry
      const entryId = sdk.entry.getSys().id;

      logger.log(`Syncing entry ${entryId} (${contentTypeId}: ${contentTypeName})...`);

      // Ensure we have the full entry with all fields
      const entry = entryId ? await sdk.space.getEntry(entryId) : sdk.entry;

      // Create sync content instance with SDK reference
      const syncContent = new SyncContent(entry, sdk);

      // Pass SDK and useSdk option
      const result = await syncContent.syncContent(sdk, fieldMappings, { useSdk: true });

      // Explicitly update the localStorage status to ensure it's updated
      const now = Date.now();
      const storageKey = 'klaviyo_sync_status';
      const existingStatusesStr = localStorage.getItem(storageKey);
      const existingStatuses = existingStatusesStr ? JSON.parse(existingStatusesStr) : [];

      // Find or create status entry
      const statusIndex = existingStatuses.findIndex(
        (status: any) => status.entryId === entryId && status.contentTypeId === contentTypeId
      );

      if (statusIndex >= 0) {
        // Update existing
        existingStatuses[statusIndex] = {
          ...existingStatuses[statusIndex],
          lastSynced: now,
          needsSync: false,
          syncCompleted: true,
          contentTypeName: contentTypeName,
        };
      } else {
        // Create new
        existingStatuses.push({
          entryId,
          contentTypeId,
          contentTypeName,
          lastSynced: now,
          needsSync: false,
          syncCompleted: true,
        });
      }

      // Save back to localStorage
      localStorage.setItem(storageKey, JSON.stringify(existingStatuses));

      // Dispatch event
      window.dispatchEvent(
        new CustomEvent('klaviyo-sync-completed', {
          detail: { entryId, contentTypeId, contentTypeName, lastSynced: now },
        })
      );

      logger.log(`Sync completed for entry ${entryId} at ${new Date(now).toISOString()}`);

      // Show success message
      setSyncSuccessful(true);

      // Reset after a delay
      setTimeout(() => {
        setSyncSuccessful(false);
      }, 3000);

      return result;
    } catch (err: any) {
      logger.error('Sync error:', err);
      setError(err.message || 'Unknown error');
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  // Function to set up change listeners for tracked fields
  const setupChangeListeners = async () => {
    try {
      if (!sdk || !sdk.entry) return;

      // Get field mappings for this content type
      const fieldMappings = await getFieldMappings(sdk);

      if (!fieldMappings || fieldMappings.length === 0) {
        console.warn('No field mappings to track');
        return;
      }

      // Get list of tracked fields
      const fieldIds = fieldMappings
        .map((mapping) => mapping.contentfulFieldId || mapping.fieldId)
        .filter(Boolean) as string[];

      if (fieldIds.length === 0) {
        console.warn('No field IDs found in mappings');
        return;
      }

      logger.log(`Setting up change listeners for fields: ${fieldIds.join(', ')}`);

      // Set up entry change listener with SDK option
      const cleanupFunction = setupEntryChangeListener(sdk, fieldIds, { useSdk: true });

      // Clean up on unmount
      return cleanupFunction;
    } catch (error) {
      logger.error('Error setting up change listeners:', error);
    }
  };

  return (
    <Flex flexDirection="column" gap="spacingM" style={{ maxWidth: '300px', height: '100%' }}>
      <Button variant="positive" onClick={handleConfigureClick} isFullWidth>
        Configure & Sync to Klaviyo
      </Button>

      {showSuccess && <Text fontColor="colorPositive">Successfully synced to Klaviyo!</Text>}

      {syncMessage && (
        <Note
          style={{ marginTop: '10px', padding: '10px', borderRadius: '4px' }}
          variant={syncMessage.includes('Error') ? 'negative' : 'positive'}>
          {syncMessage}
        </Note>
      )}
    </Flex>
  );
};
