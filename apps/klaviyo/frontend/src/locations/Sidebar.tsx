import { useCallback, useEffect, useState } from 'react';
import { ConfigAppSDK, locations, SidebarExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '../hooks/useSDK';
import { Button, Flex, Text, Note } from '@contentful/f36-components';
import { FieldData, markEntryForSync } from '../utils/klaviyo-api-service';
import { getSyncData, updateSyncData } from '../utils/persistence-service';
import { getFieldDetails } from '../utils/field-utilities';
import { logger } from '../utils/logger';

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
  syncMessage,
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

  // Field change listeners - keep this code
  useEffect(() => {
    const fieldChangeHandlers: (() => void)[] = [];

    // For each mapped field, add a change listener
    for (const mapping of mappings) {
      try {
        const field = sdk.entry.fields[mapping.id];
        if (field) {
          // Use onValueChanged to detect when the field value changes
          const removeHandler = field.onValueChanged(() => {
            logger.log(`Field ${mapping.name} value changed, marking for sync`);

            const entryId = sdk.entry.getSys().id;
            const contentTypeId = sdk.ids.contentType;
            const contentTypeName = sdk.contentType.name;

            // Mark this entry as needing sync
            markEntryForSync(entryId, contentTypeId, contentTypeName);
          });

          fieldChangeHandlers.push(removeHandler);
        }
      } catch (error) {
        logger.error(`Error setting up change listener for field ${mapping.id}:`, error);
      }
    }

    // Clean up handlers on unmount
    return () => {
      fieldChangeHandlers.forEach((handler) => handler());
    };
  }, [mappings, sdk]);

  useEffect(() => {
    const handleChanged = () => {
      setShowSuccess(false);
    };

    // Listen for field changes
    const removeHandler = sdk.entry.onSysChanged(handleChanged);

    return () => {
      removeHandler();
    };
  }, [sdk]);

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
