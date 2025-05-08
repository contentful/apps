import { useEffect, useState, useRef } from 'react';
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
import { CheckCircleIcon, ExternalLinkIcon, ChevronDownIcon } from '@contentful/f36-icons';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

import { ContentTypesList } from '../components/ContentTypesList';
import { KlaviyoAppConfig } from '../config/klaviyo';
import { getContentTypes } from '../utils/contentful-helper';
import { API_PROXY_URL } from '../config/klaviyo';
import {
  getEntryKlaviyoFieldMappings,
  setEntryKlaviyoFieldMappings,
} from '../utils/field-mappings';

// Styles for the container
const containerStyle = {
  padding: '24px',
  border: '1px solid #e5ebed',
  borderRadius: '6px',
  width: '100%',
};

// Define app locations
const AVAILABLE_LOCATIONS = [
  {
    id: 'entry-sidebar',
    name: 'Entry Sidebar',
    description: 'Add Klaviyo integration to the entry sidebar',
  },
];

// Helper function to log parameter information
const logParameters = (params: any, source: string) => {
  console.log(`[ConfigScreen][${source}] Parameters:`, params);

  // Log field mappings information
  if (params?.fieldMappings) {
    console.log(`[ConfigScreen][${source}] Field Mappings Count:`, params.fieldMappings.length);

    // Create a summary grouping by content type for easier debugging
    const mappingsByType: Record<string, number> = {};
    params.fieldMappings.forEach((mapping: any) => {
      const contentTypeId = mapping.contentTypeId || 'unknown';
      mappingsByType[contentTypeId] = (mappingsByType[contentTypeId] || 0) + 1;
    });

    console.log(`[ConfigScreen][${source}] Field Mappings by Content Type:`, mappingsByType);
  } else {
    console.log(`[ConfigScreen][${source}] Field Mappings: None found`);
  }

  // Log content type mappings information
  if (params?.contentTypeMappings) {
    const contentTypeKeys = Object.keys(params.contentTypeMappings);
    console.log(`[ConfigScreen][${source}] Content Type Mappings:`, contentTypeKeys);
    contentTypeKeys.forEach((typeId) => {
      const mappings = params.contentTypeMappings[typeId];
      console.log(
        `[ConfigScreen][${source}] Content Type ${typeId} has ${mappings?.length || 0} mappings`
      );
    });
  } else {
    console.log(`[ConfigScreen][${source}] Content Type Mappings: None found`);
  }

  // Save diagnostic information for troubleshooting
  try {
    localStorage.setItem(
      'klaviyo_debug_' + Date.now(),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        source,
        parameters: params,
      })
    );
  } catch (e) {
    console.error(`[ConfigScreen][${source}] Failed to save diagnostic info:`, e);
  }
};

