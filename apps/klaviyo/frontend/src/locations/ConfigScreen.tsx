import React, { useEffect, useCallback, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
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
} from '@contentful/f36-components';
import { FieldMapping } from '../config/klaviyo';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { OAuthService } from '../services/oauth';
import { KlaviyoOAuthConfig, PKCEData } from '../config/klaviyo';
import { checkOAuthTokens, clearOAuthTokens } from '../utils/oauth-debug';

interface ConfigScreenProps {
  mappings?: FieldMapping[];
}

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

export const ConfigScreen: React.FC<ConfigScreenProps> = ({ mappings = [] }) => {
  const sdk = useSDK<ConfigAppSDK>();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [pkceData, setPkceData] = useState<PKCEData | null>(null);
  const [config, setConfig] = useState<KlaviyoOAuthConfig | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  // Add message listener for OAuth callback
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Check if the message is from our OAuth callback
      if (event.data && event.data.type === 'KLAVIYO_AUTH_CALLBACK') {
        console.log('Received OAuth callback message:', event.data);

        const { code, state, error, error_description } = event.data;

        if (error || error_description) {
          setErrorMessage(`Authorization failed: ${error || ''} ${error_description || ''}`);
          setConnecting(false);
          return;
        }

        if (code && state && config) {
          try {
            console.log('Calling exchangeCodeForToken with code and state from callback message');
            console.log('Auth data:', {
              code_length: code.length,
              state_length: state.length,
              config_available: !!config,
              client_id_available: !!config?.clientId,
              client_secret_available: !!config?.clientSecret,
              redirect_uri: config?.redirectUri,
            });

            await exchangeCodeForToken(code, state);
            console.log('Authorization completed successfully via postMessage');
            setAuthUrl(null); // Clear the auth URL once authorized
            setConnecting(false);
          } catch (err) {
            console.error('Error processing OAuth callback:', err);
            setErrorMessage(
              `Failed to complete authorization: ${
                err instanceof Error ? err.message : 'Unknown error'
              }`
            );
            setConnecting(false);
          }
        } else {
          console.error('Missing required OAuth callback parameters:', {
            code_available: !!code,
            state_available: !!state,
            config_available: !!config,
          });
          setErrorMessage('Authorization failed: Missing required parameters');
          setConnecting(false);
        }
      }
    };

    // Add message event listener
    window.addEventListener('message', handleMessage);
    console.log('Added postMessage event listener for OAuth callback');

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
      console.log('Removed postMessage event listener');
    };
  }, [config]);

  // Check for authorization code in the URL when redirected back from Klaviyo
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    if (error || errorDescription) {
      // Handle auth errors
      setErrorMessage(`Authorization failed: ${error || ''} ${errorDescription || ''}`);
      return;
    }

    if (code && state && config) {
      // Exchange code for tokens
      exchangeCodeForToken(code, state);
    }
  }, [config]);

  // Initialize configuration and check if already authorized
  useEffect(() => {
    async function initConfig() {
      // Get installation parameters
      const parameters = sdk.parameters.installation;

      console.log('Installation parameters:', parameters);

      // Get or provide default values for OAuth config
      const clientId = (parameters?.klaviyoClientId as string) || '';
      const clientSecret = (parameters?.klaviyoClientSecret as string) || '';

      // Calculate a default redirect URI based on current location if not provided
      let redirectUri = parameters?.klaviyoRedirectUri as string;
      if (!redirectUri) {
        // Use proxy server redirect URI
        redirectUri = getProxyRedirectUri();
        console.log('Using proxy redirect URI:', redirectUri);
      }

      // Create temporary config even if not all parameters are provided
      // This allows the user to see form inputs and be able to save values
      const config: KlaviyoOAuthConfig = {
        clientId,
        clientSecret,
        redirectUri,
      };

      console.log('Created OAuth config:', {
        clientId: clientId ? `${clientId.substring(0, 5)}...` : 'Missing',
        clientSecret: clientSecret ? 'Present (hidden)' : 'Missing',
        redirectUri,
      });

      setConfig(config);

      // Only set error message if we're missing all parameters
      if (!clientId && !clientSecret && !redirectUri) {
        setErrorMessage(
          'Please provide OAuth credentials in the installation parameters and save the app configuration.'
        );
      } else if (!clientId) {
        setErrorMessage(
          'Klaviyo Client ID is required. Please add it to the installation parameters.'
        );
      } else if (!clientSecret) {
        setErrorMessage(
          'Klaviyo Client Secret is required. Please add it to the installation parameters.'
        );
      } else {
        setErrorMessage(null);
      }

      // Check if we already have tokens
      const accessToken = localStorage.getItem('klaviyo_access_token');
      const refreshToken = localStorage.getItem('klaviyo_refresh_token');
      const tokenExpiresAt = localStorage.getItem('klaviyo_token_expires_at');

      console.log('OAuth token status:', {
        accessToken: accessToken ? 'Present' : 'Missing',
        refreshToken: refreshToken ? 'Present' : 'Missing',
        tokenExpiresAt: tokenExpiresAt || 'Missing',
      });

      if (accessToken && refreshToken && tokenExpiresAt) {
        setIsAuthorized(true);
      }
    }

    initConfig();
  }, [sdk.parameters.installation]); // Only depend on sdk.parameters.installation, not the entire sdk

  // Exchange authorization code for token
  const exchangeCodeForToken = async (code: string, state: string) => {
    if (!config) return;

    try {
      setConnecting(true);
      setErrorMessage(null);

      const oauthService = new OAuthService(config);
      await oauthService.exchangeCodeForToken(code, state);

      // Update state
      setIsAuthorized(true);

      // Remove code and state from URL to prevent reuse
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      setErrorMessage(
        `Failed to connect to Klaviyo: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setConnecting(false);
    }
  };

  // Start authorization flow
  const handleConnect = useCallback(async () => {
    if (!config) return;

    try {
      setConnecting(true);
      setErrorMessage(null);

      // Save credentials for future use (especially for disconnecting)
      if (config.clientId && config.clientSecret && config.redirectUri) {
        localStorage.setItem('klaviyo_client_id', config.clientId);
        localStorage.setItem('klaviyo_client_secret', config.clientSecret);
        localStorage.setItem('klaviyo_redirect_uri', config.redirectUri);

        console.log('Saved credentials to localStorage:', {
          clientId_first_chars: config.clientId.substring(0, 5) + '...',
          clientSecret_length: config.clientSecret.length,
          redirectUri: config.redirectUri,
        });
      }

      const oauthService = new OAuthService(config);
      const pkceData = await oauthService.generatePKCE();
      setPkceData(pkceData);

      // Generate the authorization URL
      const authUrl = oauthService.getAuthorizationUrl(pkceData);
      console.log('Opening authorization URL in a new window:', authUrl);
      setAuthUrl(authUrl);

      // Open a popup window for the OAuth flow instead of redirecting
      // This avoids the Content Security Policy (CSP) frame-ancestors restriction
      const popupWidth = 800;
      const popupHeight = 700;
      const left = window.screenX + (window.outerWidth - popupWidth) / 2;
      const top = window.screenY + (window.outerHeight - popupHeight) / 2;

      // Open the popup
      const authWindow = window.open(
        authUrl,
        'KlaviyoAuth',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );

      if (!authWindow) {
        // Popup was blocked
        setErrorMessage(
          'Popup window was blocked. Please allow popups for this site or click the authorization link below.'
        );
        setConnecting(false);
        return;
      }

      // Event listener was added in useEffect, so we don't need to do anything else here
      console.log('Popup window opened, waiting for postMessage from callback');
    } catch (error) {
      console.error('Error starting authorization flow:', error);
      setErrorMessage(
        `Failed to start authorization flow: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      setConnecting(false);
    }
  }, [config]);

  // Handle oauth callback when redirected back with code parameter
  useEffect(() => {
    const handleAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');

      // If this is a popup window with the auth callback
      if (code && state) {
        try {
          if (!config) {
            console.error('No config available for token exchange');
            return;
          }

          const oauthService = new OAuthService(config);
          await oauthService.exchangeCodeForToken(code, state);

          // Clean up the URL
          window.history.replaceState({}, document.title, window.location.pathname);

          // Close the popup if this is the popup window
          if (window.opener && window.opener !== window) {
            window.close();
          }
        } catch (err) {
          console.error('Error exchanging code for token:', err);
          setErrorMessage(
            `Authorization failed: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      } else if (error) {
        setErrorMessage(`Authorization failed: ${error} ${params.get('error_description') || ''}`);
      }
    };

    handleAuthCallback();
  }, [config]);

  // Disconnect from Klaviyo
  const handleDisconnect = useCallback(async () => {
    try {
      setConnecting(true);
      setErrorMessage(null);

      // Get saved credentials from configuration or localStorage
      let clientId = config?.clientId;
      let clientSecret = config?.clientSecret;

      // If credentials are missing from config, try to get them from localStorage
      if (!clientId || !clientSecret) {
        clientId = localStorage.getItem('klaviyo_client_id') || '';
        clientSecret = localStorage.getItem('klaviyo_client_secret') || '';

        console.log('Using credentials from localStorage for revocation:', {
          clientId_available: !!clientId,
          clientSecret_available: !!clientSecret,
        });
      } else {
        // Save credentials for future use
        localStorage.setItem('klaviyo_client_id', clientId);
        localStorage.setItem('klaviyo_client_secret', clientSecret);
      }

      if (!clientId || !clientSecret) {
        setErrorMessage(
          'Client ID or Secret not found. Please enter them in the form before disconnecting.'
        );
        sdk.notifier.error('Client credentials required for disconnecting.');
        return;
      }

      // Create a complete config with the stored credentials
      const oauthConfig: KlaviyoOAuthConfig = {
        clientId,
        clientSecret,
        redirectUri: config?.redirectUri || getProxyRedirectUri(),
      };

      console.log('Revoking tokens with config:', {
        clientId_first_chars: clientId.substring(0, 5) + '...',
        clientSecret_length: clientSecret.length,
        redirectUri: oauthConfig.redirectUri,
      });

      // Revoke token
      const oauthService = new OAuthService(oauthConfig);
      await oauthService.revokeToken();

      // Clear tokens
      localStorage.removeItem('klaviyo_access_token');
      localStorage.removeItem('klaviyo_refresh_token');
      localStorage.removeItem('klaviyo_token_expires_at');

      // Don't remove stored client credentials for future connect/disconnect operations
      // localStorage.removeItem('klaviyo_client_id');
      // localStorage.removeItem('klaviyo_client_secret');

      setIsAuthorized(false);
      sdk.notifier.success('Successfully disconnected from Klaviyo');
    } catch (error) {
      console.error('Error disconnecting from Klaviyo:', error);
      setErrorMessage(
        `Failed to disconnect from Klaviyo: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    } finally {
      setConnecting(false);
    }
  }, [config, sdk]);

  // Configure app in Contentful
  useEffect(() => {
    const appSdk = sdk;
    appSdk.app.onConfigure(() => {
      console.log('onConfigure called, saving parameters:', {
        clientId: config?.clientId ? `${config.clientId.substring(0, 5)}...` : 'Missing',
        clientSecret: config?.clientSecret ? 'Present (hidden)' : 'Missing',
        redirectUri: config?.redirectUri,
      });

      // Validate required parameters
      if (!config?.clientId) {
        appSdk.notifier.error('Klaviyo Client ID is required');
        return false;
      }

      if (!config.clientSecret) {
        appSdk.notifier.error('Klaviyo Client Secret is required');
        return false;
      }

      if (!config.redirectUri) {
        appSdk.notifier.error('Klaviyo Redirect URI is required');
        return false;
      }

      return {
        parameters: {
          installation: {
            klaviyoClientId: config.clientId,
            klaviyoClientSecret: config.clientSecret,
            klaviyoRedirectUri: config.redirectUri,
          },
        },
        targetState: {
          EditorInterface: {},
        },
      };
    });

    appSdk.app.setReady();
  }, [config]);

  // Add message listener for OAuth callback completion
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Check if the message is from our OAuth callback
      if (event.data && event.data.type === 'KLAVIYO_AUTH_COMPLETE') {
        console.log('Received OAuth completion message:', event.data);

        if (event.data.success) {
          setIsAuthorized(true);
          setConnecting(false);
          setErrorMessage(null);
          sdk.notifier.success('Successfully connected to Klaviyo!');
        } else {
          setConnecting(false);
          setErrorMessage(`Authentication failed: ${event.data.error || 'Unknown error'}`);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [sdk]);

  return (
    <Box maxWidth="768px" style={{ margin: '0 auto' }} padding="spacingL">
      <Stack
        flexDirection="column"
        spacing="spacingS"
        style={{
          maxWidth: '768px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
        <Box style={containerStyle}>
          <Box style={sectionStyle}>
            <Flex alignItems="flex-start" marginBottom="spacingS">
              <Box style={stepIndicatorStyle}>1</Box>
              <Heading>Create Klaviyo OAuth App</Heading>
            </Flex>
            <Paragraph>Before connecting, you need to create an OAuth app in Klaviyo:</Paragraph>
            <ol style={{ marginLeft: '20px' }}>
              <li>
                Go to{' '}
                <TextLink
                  href="https://www.klaviyo.com/manage-apps"
                  target="_blank"
                  rel="noopener noreferrer">
                  Klaviyo Manage Apps
                </TextLink>
              </li>
              <li>Click "Create a Custom API OAuth App"</li>
              <li>
                Add the following Redirect URI:
                <Box
                  marginY="spacingXs"
                  padding="spacingXs"
                  style={{
                    backgroundColor: '#f7f9fa',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    borderRadius: '4px',
                  }}>
                  {getProxyRedirectUri()}
                </Box>
              </li>
              <li>
                Select the following scopes:
                <Box
                  marginY="spacingXs"
                  padding="spacingXs"
                  style={{
                    backgroundColor: '#f7f9fa',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    borderRadius: '4px',
                  }}>
                  accounts:read, metrics:read, profiles:read, profiles:write, lists:read,
                  lists:write, templates:read, templates:write
                </Box>
              </li>
              <li>Copy your Client ID and Client Secret to the fields below</li>
            </ol>
            <Box style={dividerStyle} />
          </Box>

          <Box style={sectionStyle}>
            <Flex alignItems="flex-start" marginBottom="spacingS">
              <Box style={stepIndicatorStyle}>2</Box>
              <Heading>Configure access</Heading>
            </Flex>
            <Paragraph marginBottom="spacingS">
              Enter your Klaviyo OAuth credentials to authenticate the connection between Contentful
              and Klaviyo.
            </Paragraph>

            <Form style={{ marginTop: '1rem' }}>
              <FormControl>
                <FormControl.Label>Klaviyo OAuth Configuration</FormControl.Label>
                <Flex flexDirection="column" gap="spacingM" style={{ marginTop: '0.5rem' }}>
                  <FormControl>
                    <FormControl.Label>Client ID</FormControl.Label>
                    <TextInput
                      value={config?.clientId || ''}
                      onChange={(e) => {
                        setConfig((prev) => (prev ? { ...prev, clientId: e.target.value } : null));
                      }}
                      placeholder="Enter your Klaviyo OAuth Client ID"
                      width="full"
                    />
                  </FormControl>

                  <FormControl>
                    <FormControl.Label>Client Secret</FormControl.Label>
                    <TextInput
                      value={config?.clientSecret || ''}
                      onChange={(e) => {
                        setConfig((prev) =>
                          prev ? { ...prev, clientSecret: e.target.value } : null
                        );
                      }}
                      placeholder="Enter your Klaviyo OAuth Client Secret"
                      type="password"
                      width="full"
                    />
                  </FormControl>

                  <FormControl>
                    <FormControl.Label>Redirect URI</FormControl.Label>
                    <TextInput
                      value={config?.redirectUri || ''}
                      onChange={(e) => {
                        setConfig((prev) =>
                          prev ? { ...prev, redirectUri: e.target.value } : null
                        );
                      }}
                      placeholder="Enter the OAuth Redirect URI"
                      width="full"
                    />
                    <FormControl.HelpText>
                      This should match a redirect URI registered in your Klaviyo OAuth app
                    </FormControl.HelpText>
                  </FormControl>
                </Flex>
              </FormControl>

              <Box marginTop="spacingM">
                <FormControl>
                  <FormControl.Label>Connection Status</FormControl.Label>
                  <Flex flexDirection="column" gap="spacingS" style={{ marginTop: '0.5rem' }}>
                    {isAuthorized ? (
                      <>
                        <Paragraph>✅ Connected to Klaviyo</Paragraph>
                        <Button
                          variant="negative"
                          onClick={handleDisconnect}
                          isLoading={connecting}
                          isDisabled={connecting}>
                          Disconnect from Klaviyo
                        </Button>
                      </>
                    ) : (
                      <>
                        <Paragraph>❌ Not connected to Klaviyo</Paragraph>
                        <Button
                          variant="primary"
                          onClick={handleConnect}
                          isLoading={connecting}
                          isDisabled={
                            connecting ||
                            !config ||
                            !config.clientId ||
                            !config.clientSecret ||
                            !config.redirectUri
                          }>
                          Connect to Klaviyo
                        </Button>
                        {(!config ||
                          !config.clientId ||
                          !config.clientSecret ||
                          !config.redirectUri) && (
                          <FormControl.HelpText>
                            Please fill in all OAuth credentials above and save the configuration
                            before connecting.
                          </FormControl.HelpText>
                        )}
                        {authUrl && (
                          <Box marginTop="spacingS">
                            <Paragraph fontColor="gray700" fontSize="fontSizeS">
                              If the popup was blocked, you can manually authorize by clicking this
                              link:
                            </Paragraph>
                            <TextLink href={authUrl} target="_blank" rel="noopener noreferrer">
                              Authorize in Klaviyo
                            </TextLink>
                            <Paragraph
                              fontColor="gray700"
                              fontSize="fontSizeS"
                              marginTop="spacingXs">
                              After authorization, return to this window and refresh the page to
                              check connection status.
                            </Paragraph>
                          </Box>
                        )}
                      </>
                    )}
                  </Flex>
                </FormControl>
              </Box>
            </Form>
            <Box style={dividerStyle} />
          </Box>

          <Box style={sectionStyle}>
            <Flex alignItems="flex-start" marginBottom="spacingS">
              <Box style={stepIndicatorStyle}>3</Box>
              <Heading>Set up rules</Heading>
            </Flex>
            <Paragraph>
              Configure how content should be synced from Contentful to Klaviyo. Define field
              mappings and content transformation rules.
            </Paragraph>
            {mappings.length > 0 ? (
              <Box marginTop="spacingS">
                <Text fontWeight="fontWeightMedium">Current mappings: {mappings.length}</Text>
                <Text>Your content mappings are configured and ready to use.</Text>
              </Box>
            ) : (
              <Box marginTop="spacingS">
                <Text>
                  No content mappings configured yet. Add mappings from the content entry sidebar.
                </Text>
              </Box>
            )}
            <Box style={dividerStyle} />
          </Box>

          <Box style={sectionStyle}>
            <Flex alignItems="flex-start" marginBottom="spacingS">
              <Heading>Disclaimer</Heading>
            </Flex>
            <Paragraph>
              This app syncs content from Contentful to Klaviyo through secure API connections. Make
              sure you have the necessary permissions in both Contentful and Klaviyo before using
              this integration.
            </Paragraph>
            <Box style={dividerStyle} />
          </Box>

          <Box style={sectionStyle}>
            <Flex alignItems="flex-start" marginBottom="spacingS">
              <Heading>Additional section</Heading>
            </Flex>
            <Paragraph>
              Need more help? Check out our documentation or contact support for assistance with
              setting up and using the Klaviyo integration.
            </Paragraph>
          </Box>
        </Box>

        <Box style={sectionStyle}>
          <Flex alignItems="flex-start" marginBottom="spacingS">
            <Box style={stepIndicatorStyle}>4</Box>
            <Heading>Connection Status & Debugging</Heading>
          </Flex>
          <Paragraph>Use these options to check or troubleshoot your Klaviyo connection.</Paragraph>

          <Flex marginTop="spacingM" gap="spacingM">
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  setConnecting(true);
                  setErrorMessage(null);
                  const result = await checkOAuthTokens();

                  if (result.hasTokens && !result.isExpired && result.validationResult.success) {
                    sdk.notifier.success('Connection to Klaviyo is active and working correctly');
                    setIsAuthorized(true);
                  } else if (result.hasTokens && result.isExpired) {
                    sdk.notifier.error(`Connection expired. Please reconnect to Klaviyo.`);
                    setIsAuthorized(false);
                  } else if (!result.hasTokens) {
                    sdk.notifier.error('Not connected to Klaviyo. Please connect first.');
                    setIsAuthorized(false);
                  } else {
                    sdk.notifier.error(
                      `Connection test failed: ${result.validationResult.error || 'Unknown error'}`
                    );
                    setIsAuthorized(false);
                  }
                } catch (error) {
                  console.error('Error testing connection:', error);
                  setErrorMessage(
                    `Connection test failed: ${
                      error instanceof Error ? error.message : 'Unknown error'
                    }`
                  );
                } finally {
                  setConnecting(false);
                }
              }}
              isDisabled={connecting}>
              Test Connection
            </Button>

            <Button
              variant="negative"
              onClick={() => {
                clearOAuthTokens();
                setIsAuthorized(false);
                sdk.notifier.success(
                  'OAuth tokens cleared. You will need to reconnect to Klaviyo.'
                );
              }}
              isDisabled={connecting || !isAuthorized}>
              Reset Connection
            </Button>
          </Flex>

          <Box style={dividerStyle} />
        </Box>

        <Box marginTop="spacingM">
          <Text
            marginTop="spacingS"
            fontColor="gray600"
            fontSize="fontSizeS"
            style={{ textAlign: 'center' }}>
            {errorMessage}
          </Text>
        </Box>
      </Stack>
    </Box>
  );
};

export default ConfigScreen;
