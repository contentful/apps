import { useCallback, useEffect, useState } from 'react';
import { ConfigAppSDK, locations, SidebarExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Button, Flex, Text, Note } from '@contentful/f36-components';
import { FieldData } from '../services/klaviyo-sync-service';
import {
  getEntryKlaviyoFieldMappings,
  setEntryKlaviyoFieldMappings,
} from '../utils/field-mappings';
import { getFieldDetails } from '../utils/field-utilities';
import { logger } from '../utils/logger';
import {
  initializeEntryChangeMonitoring,
  registerPublishListener,
} from '../utils/entry-change-listener';
import { syncEntryToKlaviyo } from '../utils/sync-api';
import { useAutoResizer } from '@contentful/react-apps-toolkit';

// Types
type SDKType = SidebarExtensionSDK | ConfigAppSDK;

// Component to determine if we're in configuration or sidebar mode
export const Sidebar = () => {
  useAutoResizer();
  const sdk = useSDK<SDKType>();
  const [mappings, setMappings] = useState<FieldData[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        syncMessage={syncMessage}
        setSyncMessage={setSyncMessage}
        setError={setError}
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
        console.log('loading mappings', sdk);
        const entryId = (sdk.ids as any).entry;
        const savedMappings = await getEntryKlaviyoFieldMappings(sdk, entryId);
        if (savedMappings && Array.isArray(savedMappings) && savedMappings.length > 0) {
          logger.log('[Sidebar] Loaded mappings from entry:', savedMappings);
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

    // No localStorage event listeners needed
    return () => {};
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
  syncMessage,
  setSyncMessage,
  setError,
}: {
  sdk: SidebarExtensionSDK;
  mappings: FieldData[];
  setMappings: React.Dispatch<React.SetStateAction<FieldData[]>>;
  showSuccess: boolean;
  setShowSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  syncMessage: string | null;
  setSyncMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  // Helper to get spaceId from installation parameters or fallback to sdk.ids.space
  const getEffectiveSpaceId = (sdk: SidebarExtensionSDK): string | undefined => {
    return sdk.parameters?.installation?.spaceId || sdk.ids?.space;
  };

  // Handle field selection using Contentful's dialog
  const handleConfigureClick = useCallback(async () => {
    try {
      // Ensure we have entry and content type IDs
      const entryId = sdk.ids.entry;
      const contentTypeId = sdk.ids.contentType;
      const spaceId = getEffectiveSpaceId(sdk);

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
      // Debug: Log mappings, preSelectedFields, and validFields
      logger.log('[Sidebar] Current mappings:', mappings);
      logger.log('[Sidebar] preSelectedFields:', preSelectedFields);
      logger.log('[Sidebar] validFields:', validFields);

      // Try to get API keys to pass to the dialog
      let privateKey = '';
      let publicKey = '';

      // From app installation parameters
      if (sdk.parameters && sdk.parameters.installation) {
        const {
          klaviyoApiKey,
          klaviyoCompanyId,
          privateKey: pk,
          publicKey: pubk,
        } = sdk.parameters.installation;
        if (klaviyoApiKey) privateKey = klaviyoApiKey;
        if (klaviyoCompanyId) publicKey = klaviyoCompanyId;
        if (pk) privateKey = pk;
        if (pubk) publicKey = pubk;
      }

      // If not found in SDK, try localStorage
      if (!privateKey) {
        const localStorage_privateKey =
          localStorage.getItem('klaviyo_api_key') ||
          localStorage.getItem('klaviyoApiKey') ||
          localStorage.getItem('privateKey');
        if (localStorage_privateKey) privateKey = localStorage_privateKey;
      }

      if (!publicKey) {
        const localStorage_publicKey =
          localStorage.getItem('klaviyo_company_id') ||
          localStorage.getItem('klaviyoCompanyId') ||
          localStorage.getItem('publicKey');
        if (localStorage_publicKey) publicKey = localStorage_publicKey;
      }

      logger.log('[Sidebar] Private/Public keys available for dialog:', {
        privateKeyAvailable: !!privateKey,
        publicKeyAvailable: !!publicKey,
      });

      console.log('mappings and sdk', mappings, sdk, sdk.entry.getSys());

      // Fetch the entry with all locales
      const localizedEntry = await sdk.cma.entry.get({
        entryId: sdk.ids.entry,
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
      });

      // Now open the dialog, passing the fully-localized entry
      const result = await sdk.dialogs.openCurrentApp({
        parameters: {
          entry: JSON.parse(JSON.stringify(localizedEntry)),
          fields: validFields,
          preSelectedFields,
          showSyncButton: true,
          contentTypeId,
          entryId,
          privateKey,
          publicKey,
        },
        width: 800,
      });

      if (!result) {
        logger.log('[Sidebar] Dialog closed without result');
        return;
      }

      logger.log('[Sidebar] Dialog result:', result);

      // Check if the dialog was closed with mappings
      if (result.mappings && Array.isArray(result.mappings)) {
        logger.log('[Sidebar] Using mappings from dialog result');

        // Merge new mappings for this content type with existing mappings for other content types
        const entryId = sdk.ids.entry;
        let allMappings = await getEntryKlaviyoFieldMappings(sdk, entryId);
        const contentTypeId = sdk.ids.contentType;
        allMappings = allMappings.filter((m: any) => m.contentTypeId !== contentTypeId);
        const updatedMappings = [...allMappings, ...result.mappings];
        console.log('Sidebar: merged updatedMappings before save:', updatedMappings);
        setMappings(updatedMappings);
        await setEntryKlaviyoFieldMappings(sdk, entryId, updatedMappings);

        // --- NEW: Immediately trigger sync to Klaviyo ---
        try {
          const entryData: Record<string, any> = {};
          for (const field of updatedMappings) {
            const fieldId = field.id;
            if (sdk.entry.fields[fieldId]) {
              if (field.type === 'Asset') {
                const assetRef = sdk.entry.fields[fieldId].getValue();
                if (assetRef && assetRef.sys && assetRef.sys.id) {
                  try {
                    const asset = await sdk.space.getAsset(assetRef.sys.id);
                    const locale = asset.sys.locale || Object.keys(asset.fields.file)[0] || 'en-US';
                    const file = asset.fields.file[locale];
                    entryData[fieldId] =
                      file && file.url
                        ? file.url.startsWith('http')
                          ? file.url
                          : `https:${file.url}`
                        : null;
                  } catch (e) {
                    entryData[fieldId] = null;
                  }
                } else {
                  entryData[fieldId] = null;
                }
              } else {
                entryData[fieldId] = sdk.entry.fields[fieldId].getValue();
              }
            }
          }
          const syncResult = await syncEntryToKlaviyo(
            entryId,
            contentTypeId,
            entryData,
            spaceId,
            updatedMappings.map((mapping: any) => ({
              contentfulFieldId: mapping.id,
              klaviyoBlockName: mapping.name,
              fieldType:
                mapping.type === 'Asset'
                  ? 'image'
                  : mapping.type === 'RichText'
                  ? 'richText'
                  : 'text',
            }))
          );
          if (syncResult.success) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          } else {
            setSyncMessage(
              'Error syncing to Klaviyo: ' + (syncResult.errors?.join('; ') || 'Unknown error')
            );
          }
        } catch (syncError: any) {
          setSyncMessage(
            'Error syncing to Klaviyo: ' +
              (syncError instanceof Error ? syncError.message : 'Unknown error')
          );
        }
        // --- END NEW ---
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

        logger.log('[Sidebar] Created new mappings from selectedFields:', newMappings);

        if (newMappings && newMappings.length > 0) {
          // Update state and persistence
          setMappings(newMappings);

          // Save to Contentful entry field
          const entryId = sdk.ids.entry;
          await setEntryKlaviyoFieldMappings(sdk, entryId, newMappings);

          // Show success message
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        } else {
          logger.error('[Sidebar] Failed to create mappings from selectedFields');
          setError('Failed to create mappings from selected fields');
        }
      } else {
        logger.warn('[Sidebar] Dialog returned unexpected result format:', result);
        setError('Unexpected response from configuration dialog');
      }
    } catch (error) {
      logger.error('[Sidebar] Error in configure dialog:', error);
      setError(
        `Error configuring mappings: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }, [sdk, mappings, setMappings, setShowSuccess, setError]);

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

  return (
    <Flex flexDirection="column" gap="spacingM" style={{ maxWidth: '300px', height: '100%' }}>
      <Button variant="secondary" onClick={handleConfigureClick} isFullWidth>
        Sync fields to Klaviyo
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
      localized: field.localized,
    }));
};
