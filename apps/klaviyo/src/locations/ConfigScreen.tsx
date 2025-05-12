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
  const sdk = useSDK<ConfigAppSDK>();
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [selectedContentTypes, setSelectedContentTypes] = useState<Record<string, boolean>>({});
  const [contentTypes, setContentTypes] = useState<any[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Effect 1: Only run initializeApp on mount
  useEffect(() => {
    const initializeApp = async () => {
      const parameters = await sdk.app.getParameters<KlaviyoAppConfig>();
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
        publicKey,
        privateKey,
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
      // Ensure klaviyoFieldMappings entry exists before saving config
      await ensureKlaviyoFieldMappingsEntry(sdk);
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
      if (!result) {
        return false;
      } else {
        return true;
      }
    } catch (error) {
      console.error('Error validating credentials:', error);
      return false;
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
