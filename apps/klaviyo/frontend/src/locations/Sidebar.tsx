import { useCallback, useEffect, useState } from 'react';
import { ConfigAppSDK, locations, SidebarExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '../hooks/useSDK';
import { Button, Flex, Text, Note } from '@contentful/f36-components';
import {
  FieldData,
  markEntryForSync,
  setupEntryChangeListener,
  SyncContent,
} from '../services/klaviyo-sync-service';
import { getSyncData, updateSyncData } from '../services/persistence-service';
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
  setSyncMessage,
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
    try {
      // Ensure we have entry and content type IDs
      const entryId = sdk.ids.entry;
      const contentTypeId = sdk.ids.contentType;

      if (!entryId || !contentTypeId) {
        logger.error('[Sidebar] Missing required IDs:', { entryId, contentTypeId });
        setError('Missing entry or content type ID. Please refresh the page and try again.');
        return;
      }

      logger.log('[Sidebar] Opening configure dialog with IDs:', { entryId, contentTypeId });

      // Get all valid fields for this content type
      const validFields = await getContentTypeFields(sdk, contentTypeId);
      const preSelectedFields = mappings
        .filter((m) => m.contentTypeId === sdk.ids.contentType)
        .map((m) => m.id);

      // Set up dialog options
      const dialogOptions = {
        width: 800,
        minHeight: 600,
        position: 'center' as 'center',
        title: 'Configure Klaviyo Field Mappings',
        shouldCloseOnEscapePress: true,
        shouldCloseOnOverlayClick: true,
        parameters: {
          entryId, // Explicitly include entry ID
          contentTypeId, // Explicitly include content type ID
          currentEntry: JSON.stringify(sdk.entry),
          fields: validFields,
          preSelectedFields,
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

        // Update via our improved persistence service
        await updateSyncData(result.mappings);
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

        // Update via our improved persistence service
        await updateSyncData(newMappings);
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
    try {
      setError(null);
      setButtonDisabled(true);
      setIsSyncing(true);
      setSyncMessage('Syncing content to Klaviyo...');

      // Get current field mappings
      const fieldMappings = await getSyncData(sdk);

      if (!fieldMappings || fieldMappings.length === 0) {
        setError('No field mappings found. Please configure field mappings first.');
        setSyncMessage(null);
        setIsSyncing(false);
        setButtonDisabled(false);
        return;
      }

      logger.log('[Sidebar] Starting sync with field mappings:', fieldMappings);

      // Comprehensive SDK inspection to debug ID issues
      logger.log('[Sidebar] Detailed SDK inspection:', {
        sdkType: typeof sdk,
        hasIds: !!sdk.ids,
        idsType: sdk.ids ? typeof sdk.ids : 'undefined',
        idsProperties: sdk.ids ? Object.keys(sdk.ids) : [],
        idsEntry: sdk.ids?.entry,
        idsContentType: sdk.ids?.contentType,
        hasEntry: !!sdk.entry,
        entryType: sdk.entry ? typeof sdk.entry : 'undefined',
        hasGetSys: sdk.entry?.getSys ? typeof sdk.entry.getSys : 'undefined',
        location: sdk.location ? Object.keys(sdk.location) : [],
        locationIsSidebar: sdk.location?.is(locations.LOCATION_ENTRY_SIDEBAR),
      });

      // We need to ensure we have the entry ID and content type ID
      // Try multiple sources to ensure we get valid IDs
      let entryId = undefined;
      let contentTypeId = undefined;

      // 1. Try to get from sdk.ids - this is usually the most reliable for sidebar extensions
      if (sdk.ids) {
        entryId = sdk.ids.entry;
        contentTypeId = sdk.ids.contentType;
        logger.log('[Sidebar] IDs from sdk.ids:', { entryId, contentTypeId });
      }

      // 2. If still missing, try to get from entry sys object
      if (!entryId || !contentTypeId) {
        let entrySys: any = null;

        try {
          // First try with getSys method
          if (typeof sdk.entry.getSys === 'function') {
            entrySys = sdk.entry.getSys();
            logger.log('[Sidebar] Entry sys from getSys():', entrySys);
          }
          // Alternative approach with direct sys property access
          else if (sdk.entry && 'sys' in sdk.entry) {
            entrySys = (sdk.entry as any).sys;
            logger.log('[Sidebar] Entry sys from direct access:', entrySys);
          }

          // Process the sys data if we got it from either method
          if (entrySys) {
            if (!entryId && entrySys.id) {
              entryId = entrySys.id;
              logger.log('[Sidebar] Got entryId from entry sys:', entryId);
            }

            if (!contentTypeId && entrySys?.contentType?.sys?.id) {
              contentTypeId = entrySys.contentType.sys.id;
              logger.log('[Sidebar] Got contentTypeId from entry sys:', contentTypeId);
            }
          }
        } catch (e) {
          logger.error('[Sidebar] Error getting IDs from entry sys:', e);
        }
      }

      // 3. Last try: check if we can get it from content type
      if (!contentTypeId && sdk.contentType?.sys?.id) {
        contentTypeId = sdk.contentType.sys.id;
        logger.log('[Sidebar] Got contentTypeId from sdk.contentType:', contentTypeId);
      }

      // Final confirmation of IDs before proceeding
      logger.log('[Sidebar] Final IDs for sync:', {
        entryId,
        contentTypeId,
        idsAvailable: !!sdk.ids,
        entryIdFromIds: sdk.ids?.entry,
        contentTypeIdFromIds: sdk.ids?.contentType,
      });

      // Verify that we have the required IDs before proceeding
      if (!entryId || !contentTypeId) {
        setError('Missing entry ID or content type ID. Please try again.');
        logger.error('[Sidebar] Missing IDs:', {
          entryId,
          contentTypeId,
          sdkIds: sdk.ids,
        });
        setSyncMessage(null);
        setIsSyncing(false);
        setButtonDisabled(false);
        return;
      }

      // Convert field mappings to the format expected by syncContent
      const formattedMappings = fieldMappings.map((mapping) => ({
        contentfulFieldId: mapping.id,
        klaviyoBlockName: mapping.name,
        fieldType: mapping.type,
      }));

      // Initialize sync service with the SDK
      const syncService = new SyncContent(null, sdk);

      try {
        // Explicitly create options object with the IDs
        const syncOptions = {
          useSdk: true,
          forceUpdate: true,
          entryId, // Explicitly include entry ID
          contentTypeId, // Explicitly include content type ID
        };

        logger.log('[Sidebar] Calling syncContent with options:', syncOptions);

        // Perform sync with explicit options
        const result = await syncService.syncContent(sdk, formattedMappings, syncOptions);

        if (result && result.success === false) {
          setError(`Sync failed: ${result.error || 'Unknown error'}`);
          setSyncSuccessful(false);
        } else {
          // Mark sync as successful
          setShowSuccess(true);
          setSyncSuccessful(true);
          setSyncMessage('Content synced successfully!');

          setTimeout(() => {
            setShowSuccess(false);
            setSyncMessage(null);
          }, 3000);
        }
      } catch (syncError) {
        logger.error('[Sidebar] Error during content sync:', syncError);

        // Show better error messages based on the error type
        let errorMessage = 'Error syncing content to Klaviyo.';

        if (typeof syncError === 'string') {
          errorMessage = syncError;
        } else if (syncError instanceof Error) {
          if (syncError.message.includes('Forbidden')) {
            errorMessage = 'Authentication failed. Check your API keys and permissions.';
          } else {
            errorMessage = syncError.message;
          }
        }

        setError(errorMessage);
        setSyncSuccessful(false);
      }
    } catch (error) {
      // This catches any other errors (like network issues)
      logger.error('[Sidebar] Unexpected error during sync:', error);

      let errorMessage = 'Unexpected error during sync.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setSyncSuccessful(false);
    } finally {
      setIsSyncing(false);
      setButtonDisabled(false);
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

// Get all fields from a content type
const getContentTypeFields = async (sdk: any, contentTypeId: string) => {
  // Get the content type definition
  const contentType = await sdk.space.getContentType(contentTypeId);

  // Filter valid fields (exclude certain types that wouldn't make sense to sync)
  return contentType.fields
    .filter(
      (field: any) =>
        field.type !== 'Boolean' &&
        !(field.type === 'Array' && field.name.toLowerCase().includes('reference')) &&
        !field.name.toLowerCase().includes('reference')
    )
    .map((field: any) => ({
      id: field.id,
      name: field.name,
      type: field.type,
    }));
};
