import { useCallback, useEffect, useState } from 'react';
import { ConfigAppSDK, locations, SidebarExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Button, Flex, Text } from '@contentful/f36-components';
import { CloseIcon } from '@contentful/f36-icons';
import { FieldData, SyncContent } from '../utils/klaviyo-api-service';
import { getSyncData, updateSyncData } from '../utils/persistence-service';
import { getFieldDetails } from '../utils/field-utilities';

// Types
type SDKType = SidebarExtensionSDK | ConfigAppSDK;
type SelectedField = { id: string; isAsset: boolean; source?: string };

// Component to determine if we're in configuration or sidebar mode
export const Sidebar = () => {
  const sdk = useSDK<SDKType>();
  const [mappings, setMappings] = useState<FieldData[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [loading, setLoading] = useState(true);

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
        const savedMappings = await getSyncData(sdk);
        if (savedMappings && Array.isArray(savedMappings)) {
          setMappings(savedMappings);
        }
      } catch (error) {
        console.error('Error loading mappings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMappings();
  }, [sdk]);

  return getCurrentComponent();
};

// Configuration component
const ConfigComponent = ({
  sdk,
  setMappings,
  loading,
  setLoading,
}: {
  sdk: ConfigAppSDK;
  setMappings: React.Dispatch<React.SetStateAction<FieldData[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const handleSave = useCallback(
    async (values: FieldData[]) => {
      setLoading(true);
      setMappings(values);
      await updateSyncData(sdk, values);
      setLoading(false);
      return true;
    },
    [sdk, setMappings, setLoading]
  );

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
}: {
  sdk: SidebarExtensionSDK;
  mappings: FieldData[];
  setMappings: React.Dispatch<React.SetStateAction<FieldData[]>>;
  showSuccess: boolean;
  setShowSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  buttonDisabled: boolean;
  setButtonDisabled: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  // Handle field selection and mapping generation
  const handleGenerateClick = useCallback(async () => {
    if (!sdk.dialogs) return;

    try {
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

      // Open dialog to select fields
      const selectedFields = (await sdk.dialogs.openCurrentApp({
        title: 'Select fields',
        width: 'medium',
        parameters: { fields: validFields },
        minHeight: 300,
      })) as SelectedField[];

      if (!selectedFields || !Array.isArray(selectedFields) || selectedFields.length === 0) {
        return;
      }

      // Transform selected fields into FieldData format
      const newMappings = await Promise.all(
        selectedFields.map(async (field) => {
          const details = await getFieldDetails(field.id, field.isAsset, sdk);
          return details;
        })
      );

      // Update state and persistence
      setMappings(newMappings);
      await updateSyncData(sdk, newMappings);
    } catch (error) {
      console.error('Error generating mappings:', error);
    }
  }, [sdk, setMappings]);

  // Handle removing a field mapping
  const handleRemoveMapping = useCallback(
    async (indexToRemove: number) => {
      const updatedMappings = mappings.filter((_, index) => index !== indexToRemove);
      setMappings(updatedMappings);
      await updateSyncData(sdk, updatedMappings);
    },
    [sdk, mappings, setMappings]
  );

  // Handle content synchronization
  const handleSyncClick = useCallback(async () => {
    setButtonDisabled(true);
    try {
      const syncContent = new SyncContent();
      // Convert FieldData[] to the expected mapping format
      const formattedMappings = mappings.map((mapping) => ({
        contentfulFieldId: mapping.id,
        klaviyoBlockName: mapping.name,
        fieldType: mapping.isAsset ? 'image' : 'text',
      }));
      await syncContent.syncContent(sdk, formattedMappings);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error syncing content:', error);
    } finally {
      setButtonDisabled(false);
    }
  }, [sdk, mappings, setButtonDisabled, setShowSuccess]);

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
    <Flex flexDirection="column" gap="spacingM" style={{ maxWidth: '300px' }}>
      <Button
        variant="primary"
        isFullWidth
        onClick={handleGenerateClick}
        isDisabled={buttonDisabled}>
        Configure Field Mappings
      </Button>

      {mappings.length > 0 ? (
        <Flex
          flexDirection="column"
          gap="spacingXs"
          padding="spacingS"
          style={{ background: '#F7F9FA', borderRadius: '4px' }}>
          <Text fontWeight="fontWeightMedium">
            {mappings.length} Field{mappings.length > 1 ? 's' : ''} Ready to Sync:
          </Text>
          {mappings.map((mapping, index) => (
            <Flex
              key={`${mapping.id}-${index}`}
              justifyContent="space-between"
              alignItems="center"
              padding="spacingXs"
              marginBottom="spacingXs"
              style={{ borderBottom: '1px solid #EEEEEE' }}>
              <Text fontSize="fontSizeS">{mapping.name}</Text>
              <Flex alignItems="center" gap="spacingXs">
                <Text fontSize="fontSizeS" fontColor="gray600">
                  {mapping.isAsset ? 'Image' : 'Text'}
                </Text>
                <Button
                  size="small"
                  variant="transparent"
                  onClick={() => handleRemoveMapping(index)}
                  aria-label={`Remove ${mapping.name}`}>
                  <CloseIcon />
                </Button>
              </Flex>
            </Flex>
          ))}
        </Flex>
      ) : (
        <Flex justifyContent="center" padding="spacingS">
          <Text fontColor="gray600" fontSize="fontSizeS">
            No fields configured yet. Click "Configure Field Mappings" to get started.
          </Text>
        </Flex>
      )}

      <Button
        variant="positive"
        isFullWidth
        onClick={handleSyncClick}
        isDisabled={buttonDisabled || mappings.length === 0}>
        Sync to Klaviyo
      </Button>

      {showSuccess && <Text fontColor="colorPositive">Successfully synced to Klaviyo!</Text>}
    </Flex>
  );
};
