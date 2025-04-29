import React, { useCallback, useState, useEffect } from 'react';
import { useSDK } from '../hooks/useSDK';
import {
  Form,
  FormControl,
  TextInput,
  Button,
  Stack,
  Heading,
  Box,
  Text,
  Flex,
  TextLink,
  Paragraph,
  Autocomplete,
  Pill,
} from '@contentful/f36-components';
import { ExternalLinkIcon, CopyIcon, CheckCircleIcon } from '@contentful/f36-icons';
import { FieldMapping } from '../config/klaviyo';
import { ConfigAppSDK, ContentType, AppExtensionSDK } from '@contentful/app-sdk';
import { OAuthService } from '../services/oauth';
import { KlaviyoOAuthConfig, PKCEData } from '../config/klaviyo';
import { checkOAuthTokens, clearOAuthTokens } from '../utils/oauth-debug';
import console from 'console';

interface AppLocation {
  id: string;
  name: string;
  description: string;
}

interface ContentTypeWithEditorInterfaces {
  sys: {
    id: string;
  };
  name: string;
}

interface KlaviyoTokens {
  access_token: string;
  refresh_token: string;
}

interface KlaviyoAuthMessage {
  type: 'KLAVIYO_AUTH_CALLBACK';
  code?: string;
  error?: string;
  error_description?: string;
}

interface Installation {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  locations?: AppLocation[];
  contentTypes?: string[];
}

interface AppInstallationParameters {
  installation: Installation;
}

const AVAILABLE_LOCATIONS: AppLocation[] = [
  {
    id: 'entry-sidebar',
    name: 'Entry Sidebar',
    description: 'Add Klaviyo integration to the entry sidebar',
  },
];

// Styles for the step indicator
const stepIndicatorStyle = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  backgroundColor: '#e5ebed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '16px',
  fontWeight: 600,
  color: '#536471',
};

// Styles for the container
const containerStyle = {
  padding: '24px',
  border: '1px solid #e5ebed',
  borderRadius: '6px',
  width: '100%',
};

// Styles for the section
const sectionStyle = {
  marginBottom: '16px',
  width: '100%',
};

// Style for divider line
const dividerStyle = {
  height: '1px',
  backgroundColor: '#e5ebed',
  margin: '12px 0',
  width: '100%',
};

