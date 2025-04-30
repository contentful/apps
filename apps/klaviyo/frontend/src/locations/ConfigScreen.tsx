import { useState, useEffect } from 'react';
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
import { ConfigAppSDK } from '@contentful/app-sdk';
import { OAuthService } from '../services/oauth';
import { logger } from '../utils/logger';

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
  syncData?: {
    syncStatuses: string[];
    lastUpdated: number;
  };
}

const AVAILABLE_LOCATIONS: AppLocation[] = [
  {
    id: 'entry-sidebar',
    name: 'Entry Sidebar',
    description: 'Add Klaviyo integration to the entry sidebar',
  },
];

// Styles for the container
const containerStyle = {
  padding: '24px',
  border: '1px solid #e5ebed',
  borderRadius: '6px',
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

  // Ensure we're using port 3001 for the proxy in development or production URL path
  if (import.meta.env.MODE !== 'production') {
    return `${hostnameWithProtocol}:3001/auth/callback`;
  } else {
    return `${hostnameWithProtocol}/api/klaviyo/auth/callback`;
  }
};

// Check if an access token exists and is valid
const hasValidAccessToken = () => {
  const accessToken = localStorage.getItem('klaviyo_access_token');
  const expiresAtStr = localStorage.getItem('klaviyo_token_expires_at');

  if (!accessToken) return false;

  const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;
  return Date.now() < expiresAt;
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

        // Set connected status based on valid tokens in localStorage
        setIsConnected(hasValidAccessToken());

        setSelectedContentTypes(currentParameters.installation.contentTypes || []);

        // Initialize sync data structure if not present
        if (!currentParameters.syncData) {
          // Migrate existing data from localStorage if available
          const localStorageKey = 'klaviyo_sync_status';
          const existingStatusesStr = localStorage.getItem(localStorageKey);

          if (existingStatusesStr) {
            try {
              const existingStatuses = JSON.parse(existingStatusesStr);

              // Create new sync data structure with existing statuses
              const updatedParameters = {
                ...currentParameters,
                syncData: {
                  syncStatuses: existingStatuses,
                  lastUpdated: Date.now(),
                },
              };

              // Use onConfigure to save the parameters
              sdk.app.onConfigure(() => ({
                parameters: updatedParameters,
                targetState: {
                  EditorInterface: selectedContentTypes.reduce((acc, id) => {
                    acc[id] = { sidebar: { position: 0 } };
                    return acc;
                  }, {} as any),
                },
              }));

              logger.log('Migrated sync statuses from localStorage to Contentful parameters');
            } catch (error) {
              logger.error('Error migrating sync statuses from localStorage:', error);

              // Create empty sync data structure with empty statuses
              const updatedParameters = {
                ...currentParameters,
                syncData: {
                  syncStatuses: [],
                  lastUpdated: Date.now(),
                },
              };

              // Use onConfigure to save the parameters
              sdk.app.onConfigure(() => ({
                parameters: updatedParameters,
                targetState: {
                  EditorInterface: selectedContentTypes.reduce((acc, id) => {
                    acc[id] = { sidebar: { position: 0 } };
                    return acc;
                  }, {} as any),
                },
              }));
            }
          } else {
            // Create empty sync data structure
            const updatedParameters = {
              ...currentParameters,
              syncData: {
                syncStatuses: [],
                lastUpdated: Date.now(),
              },
            };

            // Use onConfigure to save the parameters
            sdk.app.onConfigure(() => ({
              parameters: updatedParameters,
              targetState: {
                EditorInterface: selectedContentTypes.reduce((acc, id) => {
                  acc[id] = { sidebar: { position: 0 } };
                  return acc;
                }, {} as any),
              },
            }));
          }
        }
      }

      // Mark app as ready
      sdk.app.setReady();
    }

    initializeApp();
  }, [sdk]);

  // Add onConfigure callback
  useEffect(() => {
    sdk.app.onConfigure(() => {
      // Get existing sync data to preserve it
      return sdk.app.getParameters().then((parameters) => {
        const { syncData } = parameters || {};

        // Return parameters for the app
        return {
          parameters: {
            installation: {
              clientId,
              clientSecret,
              redirectUri,
              contentTypes: selectedContentTypes,
            },
            // Preserve existing sync data
            syncData: syncData || {
              syncStatuses: [],
              lastUpdated: Date.now(),
            },
          },
          targetState: {
            EditorInterface: selectedContentTypes.reduce((acc, id) => {
              acc[id] = { sidebar: { position: 0 } };
              return acc;
            }, {} as any),
          },
        };
      });
    });
  }, [sdk, clientId, clientSecret, selectedContentTypes, redirectUri]);

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
    // Validate inputs
    if (!clientId || !clientSecret) {
      sdk.notifier.error('Please provide both Client ID and Client Secret');
      return;
    }

    setIsLoading(true);

    try {
      // Create OAuth service
      const oauthService = new OAuthService({
        clientId,
        clientSecret,
        redirectUri,
      });

      // Generate PKCE data
      const pkceData = await oauthService.generatePKCE();

      // Store pkceData in localStorage for retrieval after redirect
      localStorage.setItem('klaviyo_pkce_data', JSON.stringify(pkceData));

      // Build authorization URL
      const authUrl = oauthService.getAuthorizationUrl(pkceData);

      // Open a popup window for OAuth flow
      const width = 800;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const authWindow = window.open(
        authUrl,
        'KlaviyoAuth',
        `width=${width},height=${height},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no`
      );

      if (!authWindow) {
        throw new Error('Popup was blocked by your browser. Please allow popups for this site.');
      }

      // Set up message listener for OAuth callback
      const messageHandler = async (e: MessageEvent<KlaviyoAuthMessage>) => {
        if (e.data.type === 'KLAVIYO_AUTH_CALLBACK') {
          // Remove message event listener
          window.removeEventListener('message', messageHandler);
          setIsLoading(false);

          try {
            // Close the auth window
            authWindow?.close();

            // Handle authentication error
            if (e.data.error) {
              throw new Error(`Authentication error: ${e.data.error}`);
            }

            if (!e.data.code) {
              throw new Error('No authorization code received');
            }

            // Get stored PKCE data
            const storedPkceDataStr = localStorage.getItem('klaviyo_pkce_data');
            if (!storedPkceDataStr) {
              throw new Error('PKCE data not found');
            }
            const storedPkceData = JSON.parse(storedPkceDataStr);

            // Exchange code for token
            const tokens = await oauthService.exchangeCodeForToken(
              e.data.code,
              storedPkceData.codeVerifier
            );

            // Store tokens directly in localStorage (we don't need to call setTokens)
            // The exchangeCodeForToken method already stores them

            // Clear PKCE data from localStorage
            localStorage.removeItem('klaviyo_pkce_data');

            // Update connection state
            setIsConnected(true);
            sdk.notifier.success('Successfully connected to Klaviyo');

            // Update installation parameters for persistence
            const parameters = await sdk.app.getParameters<AppInstallationParameters>();

            // Call onConfigure to save the parameters
            sdk.app.onConfigure(() => ({
              parameters: {
                installation: {
                  ...parameters?.installation,
                  clientId,
                  clientSecret,
                  accessToken: tokens.access_token,
                  refreshToken: tokens.refresh_token,
                },
              },
              targetState: {
                EditorInterface: selectedContentTypes.reduce((acc, contentTypeId) => {
                  acc[contentTypeId] = {
                    sidebar: {
                      position: 0,
                      settings: { helpText: 'Klaviyo integration' },
                    },
                  };
                  return acc;
                }, {} as Record<string, any>),
              },
            }));
          } catch (error) {
            logger.error('Error during token exchange:', error);
            sdk.notifier.error(error instanceof Error ? error.message : 'Authentication failed');
          }
        }
      };

      // Add message event listener
      window.addEventListener('message', messageHandler);

      // Create an interval to check if the window is closed
      const checkWindowInterval = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkWindowInterval);
          window.removeEventListener('message', messageHandler);

          try {
            // The window was closed without a successful OAuth flow
            // Need to notify the user
            // We'll only do this if we haven't received the callback message
            if (!isConnected) {
              setIsLoading(false);
              sdk.notifier.warning('Authentication window was closed before completing');
            }
          } catch (error) {
            logger.error('Token exchange failed after window close:', error);
            setIsLoading(false);
          }
        }
      }, 500);
    } catch (configError) {
      logger.error('Failed to save configuration:', configError);
      sdk.notifier.error('Failed to save configuration');
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);

    try {
      // Create OAuth service
      const oauthService = new OAuthService({
        clientId,
        clientSecret,
        redirectUri,
      });

      // Revoke token
      await oauthService.revokeToken();

      // Clear tokens from localStorage
      localStorage.removeItem('klaviyo_access_token');
      localStorage.removeItem('klaviyo_refresh_token');
      localStorage.removeItem('klaviyo_token_expires_at');

      // Update connection state
      setIsConnected(false);
      sdk.notifier.success('Successfully disconnected from Klaviyo');

      // Update installation parameters
      const parameters = await sdk.app.getParameters<AppInstallationParameters>();

      // Call onConfigure to save the parameters
      sdk.app.onConfigure(() => ({
        parameters: {
          installation: {
            ...parameters?.installation,
            clientId,
            clientSecret,
            accessToken: undefined,
            refreshToken: undefined,
          },
        },
        targetState: {
          EditorInterface: selectedContentTypes.reduce((acc, contentTypeId) => {
            acc[contentTypeId] = {
              sidebar: {
                position: 0,
                settings: { helpText: 'Klaviyo integration' },
              },
            };
            return acc;
          }, {} as Record<string, any>),
        },
      }));
    } catch (error) {
      logger.error('Disconnection failed:', error);
      sdk.notifier.error(
        error instanceof Error ? error.message : 'Failed to disconnect from Klaviyo'
      );
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
