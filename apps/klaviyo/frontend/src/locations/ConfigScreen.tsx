import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Form,
  FormControl,
  Heading,
  Stack,
  Text,
  TextInput,
  TextLink,
  Popover,
  Pill,
} from '@contentful/f36-components';
import { ExternalLinkIcon, ChevronDownIcon } from '@contentful/f36-icons';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

import { KlaviyoAppConfig } from '../config/klaviyo';
import { getContentTypes } from '../utils/contentful-helper';
import {
  getEntryKlaviyoFieldMappings,
  setEntryKlaviyoFieldMappings,
} from '../utils/field-mappings';
import ConnectionComponent from '../components/ConnectionComponent';
import { useParams } from 'react-router-dom';

// Helper to ensure klaviyoFieldMappings entry exists
const ensureKlaviyoFieldMappingsEntry = async (sdk: ConfigAppSDK) => {
  const cma = sdk.cma;
  const spaceId = sdk.ids.space;
  const environmentId = sdk.ids.environment;
  // Try to find the entry by content type
  const entries = await cma.entry.getMany({
    spaceId,
    environmentId,
    content_type: 'klaviyoFieldMappings',
    limit: 1,
  } as any);
  if (entries.items && entries.items.length > 0) {
    return entries.items[0];
  }
  // If not found, create it
  const defaultLocale = sdk.locales?.default || 'en-US';
  const entry = await cma.entry.create(
    { spaceId, environmentId, contentTypeId: 'klaviyoFieldMappings' } as any,
    {
      fields: {
        mappings: {
          [defaultLocale]: JSON.stringify([]),
        },
      },
    }
  );
  // Optionally publish the entry
  await cma.entry.publish({ entryId: entry.sys.id, spaceId, environmentId }, entry);
  return entry;
};

