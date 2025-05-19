import { useCallback, useEffect, useState } from 'react';
import { ConfigAppSDK, locations, SidebarExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Button, Flex, Text, Note } from '@contentful/f36-components';
import { FieldData } from '../config/klaviyo';
import {
  getEntryKlaviyoFieldMappings,
  setEntryKlaviyoFieldMappings,
} from '../utils/field-mappings';
import { getFieldDetails } from '../utils/field-utilities';
import { logger } from '../utils/logger';
import { registerPublishListener } from '../utils/entry-change-listener';
import { useAutoResizer } from '@contentful/react-apps-toolkit';

// Types
type SDKType = SidebarExtensionSDK | ConfigAppSDK;

// Component to determine if we're in configuration or sidebar mode
export const Sidebar = () => {
  useAutoResizer();
  const sdk = useSDK<SDKType>();
  const [mappings, setMappings] = useState<FieldData[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Determine current component context (sidebar or config)
  const getCurrentComponent = () => {
    const isSidebar = sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR);

    return (
      <SidebarComponent
        sdk={sdk as SidebarExtensionSDK}
        mappings={mappings}
        setMappings={setMappings}
        showSuccess={showSuccess}
        setShowSuccess={setShowSuccess}
      />
    );
  };

  // Load saved mappings on component mount
  useEffect(() => {
    const loadMappings = async () => {
      try {
        logger.log('[Sidebar] Loading field mappings...');
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
      }
    };

    loadMappings();

    return () => {};
  }, [sdk]);

  return getCurrentComponent();
};

// Sidebar component
const SidebarComponent = ({
  sdk,
  mappings,
  setMappings,
  showSuccess,
  setShowSuccess,
}: {
  sdk: SidebarExtensionSDK;
  mappings: FieldData[];
  setMappings: React.Dispatch<React.SetStateAction<FieldData[]>>;
  showSuccess: boolean;
  setShowSuccess: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  // Handle field selection using Contentful's dialog
  const handleConfigureClick = useCallback(async () => {
    try {
      // Ensure we have entry and content type IDs
      const entryId = sdk.ids.entry;
      const contentTypeId = sdk.ids.contentType;

      if (!entryId || !contentTypeId) {
        logger.error('[Sidebar] Missing required IDs:', { entryId, contentTypeId });
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

      // Try to get accessToken to pass to the dialog
      let accessToken = '';

      // From app installation parameters
      if (sdk.parameters && sdk.parameters.installation) {
        const { klaviyoApiKey, klaviyoCompanyId } = sdk.parameters.installation;
        if (klaviyoApiKey) accessToken = klaviyoApiKey;
        if (klaviyoCompanyId) accessToken = klaviyoCompanyId;
      }

      logger.log('[Sidebar] AccessToken available for dialog:', {
        accessTokenAvailable: !!accessToken,
      });

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
          accessToken,
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
        setMappings(updatedMappings);
        await setEntryKlaviyoFieldMappings(sdk, entryId, updatedMappings);
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
        }
      } else {
        logger.warn('[Sidebar] Dialog returned unexpected result format:', result);
      }
    } catch (error) {
      logger.error('[Sidebar] Error in configure dialog:', error);
    }
  }, [sdk, mappings, setMappings, setShowSuccess]);

  // Set up automatic change detection and sync status updates
  useEffect(() => {
    // Set up publish event listener
    const removePublishListener = registerPublishListener(sdk);

    // Return combined cleanup function
    return () => {
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
