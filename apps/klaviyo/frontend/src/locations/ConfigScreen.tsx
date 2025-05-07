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
} from '@contentful/f36-components';
import { CheckCircleIcon, ExternalLinkIcon } from '@contentful/f36-icons';
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
  const [selectedLocations, setSelectedLocations] = useState<Record<string, boolean>>({});
  const [selectedContentTypes, setSelectedContentTypes] = useState<Record<string, boolean>>({});
  const [contentTypes, setContentTypes] = useState<any[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Initialize the app
  useEffect(() => {
    // Start the app in loading state
    sdk.app.onConfigure(async () => {
      // Get the current parameters first for logging
      const currentParameters = await sdk.app.getParameters();
      logParameters(currentParameters, 'onConfigure-start');

      console.log('onConfigure', publicKey, privateKey);
      if (!publicKey || !privateKey) {
        sdk.notifier.error('Please provide both Public Key and Private Key');
        return false;
      }

      if (!isConnected) {
        sdk.notifier.error('Please connect to Klaviyo before installing the app');
        return false;
      }

      // Store API keys in localStorage for backup access
      storeApiKeysInLocalStorage(publicKey, privateKey);

      // Get field mappings from both localStorage and current parameters
      let localMappings: any[] = [];
      try {
        localMappings = await getEntryKlaviyoFieldMappings(sdk, '');
        if (localMappings.length > 0) {
          console.log('Found local mappings:', localMappings.length);
        }
      } catch (e) {
        console.error('Error getting local mappings:', e);
      }

      // Prepare the content type mappings structure
      const contentTypeMappings = { ...(currentParameters?.contentTypeMappings || {}) };

      // If we have local mappings, prioritize those and organize them by content type
      if (localMappings.length > 0) {
        // Group mappings by content type
        const mappingsByContentType: Record<string, any[]> = {};

        localMappings.forEach((mapping) => {
          if (mapping.contentTypeId) {
            if (!mappingsByContentType[mapping.contentTypeId]) {
              mappingsByContentType[mapping.contentTypeId] = [];
            }
            mappingsByContentType[mapping.contentTypeId].push(mapping);
          }
        });

        // Update contentTypeMappings with local mappings
        Object.keys(mappingsByContentType).forEach((contentTypeId) => {
          contentTypeMappings[contentTypeId] = mappingsByContentType[contentTypeId];
        });

        console.log(
          'Updated contentTypeMappings from localStorage:',
          Object.keys(contentTypeMappings)
        );
      }

      // Flatten all content type mappings into a single fieldMappings array
      let allMappings: any[] = [];
      Object.keys(contentTypeMappings).forEach((typeId) => {
        const typeMappings = contentTypeMappings[typeId];
        if (Array.isArray(typeMappings)) {
          allMappings = [...allMappings, ...typeMappings];
        }
      });

      console.log(`Combined ${allMappings.length} total field mappings from all content types`);

      // Create the final parameters object
      const spaceId = sdk.ids.space;
      const parameters = {
        publicKey,
        privateKey,
        selectedLocations,
        selectedContentTypes,
        spaceId,
        // Use our combined mappings
        fieldMappings: allMappings,
        // Use our updated content type mappings
        contentTypeMappings,
      };

      // Log the final parameters
      logParameters(parameters, 'onConfigure-final');

      // Return the configuration
      return {
        parameters,
        targetState: {
          EditorInterface: buildEditorInterfaceConfig(),
        },
      };
    });

    // Load the current app installation parameters
    const initializeApp = async () => {
      const parameters = await sdk.app.getParameters<KlaviyoAppConfig>();

      // Log the loaded parameters
      logParameters(parameters, 'initializeApp');

      if (parameters) {
        setPublicKey(parameters.publicKey || '');
        setPrivateKey(parameters.privateKey || '');
        setSelectedLocations(parameters.selectedLocations || {});
        setSelectedContentTypes(parameters.selectedContentTypes || {});

        // If we have parameters, check if we're connected
        if (parameters.publicKey && parameters.privateKey) {
          validateCredentials(parameters.publicKey, parameters.privateKey);
        }

        // Store mappings in localStorage for backup
        if (parameters.fieldMappings || parameters.contentTypeMappings) {
          try {
            if (parameters.fieldMappings && Array.isArray(parameters.fieldMappings)) {
              // Use persistence service to ensure consistency
              setEntryKlaviyoFieldMappings(sdk, '', parameters.fieldMappings);
              console.log('Saved field mappings to persistence service from parameters');
            }
          } catch (e) {
            console.error('Error saving mappings to persistence service:', e);
          }
        }
      }

      // Check if app is installed and in read-only mode
      const isInstalled = await sdk.app.isInstalled();
      setIsReadOnly(isInstalled);

      // Get available content types
      loadContentTypes();

      // App is ready
      sdk.app.setReady();
    };

    initializeApp();
  }, [sdk, publicKey, privateKey, isConnected]);

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
  const buildEditorInterfaceConfig = () => {
    const targetContentTypes = Object.keys(selectedContentTypes).filter(
      (contentTypeId) => selectedContentTypes[contentTypeId]
    );

    // Build target state for editor interface
    const editorInterface: Record<string, any> = {};

    if (selectedLocations['entry-sidebar']) {
      targetContentTypes.forEach((contentTypeId) => {
        editorInterface[contentTypeId] = {
          sidebar: {
            position: 0,
          },
        };
      });
    }

    return editorInterface;
  };

  // Handle location selection
  const handleLocationToggle = (locationId: string) => {
    setSelectedLocations((prev) => ({
      ...prev,
      [locationId]: !prev[locationId],
    }));
  };

  // Handle content type selection
  const handleContentTypeToggle = (contentTypeId: string) => {
    setSelectedContentTypes((prev) => ({
      ...prev,
      [contentTypeId]: !prev[contentTypeId],
    }));
  };

  // Validate Klaviyo API credentials
  const validateCredentials = async (pubKey: string, privKey: string) => {
    setIsValidating(true);
    setErrorMessage('');

    try {
      // Use the base URL from config to make the request
      const baseUrl = API_PROXY_URL.startsWith('http')
        ? API_PROXY_URL
        : window.location.origin + API_PROXY_URL;

      const response = await fetch(`${baseUrl}/validate-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey: pubKey,
          privateKey: privKey,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Invalid credentials';

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e, errorText);
        }

        setErrorMessage(errorMessage);
        setIsConnected(false);
      } else {
        setIsConnected(true);

        // Store API keys in localStorage for backup access when credentials are validated
        storeApiKeysInLocalStorage(pubKey, privKey);
      }
    } catch (error) {
      console.error('Error validating credentials:', error);
      setErrorMessage('Network error. Please try again.');
      setIsConnected(false);
    } finally {
      setIsValidating(false);
    }
  };

  // Handle connect button click
  const handleConnect = async () => {
    // Validate inputs
    console.log('handleConnect', publicKey, privateKey);
    if (!publicKey || !privateKey) {
      sdk.notifier.error('Please provide both Public Key and Private Key');
      return;
    }

    validateCredentials(publicKey, privateKey);
  };

  // Handle disconnect button click
  const handleDisconnect = () => {
    setIsConnected(false);
    sdk.notifier.success('Disconnected from Klaviyo');
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

              {errorMessage && <Text fontColor="red600">{errorMessage}</Text>}

              <Stack
                spacing="spacingM"
                flexDirection="column"
                alignItems="flex-start"
                style={{ width: '100%' }}>
                <Text fontWeight="fontWeightMedium">Connection status</Text>
                <Flex alignItems="center" gap="spacingM">
                  <Button
                    variant={isConnected ? 'secondary' : 'primary'}
                    isLoading={isValidating}
                    onClick={isConnected ? handleDisconnect : handleConnect}
                    isDisabled={isReadOnly}>
                    {isConnected ? (
                      <Flex alignItems="center" gap="spacingXs">
                        Disconnect
                      </Flex>
                    ) : (
                      'Connect to Klaviyo'
                    )}
                  </Button>
                  <Flex alignItems="center" gap="spacingXs">
                    <Text>Status:</Text>
                    {isConnected ? (
                      <Flex alignItems="center" gap="spacingXs">
                        <Text fontColor="green600">connected</Text>
                        <CheckCircleIcon variant="positive" />
                      </Flex>
                    ) : (
                      <Text fontColor="gray500">disconnected</Text>
                    )}
                  </Flex>
                </Flex>
              </Stack>

              <Stack
                spacing="spacingM"
                flexDirection="column"
                alignItems="flex-start"
                style={{ width: '100%' }}>
                <Text fontWeight="fontWeightMedium">App Locations</Text>
                <Text fontColor="gray500">Select where to display the Klaviyo integration</Text>
                <div style={{ width: '100%' }}>
                  {AVAILABLE_LOCATIONS.map((location) => (
                    <Checkbox
                      key={location.id}
                      id={`location-${location.id}`}
                      isChecked={selectedLocations[location.id] || false}
                      onChange={() => handleLocationToggle(location.id)}
                      isDisabled={isReadOnly}>
                      <div>
                        <Text fontWeight="fontWeightMedium">{location.name}</Text>
                        <Text fontColor="gray500">{location.description}</Text>
                      </div>
                    </Checkbox>
                  ))}
                </div>
              </Stack>

              <Stack
                spacing="spacingM"
                flexDirection="column"
                alignItems="flex-start"
                style={{ width: '100%' }}>
                <Text fontWeight="fontWeightMedium">Content Types</Text>
                <Text fontColor="gray500">
                  Select which content types to enable with the Klaviyo integration
                </Text>
                <div style={containerStyle}>
                  <ContentTypesList
                    contentTypes={contentTypes}
                    selectedContentTypes={selectedContentTypes}
                    onContentTypeToggle={handleContentTypeToggle}
                    isDisabled={isReadOnly}
                  />
                </div>
              </Stack>
            </Stack>
          </Form>
        </Stack>
      </Box>
    </Box>
  );
};

export default ConfigScreen;
