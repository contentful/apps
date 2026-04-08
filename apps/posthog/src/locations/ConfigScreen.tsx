import { useCallback, useState, useEffect, ChangeEvent } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Heading,
  Form,
  Paragraph,
  Flex,
  Box,
  FormControl,
  TextInput,
  Select,
  Note,
  Button,
  IconButton,
  Table,
  TextLink,
  Subheading,
  Stack,
  Spinner,
  Badge,
} from '@contentful/f36-components';
import {
  PlusIcon,
  DeleteIcon,
  ExternalLinkIcon,
  CheckCircleIcon,
  ErrorCircleIcon,
} from '@contentful/f36-icons';
import { css } from 'emotion';
import { useSDK, useCMA } from '@contentful/react-apps-toolkit';
import { AppInstallationParameters, UrlMapping } from '../types';
import { styles as sharedStyles } from './ConfigScreen.styles';

// Re-export types for backwards compatibility
export type { AppInstallationParameters, UrlMapping } from '../types';

// ============================================================================
// Constants
// ============================================================================

const POSTHOG_HOSTS = [
  { value: 'https://us.posthog.com', label: 'US Cloud (us.posthog.com)' },
  { value: 'https://eu.posthog.com', label: 'EU Cloud (eu.posthog.com)' },
  { value: 'custom', label: 'Custom (Self-hosted)' },
] as const;

// Local styles specific to this component
const styles = {
  // Use shared body style for main container
  container: sharedStyles.body,
  section: sharedStyles.section,
  splitter: css({
    border: 'none',
    borderTop: '1px solid #e5e5e5',
    margin: '32px 0',
  }),
  mappingTable: css({
    marginTop: '16px',
  }),
  deleteButton: css({
    opacity: 0.6,
    '&:hover': {
      opacity: 1,
    },
  }),
  helpTextLink: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  }),
};

// ============================================================================
// Helper: Censor API Key for Display
// ============================================================================

const censorApiKey = (key: string): string => {
  if (!key || key.length < 8) return key;
  return `${key.slice(0, 4)}${'•'.repeat(Math.min(key.length - 8, 20))}${key.slice(-4)}`;
};

// ============================================================================
// Component
// ============================================================================

// Connection status type
type ConnectionStatus = 'untested' | 'testing' | 'success' | 'error';