const ConfigScreen = () => {
  const params = useParams();
  console.log('Params:', params);
  const sdk = useSDK<ConfigAppSDK>();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [selectedContentTypes, setSelectedContentTypes] = useState<Record<string, boolean>>({});
  const [contentTypes, setContentTypes] = useState<any[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // Log the current URL of the hosted Contentful app
    console.log('Contentful App URL:', window.location);
    console.log('LocalStorage:', window.localStorage.getItem('Test'));
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      const parameters = await sdk.app.getParameters<KlaviyoAppConfig>();
      console.log('Parameters:', parameters);
      if (parameters) {
        setClientId(parameters.clientId || '');
        setClientSecret(parameters.clientSecret || '');
        setAccessToken(parameters.accessToken || '');
        setSelectedContentTypes(parameters.selectedContentTypes || {});
        if (parameters.fieldMappings || parameters.contentTypeMappings) {
          try {
            if (parameters.fieldMappings && Array.isArray(parameters.fieldMappings)) {
              setEntryKlaviyoFieldMappings(sdk, '', parameters.fieldMappings);
            }
          } catch (e) {
            console.error('Error saving mappings to persistence service:', e);
          }
        }
      }
      const isInstalled = await sdk.app.isInstalled();
      setIsReadOnly(isInstalled);
      loadContentTypes();
      sdk.app.setReady();
    };
    initializeApp();
  }, [sdk]);

  useEffect(() => {
    sdk.app.onConfigure(async () => {
      const currentParameters = await sdk.app.getParameters();
      if (!clientId || !clientSecret) {
        sdk.notifier.error('Please provide both Client ID and Client Secret');
        return false;
      }
      let localMappings: any[] = [];
      try {
        localMappings = await getEntryKlaviyoFieldMappings(sdk, '');
      } catch (e) {
        console.error('Error getting local mappings:', e);
      }
      const contentTypeMappings = { ...(currentParameters?.contentTypeMappings || {}) };
      if (localMappings.length > 0) {
        const mappingsByContentType: Record<string, any[]> = {};
        localMappings.forEach((mapping) => {
          if (mapping.contentTypeId) {
            if (!mappingsByContentType[mapping.contentTypeId]) {
              mappingsByContentType[mapping.contentTypeId] = [];
            }
            mappingsByContentType[mapping.contentTypeId].push(mapping);
          }
        });
        Object.keys(mappingsByContentType).forEach((contentTypeId) => {
          contentTypeMappings[contentTypeId] = mappingsByContentType[contentTypeId];
        });
      }
      let allMappings: any[] = [];
      Object.keys(contentTypeMappings).forEach((typeId) => {
        const typeMappings = contentTypeMappings[typeId];
        if (Array.isArray(typeMappings)) {
          allMappings = [...allMappings, ...typeMappings];
        }
      });
      const spaceId = sdk.ids.space;
      const selectedLocations = { 'entry-sidebar': true };
      const parameters = {
        clientId,
        clientSecret,
        accessToken,
        selectedLocations,
        selectedContentTypes,
        spaceId,
        fieldMappings: allMappings,
        contentTypeMappings,
      };
      const filteredSelectedContentTypes = Object.keys(selectedContentTypes)
        .filter((id) => selectedContentTypes[id])
        .reduce((acc, id) => {
          acc[id] = true;
          return acc;
        }, {} as Record<string, boolean>);
      const editorInterface = buildEditorInterfaceConfig(filteredSelectedContentTypes);
      await ensureKlaviyoFieldMappingsEntry(sdk);
      return {
        parameters,
        targetState: {
          EditorInterface: editorInterface,
        },
      };
    });
  }, [sdk, clientId, clientSecret, accessToken, selectedContentTypes]);

  // Load content types
  const loadContentTypes = async () => {
    try {
      const types = await getContentTypes(sdk.cma);
      setContentTypes(types);
    } catch (error) {
      console.error('Error loading content types:', error);
      sdk.notifier.error('Failed to load content types');
    }
  };

  // Build editor interface config based on selected locations and content types
  const buildEditorInterfaceConfig = (selectedContentTypes: Record<string, boolean>) => {
    const targetContentTypes = Object.keys(selectedContentTypes).filter(
      (contentTypeId) => selectedContentTypes[contentTypeId]
    );

    // Build target state for editor interface
    const editorInterface: Record<string, any> = {};

    // Always enable entry-sidebar
    targetContentTypes.forEach((contentTypeId) => {
      editorInterface[contentTypeId] = {
        sidebar: {
          position: 0,
        },
      };
    });

    return editorInterface;
  };

  // Helper to get content type name by ID
  const getContentTypeName = (id: string) => {
    const ct = contentTypes.find((ct) => ct.sys.id === id);
    return ct ? ct.name : id;
  };

  // Handle select all
  const allSelected =
    contentTypes.length > 0 &&
    Object.keys(selectedContentTypes).filter((id) => selectedContentTypes[id]).length ===
      contentTypes.length;
  const handleSelectAll = () => {
    if (allSelected) {
      const cleared: Record<string, boolean> = {};
      contentTypes.forEach((ct) => {
        cleared[ct.sys.id] = false;
      });
      setSelectedContentTypes(cleared);
    } else {
      const all: Record<string, boolean> = {};
      contentTypes.forEach((ct) => {
        all[ct.sys.id] = true;
      });
      setSelectedContentTypes(all);
    }
  };

  // Handle pill remove
  const handleRemoveContentType = (id: string) => {
    setSelectedContentTypes((prev) => ({ ...prev, [id]: false }));
  };

  return (
    <Box style={{ maxWidth: '800px', margin: '64px auto' }}>
      <Box padding="spacingXl" style={{ border: '1px solid #E5EBED', borderRadius: '4px' }}>
        {/* OAuth Connection Component Placeholder */}
        <Box style={{ marginBottom: '32px', width: '100%' }}>
          <ConnectionComponent
            clientId={clientId}
            clientSecret={clientSecret}
            redirectUri="https://app.contentful.com/spaces/u0ge3owcpcam/apps/35ZeiuUc1uciWR2AXbozas"
            accessToken={accessToken}
            onTokenChange={setAccessToken}
          />
        </Box>
        {/* End OAuth Connection Component Placeholder */}
        <Stack spacing="spacingXl" flexDirection="column" alignItems="flex-start">
          <Stack spacing="spacingM" flexDirection="column" alignItems="flex-start">
            <Heading>Configure access</Heading>
            <Text>Input your Klaviyo OAuth credentials to connect your account.</Text>
          </Stack>

          <Form style={{ width: '100%' }}>
            <Stack spacing="spacingXl" flexDirection="column" alignItems="flex-start">
              <FormControl isRequired style={{ width: '100%', margin: '0' }}>
                <FormControl.Label>Client ID</FormControl.Label>
                <TextInput
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter your OAuth client ID"
                  style={{ width: '100%' }}
                  isDisabled={isReadOnly}
                />
              </FormControl>

              <FormControl isRequired style={{ width: '100%', margin: '0' }}>
                <FormControl.Label>Client Secret</FormControl.Label>
                <TextInput
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter your OAuth client secret"
                  style={{ width: '100%' }}
                  isDisabled={isReadOnly}
                />
              </FormControl>
              {/* Optionally show access token if available */}
              {accessToken && (
                <FormControl style={{ width: '100%', margin: '0' }}>
                  <FormControl.Label>Access Token</FormControl.Label>
                  <TextInput value={accessToken} isReadOnly style={{ width: '100%' }} />
                </FormControl>
              )}
              {/* Content Types Dropdown Section */}
              <Stack
                spacing="spacingM"
                flexDirection="column"
                alignItems="flex-start"
                style={{ width: '100%' }}>
                <Text fontWeight="fontWeightMedium">Content Types</Text>
                <Text fontColor="gray500">
                  Select which content types to enable with the Klaviyo integration
                </Text>
                <Box style={{ width: '100%', position: 'relative' }}>
                  <Popover
                    isOpen={isDropdownOpen}
                    onClose={() => setIsDropdownOpen(false)}
                    placement="bottom-start">
                    <Popover.Trigger>
                      <Button
                        variant="secondary"
                        endIcon={<ChevronDownIcon />}
                        style={{ width: '100%', justifyContent: 'space-between' }}
                        onClick={() => setIsDropdownOpen((open) => !open)}
                        aria-haspopup="listbox"
                        aria-expanded={isDropdownOpen}>
                        {Object.keys(selectedContentTypes).filter((id) => selectedContentTypes[id])
                          .length > 0
                          ? `${
                              Object.keys(selectedContentTypes).filter(
                                (id) => selectedContentTypes[id]
                              ).length
                            } selected`
                          : 'Select content types'}
                      </Button>
                    </Popover.Trigger>
                    <Popover.Content>
                      <Box style={{ minWidth: 280, maxHeight: 320, overflowY: 'auto', padding: 8 }}>
                        <Checkbox
                          isChecked={allSelected}
                          onChange={handleSelectAll}
                          style={{ marginBottom: 8 }}>
                          Select all
                        </Checkbox>
                        <Stack flexDirection="column" alignItems="flex-start" spacing="none">
                          {contentTypes.map((ct) => (
                            <Checkbox
                              key={ct.sys.id}
                              isChecked={!!selectedContentTypes[ct.sys.id]}
                              onChange={() =>
                                setSelectedContentTypes((prev) => ({
                                  ...prev,
                                  [ct.sys.id]: !prev[ct.sys.id],
                                }))
                              }
                              style={{ marginBottom: 4 }}>
                              {ct.name}
                            </Checkbox>
                          ))}
                        </Stack>
                      </Box>
                    </Popover.Content>
                  </Popover>
                </Box>
                {/* Pills for selected content types */}
                <Flex flexWrap="wrap" gap="spacingXs" style={{ marginTop: 12 }}>
                  {Object.keys(selectedContentTypes)
                    .filter((id) => selectedContentTypes[id])
                    .map((id) => (
                      <Pill
                        key={id}
                        label={getContentTypeName(id)}
                        onClose={() => handleRemoveContentType(id)}
                        style={{ marginBottom: 6 }}
                      />
                    ))}
                </Flex>
              </Stack>
            </Stack>
          </Form>
        </Stack>
      </Box>
    </Box>
  );
};

export default ConfigScreen;