// Helper to get the proper redirect URI with the correct port
const getProxyRedirectUri = () => {
  const origin = window.location.origin;
  // Extract hostname without port
  const urlParts = origin.split(':');
  const hostnameWithProtocol =
    urlParts.length > 2
      ? `${urlParts[0]}:${urlParts[1]}` // For URLs like http://localhost
      : origin; // For production URLs

  // Ensure we're using port 3001 for the proxy
  return `${hostnameWithProtocol}:3001/auth/callback`;
};

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContentTypes, setFilteredContentTypes] = useState<
    ContentTypeWithEditorInterfaces[]
  >([]);
  const [contentTypes, setContentTypes] = useState<ContentTypeWithEditorInterfaces[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const redirectUri = getProxyRedirectUri();

  useEffect(() => {
    // Initialize the app
    async function initializeApp() {
      // Get current parameters
      const currentParameters = await sdk.app.getParameters<AppInstallationParameters>();

      // Get available content types
      const availableContentTypes = await sdk.space.getContentTypes();
      setContentTypes(availableContentTypes.items);

      // Set initial state from parameters if they exist
      if (currentParameters?.installation) {
        setClientId(currentParameters.installation.clientId || '');
        setClientSecret(currentParameters.installation.clientSecret || '');
        setIsConnected(!!currentParameters.installation.accessToken);
        setSelectedContentTypes(currentParameters.installation.contentTypes || []);
      }

      // Mark app as ready
      sdk.app.setReady();
    }

    initializeApp();
  }, [sdk]);

  // Add onConfigure callback
  useEffect(() => {
    // Handler called when app configuration is saved
    const onConfigure = async () => {
      if (!clientId || !clientSecret) {
        sdk.notifier.error('Please provide both Client ID and Client Secret');
        return false;
      }

      // Prepare editor interfaces
      const editorInterface = {
        sidebar: {
          position: 0,
          settings: { helpText: 'Klaviyo integration' },
        },
      };

      // Set up editor interfaces for each selected content type
      const targetState = {
        EditorInterface: selectedContentTypes.reduce((acc, contentTypeId) => {
          acc[contentTypeId] = editorInterface;
          return acc;
        }, {} as Record<string, any>),
      };

      const parameters: AppInstallationParameters = {
        installation: {
          clientId,
          clientSecret,
          locations: AVAILABLE_LOCATIONS, // Always include entry-sidebar
          contentTypes: selectedContentTypes,
        },
      };

      // Merge tokens if they exist
      const tokens = await checkOAuthTokens();
      if (tokens?.accessToken && tokens?.refreshToken) {
        parameters.installation.accessToken = tokens.accessToken;
        parameters.installation.refreshToken = tokens.refreshToken;
      }

      return {
        parameters: { installation: parameters.installation },
        targetState,
      };
    };

    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, clientId, clientSecret, selectedContentTypes]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredContentTypes(contentTypes);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = contentTypes.filter(
      (ct) => ct.name.toLowerCase().includes(query) || ct.sys.id.toLowerCase().includes(query)
    );
    setFilteredContentTypes(filtered);
  }, [searchQuery, contentTypes]);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      const config: KlaviyoOAuthConfig = {
        clientId,
        clientSecret,
        redirectUri,
      };

      const oauthService = new OAuthService(config);

      // Generate PKCE data
      const pkceData = await oauthService.generatePKCE();

      // Store PKCE data in localStorage with a unique key based on state
      localStorage.setItem(`klaviyo_pkce_data`, JSON.stringify(pkceData));

      // Get authorization URL
      const authUrl = oauthService.getAuthorizationUrl(pkceData);

      // Open OAuth window
      const oauthWindow = window.open(authUrl, 'Klaviyo Auth', 'width=800,height=900');

      // Check if popup was blocked
      if (!oauthWindow) {
        throw new Error(
          'Popup window was blocked. Please allow popups for this site and try again.'
        );
      }

      // Try to focus the window
      oauthWindow.focus();

      let cleanup: (() => void) | undefined;

      // Create a promise that resolves when auth is complete
      const authPromise = new Promise<KlaviyoTokens>((resolve, reject) => {
        let isProcessing = false;
        let isResolved = false;
        let tokenExchangePromise: Promise<void> | null = null;

        const messageHandler = async (e: MessageEvent<KlaviyoAuthMessage>) => {
          // Log all received messages for debugging
          console.log('Received message event:', {
            origin: e.origin,
            source: e.source === oauthWindow ? 'oauth window' : 'other',
            data: e.data,
          });

          // Accept messages from any origin since we're validating the source window
          if (e.source !== oauthWindow) {
            console.log('Message from unexpected source, ignoring');
            return;
          }

          const { type, code, error, error_description } = e.data;

          if (type !== 'KLAVIYO_AUTH_CALLBACK') {
            console.log('Unexpected message type:', type);
            return;
          }

          if (error) {
            reject(new Error(`Authentication failed: ${error_description || error}`));
            return;
          }

          if (!code) {
            reject(new Error('No authorization code received'));
            return;
          }

          if (isProcessing) {
            console.log('Already processing auth code, ignoring duplicate message');
            return;
          }

          console.log('Processing authentication code');
          isProcessing = true;

          // Create a promise for the token exchange
          tokenExchangePromise = (async () => {
            try {
              // Retrieve the stored PKCE data
              const storedPkceData = localStorage.getItem(`klaviyo_pkce_data`);
              if (!storedPkceData) {
                throw new Error('PKCE data not found');
              }

              const pkceData = JSON.parse(storedPkceData);

              // Exchange code for tokens
              console.log('Exchanging code for tokens');
              const tokens = await oauthService.exchangeCodeForToken(code, pkceData.codeVerifier);
              console.log('Received tokens successfully');

              // Clean up stored PKCE data
              localStorage.removeItem(`klaviyo_pkce_data`);

              isResolved = true;
              resolve(tokens);
            } catch (error) {
              console.error('Error during token exchange:', error);
              isProcessing = false;
              reject(error);
            }
          })();
        };

        // Add message listener
        console.log('Adding message listener');
        window.addEventListener('message', messageHandler);

        // Set timeout for auth flow
        const timeoutId = setTimeout(() => {
          console.log('Authentication timed out');
          if (cleanup) cleanup();
          reject(new Error('Authentication timed out'));
        }, 300000); // 5 minute timeout

        // Cleanup on window close
        const checkWindow = setInterval(async () => {
          if (oauthWindow?.closed) {
            console.log('OAuth window was closed, waiting for token exchange to complete...');

            // If we're in the middle of a token exchange, wait for it
            if (tokenExchangePromise) {
              try {
                await tokenExchangePromise;
                // If we get here, the token exchange completed successfully
                console.log('Token exchange completed after window close');
                return;
              } catch (error) {
                // Token exchange failed
                console.error('Token exchange failed after window close:', error);
              }
            }

            // If we get here, either there was no token exchange in progress
            // or it failed after the window was closed
            if (!isResolved) {
              console.log('Window closed before successful token exchange');
              clearInterval(checkWindow);
              clearTimeout(timeoutId);
              if (cleanup) cleanup();
              reject(
                new Error(
                  'Authentication window was closed. Please keep the window open until authentication completes.'
                )
              );
            }
          }
        }, 1000);

        // Define cleanup function
        cleanup = () => {
          console.log('Running cleanup');
          window.removeEventListener('message', messageHandler);
          clearInterval(checkWindow);
          clearTimeout(timeoutId);
        };
      });

      try {
        // Wait for auth to complete
        const tokens = await authPromise;
        console.log('tokens', tokens);

        // Save credentials and tokens
        try {
          // Configure the app with the new parameters
          sdk.app.onConfigure(() => {
            console.log('Saving configuration...');
            setIsConnected(true);
            return {
              parameters: {
                installation: {
                  clientId,
                  clientSecret,
                  accessToken: tokens.access_token,
                  refreshToken: tokens.refresh_token,
                },
              },
            };
          });

          // If we get here, configuration was successful
          console.log('Configuration saved successfully');

          // Notify the OAuth window that we're done
          if (oauthWindow && !oauthWindow.closed) {
            try {
              oauthWindow.postMessage({ type: 'KLAVIYO_AUTH_COMPLETE' }, '*');
            } catch (error) {
              console.error('Error notifying OAuth window:', error);
            }
          }

          setIsConnected(true);
          sdk.notifier.success('Successfully connected to Klaviyo');
        } catch (configError) {
          console.error('Failed to save configuration:', configError);
          setIsConnected(false);
          throw new Error('Failed to save app configuration');
        }
      } catch (error) {
        console.error('Connection failed:', error);
        setIsConnected(false); // Ensure connected state is false on error
        sdk.notifier.error(error instanceof Error ? error.message : 'Failed to connect to Klaviyo');
      } finally {
        if (cleanup) cleanup();
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      sdk.notifier.error(error instanceof Error ? error.message : 'Failed to connect to Klaviyo');
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      sdk.app.onConfigure(() => ({
        parameters: {
          installation: {
            clientId: '',
            clientSecret: '',
            accessToken: '',
          },
        },
      }));
      setIsConnected(false);
    } catch (error) {
      console.error('Disconnection failed:', error);
      sdk.notifier.error('Failed to disconnect from Klaviyo');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    sdk.notifier.success('Copied to clipboard');
  };

  return (
    <Box style={{ maxWidth: '800px', margin: '64px auto' }}>
      <Box padding="spacingXl" style={{ border: '1px solid #E5EBED', borderRadius: '4px' }}>
        <Stack spacing="spacingXl" flexDirection="column" alignItems="flex-start">
          <Stack spacing="spacingM" flexDirection="column" alignItems="flex-start">
            <Heading>Configure access</Heading>
            <Text>Input your client ID and secret to connect your Klaviyo account.</Text>
          </Stack>

          <Form style={{ width: '100%' }}>
            <Stack spacing="spacingXl" flexDirection="column" alignItems="flex-start">
              <FormControl isRequired style={{ width: '100%', margin: '0' }}>
                <FormControl.Label>Client ID</FormControl.Label>
                <TextInput
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter your client ID"
                  style={{ width: '100%' }}
                />
                <TextLink
                  style={{ marginTop: '8px' }}
                  href="https://developers.klaviyo.com/en/docs/create_oauth_app"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={<ExternalLinkIcon />}>
                  Learn how to create a public OAuth app in Klaviyo
                </TextLink>
              </FormControl>

              <FormControl isRequired style={{ width: '100%', margin: '0' }}>
                <FormControl.Label>Client secret</FormControl.Label>
                <TextInput
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter your client secret"
                  style={{ width: '100%' }}
                />
              </FormControl>

              <Stack
                spacing="spacingM"
                flexDirection="column"
                alignItems="flex-start"
                style={{ width: '100%' }}>
                <Text fontWeight="fontWeightMedium">Connection status</Text>
                <Flex alignItems="center" gap="spacingM">
                  <Button
                    variant={isConnected ? (isHovered ? 'negative' : 'secondary') : 'secondary'}
                    isLoading={isLoading}
                    onClick={isConnected ? handleDisconnect : handleConnect}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}>
                    {isConnected ? (
                      isHovered ? (
                        'Disconnect'
                      ) : (
                        <Flex alignItems="center" gap="spacingXs">
                          Connected
                          <CheckCircleIcon variant="positive" />
                        </Flex>
                      )
                    ) : (
                      'Connect to Klaviyo'
                    )}
                  </Button>
                  <Text>Status: {isConnected ? 'connected' : 'disconnected'}</Text>
                </Flex>
              </Stack>

              <Stack
                spacing="spacingM"
                flexDirection="column"
                alignItems="flex-start"
                style={{ width: '100%' }}>
                <Text fontWeight="fontWeightMedium">Redirect URI</Text>
                <Flex gap="spacingS" style={{ width: '100%' }}>
                  <TextInput value={redirectUri} isReadOnly isDisabled style={{ width: '100%' }} />
                  <Button
                    variant="secondary"
                    onClick={() => copyToClipboard(redirectUri)}
                    startIcon={<CopyIcon />}
                  />
                </Flex>
                <Text fontColor="gray500">
                  Enter this in your Klaviyo OAuth app settings. It cannot be changed.
                </Text>
              </Stack>

              {/* Content Types Section */}
              <Box style={containerStyle}>
                <Stack spacing="spacingM" flexDirection="column" alignItems="flex-start">
                  <Heading>Content Types</Heading>
                  <Paragraph>
                    Select which content types should have the Klaviyo sidebar integration
                  </Paragraph>

                  <Stack spacing="spacingS" flexDirection="column" alignItems="flex-start">
                    <FormControl style={{ width: '100%' }}>
                      <FormControl.Label>Search and select content types</FormControl.Label>
                      <Autocomplete
                        items={filteredContentTypes.map((ct) => ({
                          label: ct.name,
                          description: ct.sys.id,
                          value: ct.sys.id,
                        }))}
                        onInputValueChange={setSearchQuery}
                        onSelectItem={(item) => {
                          if (item && !selectedContentTypes.includes(item.value)) {
                            setSelectedContentTypes([...selectedContentTypes, item.value]);
                          }
                          setSearchQuery('');
                        }}
                        listWidth="full"
                        placeholder="Search for content types..."
                        isDisabled={false}
                        renderItem={(item) => (
                          <Flex flexDirection="column">
                            <Text>{item.label}</Text>
                            <Text fontColor="gray500" fontSize="fontSizeS">
                              {item.description}
                            </Text>
                          </Flex>
                        )}
                        itemToString={(item) => item?.label || ''}
                      />
                    </FormControl>

                    {selectedContentTypes.length > 0 && (
                      <Box marginTop="spacingM">
                        <Text fontWeight="fontWeightMedium" marginBottom="spacingS">
                          Selected Content Types
                        </Text>
                        <Flex flexWrap="wrap" gap="spacingXs">
                          {selectedContentTypes.map((typeId) => {
                            const contentType = contentTypes.find((ct) => ct.sys.id === typeId);
                            return (
                              <Pill
                                key={typeId}
                                label={contentType?.name || typeId}
                                onClose={() => {
                                  setSelectedContentTypes(
                                    selectedContentTypes.filter((id) => id !== typeId)
                                  );
                                }}
                              />
                            );
                          })}
                        </Flex>
                      </Box>
                    )}
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </Form>
        </Stack>
      </Box>
    </Box>
  );
};

export default ConfigScreen;