interface ConnectionResult {
  projectName?: string;
  organizationName?: string;
  errorMessage?: string;
}

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const cma = useCMA();

  // State
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    urlMappings: [],
  });
  const [isPersonalKeyEditing, setIsPersonalKeyEditing] = useState(false);
  const [isProjectKeyEditing, setIsProjectKeyEditing] = useState(false);
  const [showCustomHost, setShowCustomHost] = useState(false);
  const [customHostValue, setCustomHostValue] = useState('');

  // Connection test state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('untested');
  const [connectionResult, setConnectionResult] = useState<ConnectionResult | null>(null);

  // ========================================================================
  // Configuration Save Handler
  // ========================================================================

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    // Validation
    if (!parameters.personalApiKey?.trim()) {
      sdk.notifier.error('Personal API Key is required');
      return false;
    }

    if (!parameters.projectId?.trim()) {
      sdk.notifier.error('Project ID is required');
      return false;
    }

    if (!parameters.posthogHost?.trim()) {
      sdk.notifier.error('PostHog Host is required');
      return false;
    }

    // Validate URL patterns
    const invalidMappings = (parameters.urlMappings || []).filter(
      (m) => m.contentTypeId && !m.urlPattern.includes('{slug}')
    );
    if (invalidMappings.length > 0) {
      sdk.notifier.error('URL patterns must include {slug} placeholder');
      return false;
    }

    return {
      parameters: {
        ...parameters,
        // Clean up empty mappings
        urlMappings: (parameters.urlMappings || []).filter(
          (m) => m.contentTypeId.trim() && m.urlPattern.trim()
        ),
      },
      targetState: currentState,
    };
  }, [parameters, sdk]);

  // ========================================================================
  // Initialization
  // ========================================================================

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters({
          ...currentParameters,
          urlMappings: currentParameters.urlMappings || [],
        });

        // Check if custom host is selected
        const isStandardHost = POSTHOG_HOSTS.slice(0, -1).some(
          (h) => h.value === currentParameters.posthogHost
        );
        if (currentParameters.posthogHost && !isStandardHost) {
          setShowCustomHost(true);
          setCustomHostValue(currentParameters.posthogHost);
        }
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  // ========================================================================
  // Parameter Update Handlers
  // ========================================================================

  const updateParameter = <K extends keyof AppInstallationParameters>(
    key: K,
    value: AppInstallationParameters[K]
  ) => {
    setParameters((prev) => ({ ...prev, [key]: value }));
  };

  const handleHostChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'custom') {
      setShowCustomHost(true);
      updateParameter('posthogHost', customHostValue || '');
    } else {
      setShowCustomHost(false);
      updateParameter('posthogHost', value);
    }
  };

  const handleCustomHostChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomHostValue(value);
    updateParameter('posthogHost', value);
  };

  // ========================================================================
  // URL Mapping Handlers
  // ========================================================================

  const addUrlMapping = () => {
    setParameters((prev) => ({
      ...prev,
      urlMappings: [...(prev.urlMappings || []), { contentTypeId: '', urlPattern: '' }],
    }));
  };

  const updateUrlMapping = (index: number, field: keyof UrlMapping, value: string) => {
    setParameters((prev) => {
      const mappings = [...(prev.urlMappings || [])];
      mappings[index] = { ...mappings[index], [field]: value };
      return { ...prev, urlMappings: mappings };
    });
  };

  const removeUrlMapping = (index: number) => {
    setParameters((prev) => ({
      ...prev,
      urlMappings: (prev.urlMappings || []).filter((_, i) => i !== index),
    }));
  };

  // ========================================================================
  // Connection Test Handler
  // ========================================================================

  const testConnection = async () => {
    // Validate required fields before testing
    if (!parameters.personalApiKey?.trim()) {
      sdk.notifier.error('Please enter a Personal API Key first');
      return;
    }
    if (!parameters.projectId?.trim()) {
      sdk.notifier.error('Please enter a Project ID first');
      return;
    }
    if (!parameters.posthogHost?.trim()) {
      sdk.notifier.error('Please select a PostHog Host first');
      return;
    }

    setConnectionStatus('testing');
    setConnectionResult(null);

    try {
      const response = await cma.appActionCall.createWithResponse(
        {
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
          appDefinitionId: sdk.ids.app!,
          appActionId: 'validateConnection',
        },
        {
          parameters: {
            apiKey: parameters.personalApiKey,
            projectId: parameters.projectId,
            host: parameters.posthogHost,
          },
        }
      );

      const result = JSON.parse(response.response.body);

      if (result.success) {
        setConnectionStatus('success');
        setConnectionResult({
          projectName: result.data.projectName,
          organizationName: result.data.organizationName,
        });
        sdk.notifier.success(`Connected to project: ${result.data.projectName}`);
      } else {
        setConnectionStatus('error');
        setConnectionResult({
          errorMessage: result.error?.message || 'Connection failed',
        });
        sdk.notifier.error(result.error?.message || 'Connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      setConnectionResult({ errorMessage });
      sdk.notifier.error(errorMessage);
    }
  };

  // Reset connection status when credentials change
  useEffect(() => {
    if (connectionStatus !== 'untested') {
      setConnectionStatus('untested');
      setConnectionResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parameters.personalApiKey, parameters.projectId, parameters.posthogHost]);

  // ========================================================================
  // Render
  // ========================================================================

  const currentHostValue = showCustomHost
    ? 'custom'
    : POSTHOG_HOSTS.find((h) => h.value === parameters.posthogHost)?.value || '';

  return (
    <Flex flexDirection="column" className={styles.container}>
      {/* Header Section */}
      <Box className={styles.section}>
        <Heading marginBottom="spacingM">PostHog Analytics</Heading>
        <Paragraph>
          Connect PostHog to Contentful to view real-time analytics, session replays, and feature
          flag status directly in your entry sidebar.
        </Paragraph>
      </Box>

      <hr className={styles.splitter} />

      {/* API Configuration Section */}
      <Box className={styles.section}>
        <Form>
          <Subheading marginBottom="spacingM">API Configuration</Subheading>

          {/* Project API Key (Public) */}
          <FormControl marginBottom="spacingL">
            <FormControl.Label>Project API Key (Public)</FormControl.Label>
            {isProjectKeyEditing ? (
              <TextInput
                value={parameters.projectApiKey || ''}
                type="text"
                name="projectApiKey"
                placeholder="phc_..."
                onChange={(e) => updateParameter('projectApiKey', e.target.value)}
                onBlur={() => setIsProjectKeyEditing(false)}
                autoFocus
              />
            ) : (
              <TextInput
                isReadOnly
                value={parameters.projectApiKey ? censorApiKey(parameters.projectApiKey) : ''}
                type="text"
                name="projectApiKey"
                placeholder="phc_..."
                onClick={() => setIsProjectKeyEditing(true)}
              />
            )}
            <FormControl.HelpText>
              <span className={styles.helpTextLink}>
                The Project API Key (public key) from your PostHog project settings. Find it in{' '}
                <TextLink
                  href="https://posthog.com/docs/getting-started/install"
                  target="_blank"
                  rel="noopener noreferrer">
                  Project Settings → Project API Key
                  <ExternalLinkIcon size="tiny" />
                </TextLink>
              </span>
            </FormControl.HelpText>
          </FormControl>

          {/* Personal API Key (Private) */}
          <FormControl marginBottom="spacingL" isRequired>
            <FormControl.Label>Personal API Key</FormControl.Label>
            {isPersonalKeyEditing ? (
              <TextInput
                value={parameters.personalApiKey || ''}
                type="password"
                name="personalApiKey"
                placeholder="phx_..."
                onChange={(e) => updateParameter('personalApiKey', e.target.value)}
                onBlur={() => setIsPersonalKeyEditing(false)}
                autoFocus
              />
            ) : (
              <TextInput
                isReadOnly
                value={parameters.personalApiKey ? censorApiKey(parameters.personalApiKey) : ''}
                type="text"
                name="personalApiKey"
                placeholder="phx_..."
                onClick={() => setIsPersonalKeyEditing(true)}
              />
            )}
            <FormControl.HelpText>
              <span className={styles.helpTextLink}>
                Create a Personal API Key in{' '}
                <TextLink
                  href="https://posthog.com/docs/api/overview#personal-api-keys"
                  target="_blank"
                  rel="noopener noreferrer">
                  User Settings → Personal API Keys
                  <ExternalLinkIcon size="tiny" />
                </TextLink>
              </span>
            </FormControl.HelpText>
          </FormControl>

          {/* Security Warning */}
          <Note variant="warning" title="Security: Use Minimal Permissions">
            Create a specific Personal API Key with <strong>only</strong> the following scopes:
            <ul style={{ margin: '8px 0 0 16px', paddingLeft: '8px' }}>
              <li>
                <strong>Project Read</strong> — View project data
              </li>
              <li>
                <strong>Query Read</strong> — Execute HogQL queries
              </li>
              <li>
                <strong>Session Recording Read</strong> — View session replays
              </li>
            </ul>
            <Paragraph marginTop="spacingS" marginBottom="none" style={{ fontWeight: 500 }}>
              ⚠️ Do not use a key with Write permissions.
            </Paragraph>
          </Note>

          {/* Project ID */}
          <FormControl marginTop="spacingL" marginBottom="spacingL" isRequired>
            <FormControl.Label>Project ID</FormControl.Label>
            <TextInput
              value={parameters.projectId || ''}
              type="text"
              name="projectId"
              placeholder="12345"
              onChange={(e) => updateParameter('projectId', e.target.value)}
            />
            <FormControl.HelpText>
              The numeric Project ID from your PostHog URL (e.g., us.posthog.com/project/
              <strong>12345</strong>)
            </FormControl.HelpText>
          </FormControl>

          {/* PostHog Host */}
          <FormControl marginBottom="spacingL" isRequired>
            <FormControl.Label>PostHog Host</FormControl.Label>
            <Select value={currentHostValue} onChange={handleHostChange} name="posthogHost">
              <Select.Option value="">Select a host...</Select.Option>
              {POSTHOG_HOSTS.map((host) => (
                <Select.Option key={host.value} value={host.value}>
                  {host.label}
                </Select.Option>
              ))}
            </Select>
            {showCustomHost && (
              <Box marginTop="spacingS">
                <TextInput
                  value={customHostValue}
                  type="url"
                  name="customPosthogHost"
                  placeholder="https://posthog.yourcompany.com"
                  onChange={handleCustomHostChange}
                />
              </Box>
            )}
            <FormControl.HelpText>
              Select your PostHog deployment region or enter a custom URL for self-hosted instances.
            </FormControl.HelpText>
          </FormControl>

          {/* Test Connection Button */}
          <Box marginBottom="spacingL">
            <Flex alignItems="center" gap="spacingM">
              <Button
                variant="secondary"
                onClick={testConnection}
                isDisabled={connectionStatus === 'testing'}
                isLoading={connectionStatus === 'testing'}>
                {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
              </Button>

              {/* Connection Status Display */}
              {connectionStatus === 'success' && connectionResult && (
                <Flex
                  alignItems="center"
                  gap="spacingXs"
                  className={sharedStyles.connectionSuccess}>
                  <CheckCircleIcon variant="positive" />
                  <span>
                    Connected to <strong>{connectionResult.projectName}</strong>
                  </span>
                </Flex>
              )}

              {connectionStatus === 'error' && connectionResult && (
                <Flex alignItems="center" gap="spacingXs" className={sharedStyles.connectionError}>
                  <ErrorCircleIcon variant="negative" />
                  <span>{connectionResult.errorMessage}</span>
                </Flex>
              )}
            </Flex>
          </Box>
        </Form>
      </Box>

      <hr className={styles.splitter} />

      {/* URL Mapping Section */}
      <Box className={styles.section}>
        <Subheading marginBottom="spacingS">URL Mapping</Subheading>
        <Paragraph marginBottom="spacingM">
          Map your Contentful Content Types to their corresponding frontend URLs. Use{' '}
          <code>{'{slug}'}</code> as a placeholder for the entry's slug field.
        </Paragraph>

        <Box marginBottom="spacingL">
          <Note variant="neutral" title="How URL Mapping Works">
            <Paragraph marginBottom="none">
              For example, if your blog posts are published at{' '}
              <code>https://example.com/blog/my-post-title</code>, set the URL pattern to{' '}
              <code>https://example.com/blog/{'{slug}'}</code>. The app will replace{' '}
              <code>{'{slug}'}</code> with the entry's slug field value.
            </Paragraph>
          </Note>
        </Box>

        {/* URL Mappings Table */}
        {(parameters.urlMappings || []).length > 0 && (
          <Table className={styles.mappingTable}>
            <Table.Head>
              <Table.Row>
                <Table.Cell>Content Type ID</Table.Cell>
                <Table.Cell>URL Pattern</Table.Cell>
                <Table.Cell width="60px" />
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {(parameters.urlMappings || []).map((mapping, index) => (
                <Table.Row key={index}>
                  <Table.Cell>
                    <TextInput
                      value={mapping.contentTypeId}
                      placeholder="blogPost"
                      size="small"
                      onChange={(e) => updateUrlMapping(index, 'contentTypeId', e.target.value)}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <TextInput
                      value={mapping.urlPattern}
                      placeholder="https://example.com/blog/{slug}"
                      size="small"
                      onChange={(e) => updateUrlMapping(index, 'urlPattern', e.target.value)}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <IconButton
                      variant="transparent"
                      aria-label="Remove mapping"
                      icon={<DeleteIcon />}
                      size="small"
                      className={styles.deleteButton}
                      onClick={() => removeUrlMapping(index)}
                    />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}

        {/* Add Mapping Button */}
        <Stack marginTop="spacingM">
          <Button variant="secondary" size="small" startIcon={<PlusIcon />} onClick={addUrlMapping}>
            Add URL Mapping
          </Button>
        </Stack>
      </Box>

      <hr className={styles.splitter} />

      {/* Help Section */}
      <Box className={styles.section}>
        <Subheading marginBottom="spacingS">Need Help?</Subheading>
        <Stack flexDirection="column" spacing="spacingS">
          <TextLink href="https://posthog.com/docs/api" target="_blank" rel="noopener noreferrer">
            PostHog API Documentation
            <ExternalLinkIcon size="tiny" style={{ marginLeft: '4px' }} />
          </TextLink>
          <TextLink href="https://posthog.com/docs/hogql" target="_blank" rel="noopener noreferrer">
            HogQL Query Language
            <ExternalLinkIcon size="tiny" style={{ marginLeft: '4px' }} />
          </TextLink>
          <TextLink
            href="https://posthog.com/docs/session-replay"
            target="_blank"
            rel="noopener noreferrer">
            Session Replay Documentation
            <ExternalLinkIcon size="tiny" style={{ marginLeft: '4px' }} />
          </TextLink>
        </Stack>
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