const storeApiKeysInLocalStorage = (publicKey: string, privateKey: string) => {
  try {
    // Store main record with both keys
    localStorage.setItem(
      'klaviyo_api_keys',
      JSON.stringify({
        publicKey: publicKey,
        privateKey: privateKey,
      })
    );

    // Store individual keys under multiple names for better compatibility
    // Private key (API key)
    localStorage.setItem('klaviyo_api_key', privateKey);
    localStorage.setItem('klaviyoApiKey', privateKey);
    localStorage.setItem('privateKey', privateKey);

    // Public key (Company ID)
    localStorage.setItem('klaviyo_company_id', publicKey);
    localStorage.setItem('klaviyoCompanyId', publicKey);
    localStorage.setItem('publicKey', publicKey);

    // Also store as a config object
    localStorage.setItem(
      'klaviyo_config',
      JSON.stringify({
        publicKey: publicKey,
        privateKey: privateKey,
      })
    );

    console.log('Stored API keys in localStorage under multiple keys for better compatibility');
  } catch (e) {
    console.error('Failed to store API keys in localStorage:', e);
  }
};

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedContentTypes, setSelectedContentTypes] = useState<Record<string, boolean>>({});
  const [contentTypes, setContentTypes] = useState<any[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Effect 1: Only run initializeApp on mount
  useEffect(() => {
    const initializeApp = async () => {
      const parameters = await sdk.app.getParameters<KlaviyoAppConfig>();
      logParameters(parameters, 'initializeApp');
      if (parameters) {
        setPublicKey(parameters.publicKey || '');
        setPrivateKey(parameters.privateKey || '');
        setSelectedContentTypes(parameters.selectedContentTypes || {});
        if (parameters.publicKey && parameters.privateKey) {
          validateCredentials(parameters.publicKey, parameters.privateKey);
        }
        if (parameters.fieldMappings || parameters.contentTypeMappings) {
          try {
            if (parameters.fieldMappings && Array.isArray(parameters.fieldMappings)) {
              setEntryKlaviyoFieldMappings(sdk, '', parameters.fieldMappings);
              console.log('Saved field mappings to persistence service from parameters');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdk]);

  // Effect 2: Register onConfigure with latest state
  useEffect(() => {
    sdk.app.onConfigure(async () => {
      const currentParameters = await sdk.app.getParameters();
      logParameters(currentParameters, 'onConfigure-start');
      console.log('onConfigure', publicKey, privateKey);
      if (!publicKey || !privateKey) {
        sdk.notifier.error('Please provide both Public Key and Private Key');
        return false;
      }
      const isInstalled = await sdk.app.isInstalled();
      if (isInstalled) {
        const valid = await validateCredentials(publicKey, privateKey);
        if (!valid) {
          sdk.notifier.error('Could not validate Klaviyo credentials. Please check your API keys.');
          return false;
        }
      }
      storeApiKeysInLocalStorage(publicKey, privateKey);
      let localMappings: any[] = [];
      try {
        localMappings = await getEntryKlaviyoFieldMappings(sdk, '');
        if (localMappings.length > 0) {
          console.log('Found local mappings:', localMappings.length);
        }
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
        console.log(
          'Updated contentTypeMappings from localStorage:',
          Object.keys(contentTypeMappings)
        );
      }
      let allMappings: any[] = [];
      Object.keys(contentTypeMappings).forEach((typeId) => {
        const typeMappings = contentTypeMappings[typeId];
        if (Array.isArray(typeMappings)) {
          allMappings = [...allMappings, ...typeMappings];
        }
      });
      console.log(`Combined ${allMappings.length} total field mappings from all content types`);
      const spaceId = sdk.ids.space;
      const selectedLocations = { 'entry-sidebar': true };
      const parameters = {
        publicKey,
        privateKey,
        selectedLocations,
        selectedContentTypes,
        spaceId,
        fieldMappings: allMappings,
        contentTypeMappings,
      };
      logParameters(parameters, 'onConfigure-final');
      const filteredSelectedContentTypes = Object.keys(selectedContentTypes)
        .filter((id) => selectedContentTypes[id])
        .reduce((acc, id) => {
          acc[id] = true;
          return acc;
        }, {} as Record<string, boolean>);
      const editorInterface = buildEditorInterfaceConfig(filteredSelectedContentTypes);
      console.log('selectedContentTypes at save:', selectedContentTypes);
      console.log('filteredSelectedContentTypes at save:', filteredSelectedContentTypes);
      console.log('targetState.EditorInterface at save:', editorInterface);
      return {
        parameters,
        targetState: {
          EditorInterface: editorInterface,
        },
      };
    });
  }, [sdk, publicKey, privateKey, selectedContentTypes]);

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

    console.log('buildEditorInterfaceConfig', editorInterface);
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

  // Validate Klaviyo API credentials using App Action
  const validateCredentials = async (pubKey: string, privKey: string): Promise<boolean> => {
    setIsValidating(true);
    setErrorMessage('');
    try {
      const client = sdk.cma;
      const result = await client.appActionCall.create(
        {
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
          appDefinitionId: sdk.ids.app,
          appActionId: '4QzhEVBw043erLfXQ2V0IL',
        },
        {
          parameters: {
            publicKey: pubKey,
            privateKey: privKey,
          },
        }
      );
      console.log('validateCredentials', result);
      if (!result) {
        setErrorMessage('Error validating credentials. Please check your API keys');
        setIsConnected(false);
        return false;
      } else {
        setIsConnected(true);
        storeApiKeysInLocalStorage(pubKey, privKey);
        return true;
      }
    } catch (error) {
      console.error('Error validating credentials:', error);
      setErrorMessage('Network error. Please try again.');
      setIsConnected(false);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Box style={{ maxWidth: '800px', margin: '64px auto' }}>
      <Box padding="spacingXl" style={{ border: '1px solid #E5EBED', borderRadius: '4px' }}>
        <Stack spacing="spacingXl" flexDirection="column" alignItems="flex-start">
          <Stack spacing="spacingM" flexDirection="column" alignItems="flex-start">
            <Heading>Configure access</Heading>
            <Text>Input your Klaviyo API keys to connect your account.</Text>
          </Stack>

          <Form style={{ width: '100%' }}>
            <Stack spacing="spacingXl" flexDirection="column" alignItems="flex-start">
              <FormControl isRequired style={{ width: '100%', margin: '0' }}>
                <FormControl.Label>Public Key</FormControl.Label>
                <TextInput
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  placeholder="Enter your public key"
                  style={{ width: '100%' }}
                  isDisabled={isReadOnly}
                />
              </FormControl>

              <FormControl isRequired style={{ width: '100%', margin: '0' }}>
                <FormControl.Label>Private Key</FormControl.Label>
                <TextInput
                  type="password"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="Enter your private key"
                  style={{ width: '100%' }}
                  isDisabled={isReadOnly}
                />
                <TextLink
                  style={{ marginTop: '8px' }}
                  href="https://developers.klaviyo.com/en/docs/api-keys-authentication"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={<ExternalLinkIcon />}>
                  Learn how to create API keys in Klaviyo
                </TextLink>
              </FormControl>

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
