import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Autocomplete,
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Form,
  FormControl,
  Heading,
  Note,
  Paragraph,
  Pill,
  Select,
  Spinner,
  Subheading,
  TextInput,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import ContentTypeMultiSelect from '../components/ContentTypeMultiSelect';
import { VALIDATION_MESSAGES } from '../const';
import {
  AppInstallationParameters,
  AsanaProject,
  AsanaWorkspace,
  ConnectionStatus,
  ContentTypeOption,
  ExchangeAsanaOAuthCodeResponse,
  GetAsanaProjectsResponse,
  GetAsanaWorkspacesResponse,
  PrimaryTaskLinkFieldMapping,
  ValidateAsanaCredentialsResponse,
} from '../types';
import { buildEditorInterfaceTargetState, EditorInterfaceState } from '../utils/editorInterface';
import { generateOAuthState, generatePkcePair, getOAuthRedirectUri } from '../utils/oauth';
import { getDefaultPrimaryTaskLinkMapping } from '../utils/primaryTaskLink';

const OAUTH_SESSION_KEY = 'asana-oauth-pending';

const emptyParameters: AppInstallationParameters = {
  oauthClientId: '',
  oauthClientSecret: '',
  oauthRefreshToken: '',
  oauthRedirectUri: '',
  defaultWorkspaceGid: '',
  defaultWorkspaceName: '',
  defaultProjectGid: '',
  defaultProjectName: '',
  connectionStatus: ConnectionStatus.None,
  connectionMessage: '',
};

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<AppInstallationParameters>(emptyParameters);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [workspaces, setWorkspaces] = useState<AsanaWorkspace[]>([]);
  const [projects, setProjects] = useState<AsanaProject[]>([]);
  const [availableContentTypes, setAvailableContentTypes] = useState<ContentTypeOption[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentTypeOption[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [transientAccessToken, setTransientAccessToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const setConnectionState = (status: ConnectionStatus, message: string) => {
    setParameters((prev) => ({
      ...prev,
      connectionStatus: status,
      connectionMessage: message,
    }));
  };

  const callAction = async <TResult,>(
    appActionId: string,
    actionParameters: Record<string, string> = {}
  ): Promise<TResult> => {
    const response = await sdk.cma.appActionCall.createWithResponse(
      { appDefinitionId: sdk.ids.app!, appActionId },
      { parameters: actionParameters }
    );

    return JSON.parse(response.response.body) as TResult;
  };

  const validateCredentialsEntered = (): boolean => {
    return Boolean(parameters.oauthClientId.trim() && parameters.oauthClientSecret.trim());
  };

  const validateRequiredFields = (): boolean => {
    if (
      parameters.oauthClientId.trim() &&
      parameters.oauthClientSecret.trim() &&
      parameters.oauthRefreshToken.trim()
    ) {
      setErrors({});
      return true;
    }

    setErrors({ oauthClientId: VALIDATION_MESSAGES.tokenRequired });
    return false;
  };

  const loadContentTypes = async (): Promise<ContentTypeOption[]> => {
    const response = await sdk.cma.contentType.getMany({});

    return response.items.map((contentType) => ({
      id: contentType.sys.id,
      name: contentType.name,
      fields: contentType.fields.map((field) => ({
        id: field.id,
        name: field.name,
        type: field.type,
      })),
    }));
  };

  const buildPrimaryTaskLinkMappings = (
    contentTypes: ContentTypeOption[]
  ): Record<string, PrimaryTaskLinkFieldMapping> => {
    return contentTypes.reduce<Record<string, PrimaryTaskLinkFieldMapping>>(
      (mappings, contentType) => {
        const mapping = getDefaultPrimaryTaskLinkMapping(contentType.fields);

        if (mapping) {
          mappings[contentType.id] = mapping;
        }

        return mappings;
      },
      {}
    );
  };

  const loadProjects = async (workspaceGid: string, accessTokenOverride?: string) => {
    if (!workspaceGid) {
      setProjects([]);
      return;
    }

    setIsLoadingProjects(true);
    try {
      const data = await callAction<GetAsanaProjectsResponse>('getAsanaProjectsAction', {
        workspaceGid,
        accessToken: accessTokenOverride ?? transientAccessToken ?? '',
      });
      setProjects(data.projects);
    } catch {
      sdk.notifier.error(VALIDATION_MESSAGES.projectsFailed);
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const loadWorkspaces = async (accessTokenOverride?: string) => {
    setIsLoadingWorkspaces(true);
    try {
      const data = await callAction<GetAsanaWorkspacesResponse>('getAsanaWorkspacesAction', {
        accessToken: accessTokenOverride ?? transientAccessToken ?? '',
      });
      setWorkspaces(data.workspaces);
      return data.workspaces;
    } catch {
      sdk.notifier.error(VALIDATION_MESSAGES.workspacesFailed);
      setWorkspaces([]);
      return [];
    } finally {
      setIsLoadingWorkspaces(false);
    }
  };

  const hydrateSavedOptions = async (savedParameters: AppInstallationParameters) => {
    if (!savedParameters.oauthRefreshToken.trim()) {
      return;
    }

    const loadedWorkspaces = await loadWorkspaces();
    const selectedWorkspaceGid = savedParameters.defaultWorkspaceGid;

    if (
      selectedWorkspaceGid &&
      loadedWorkspaces.some((workspace) => workspace.gid === selectedWorkspaceGid)
    ) {
      await loadProjects(selectedWorkspaceGid);
    }
  };

  useEffect(() => {
    sdk.app.onConfigure(async () => {
      if (!validateRequiredFields()) {
        sdk.notifier.error(VALIDATION_MESSAGES.saveRequired);
        return false;
      }

      const currentState = (await sdk.app.getCurrentState()) as {
        EditorInterface?: Record<
          string,
          {
            sidebar?: { position: number };
            editors?: { position: number };
            controls?: Array<{ fieldId: string; settings?: Record<string, unknown> }>;
          }
        >;
      } | null;

      const currentEditorInterface = (currentState?.EditorInterface ?? {}) as EditorInterfaceState;
      const selectedIds = new Set(selectedContentTypes.map((contentType) => contentType.id));
      const primaryTaskLinkMappings = buildPrimaryTaskLinkMappings(selectedContentTypes);

      return {
        parameters: {
          ...parameters,
          enabledContentTypeIds: [...selectedIds],
          primaryTaskLinkMappings,
        },
        targetState: {
          EditorInterface: buildEditorInterfaceTargetState(
            currentEditorInterface,
            [...selectedIds],
            primaryTaskLinkMappings
          ),
        },
      };
    });

    sdk.app.onConfigurationCompleted((error) => {
      if (error) {
        sdk.notifier.error(VALIDATION_MESSAGES.saveFailed);
      }
    });
  }, [parameters, sdk, selectedContentTypes]);

  useEffect(() => {
    (async () => {
      const [currentParameters, installed, currentState, contentTypes] = await Promise.all([
        sdk.app.getParameters<AppInstallationParameters>(),
        sdk.app.isInstalled(),
        sdk.app.getCurrentState(),
        loadContentTypes(),
      ]);

      const nextParameters = currentParameters
        ? { ...emptyParameters, ...currentParameters }
        : emptyParameters;

      setParameters(nextParameters);
      setIsInstalled(installed);
      setAvailableContentTypes(contentTypes);

      const selectedIds = nextParameters.enabledContentTypeIds?.length
        ? nextParameters.enabledContentTypeIds
        : Object.keys(
            (currentState as { EditorInterface?: Record<string, unknown> } | null)
              ?.EditorInterface ?? {}
          );
      setSelectedContentTypes(
        contentTypes.filter((contentType) => selectedIds.includes(contentType.id))
      );

      await hydrateSavedOptions(nextParameters);
      sdk.app.setReady();
    })();
  }, [sdk]);

  const resetConnectionState = (updates: Partial<AppInstallationParameters>) => {
    setParameters((prev) => ({
      ...prev,
      ...updates,
      oauthRefreshToken: '',
      connectionStatus: ConnectionStatus.None,
      connectionMessage: '',
      defaultWorkspaceGid: '',
      defaultWorkspaceName: '',
      defaultProjectGid: '',
      defaultProjectName: '',
    }));
    setTransientAccessToken('');
    setWorkspaces([]);
    setProjects([]);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.oauthClientId;
      return next;
    });
  };

  const handleClientIdChange = (value: string) => {
    resetConnectionState({ oauthClientId: value });
  };

  const handleClientSecretChange = (value: string) => {
    resetConnectionState({ oauthClientSecret: value });
  };

  const handleWorkspaceChange = async (workspaceGid: string) => {
    const selectedWorkspace =
      workspaces.find((workspace) => workspace.gid === workspaceGid) ?? null;

    setParameters((prev) => ({
      ...prev,
      defaultWorkspaceGid: workspaceGid,
      defaultWorkspaceName: selectedWorkspace?.name ?? '',
      defaultProjectGid: '',
      defaultProjectName: '',
    }));
    setProjects([]);
    setProjectSearchQuery('');

    if (workspaceGid) {
      await loadProjects(workspaceGid);
    }
  };

  const handleProjectChange = (projectGid: string) => {
    const selectedProject = projects.find((project) => project.gid === projectGid) ?? null;
    setParameters((prev) => ({
      ...prev,
      defaultProjectGid: projectGid,
      defaultProjectName: selectedProject?.name ?? '',
    }));
    setProjectSearchQuery('');
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(projectSearchQuery.toLowerCase())
  );

  const selectedProject =
    projects.find((project) => project.gid === parameters.defaultProjectGid) ?? null;

  const testConnection = async () => {
    if (!parameters.oauthRefreshToken.trim() && !transientAccessToken.trim()) {
      sdk.notifier.error(VALIDATION_MESSAGES.connectionRequired);
      return;
    }

    const installed = await sdk.app.isInstalled();
    if (!installed) {
      sdk.notifier.error(VALIDATION_MESSAGES.installRequired);
      return;
    }

    setConnectionState(ConnectionStatus.Testing, '');

    try {
      const data = await callAction<ValidateAsanaCredentialsResponse>(
        'validateAsanaCredentialsAction',
        { accessToken: transientAccessToken || '' }
      );

      const nextStatus = data.valid ? ConnectionStatus.Success : ConnectionStatus.Error;
      setConnectionState(nextStatus, data.message);

      if (data.valid) {
        await loadWorkspaces(transientAccessToken);
      } else {
        setWorkspaces([]);
        setProjects([]);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : VALIDATION_MESSAGES.invalidCredentials;
      setConnectionState(ConnectionStatus.Error, message);
      setWorkspaces([]);
      setProjects([]);
    }
  };

  const connectToAsana = async () => {
    if (!validateCredentialsEntered()) {
      setErrors({ oauthClientId: VALIDATION_MESSAGES.oauthCredentialsRequired });
      sdk.notifier.error(VALIDATION_MESSAGES.oauthCredentialsRequired);
      return;
    }

    setIsConnecting(true);
    try {
      const { codeVerifier, codeChallenge } = await generatePkcePair();
      const state = generateOAuthState();
      const redirectUri = getOAuthRedirectUri();
      sessionStorage.setItem(
        OAUTH_SESSION_KEY,
        JSON.stringify({ state, codeVerifier, redirectUri })
      );

      const authorizeUrl = new URL('https://app.asana.com/-/oauth_authorize');
      authorizeUrl.searchParams.set('client_id', parameters.oauthClientId);
      authorizeUrl.searchParams.set('redirect_uri', redirectUri);
      authorizeUrl.searchParams.set('response_type', 'code');
      authorizeUrl.searchParams.set('state', state);
      authorizeUrl.searchParams.set('code_challenge', codeChallenge);
      authorizeUrl.searchParams.set('code_challenge_method', 'S256');

      const popup = window.open(authorizeUrl.toString(), 'asana-oauth', 'width=600,height=700');
      if (!popup) {
        setIsConnecting(false);
        sdk.notifier.error(VALIDATION_MESSAGES.popupBlocked);
      }
    } catch {
      setIsConnecting(false);
      sdk.notifier.error('Could not start the Asana connection.');
    }
  };

  useEffect(() => {
    const onMessage = async (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.data?.source !== 'asana-oauth-callback'
      ) {
        return;
      }

      setIsConnecting(false);

      const saved = sessionStorage.getItem(OAUTH_SESSION_KEY);
      sessionStorage.removeItem(OAUTH_SESSION_KEY);

      const { code, state, error } = event.data as {
        code?: string;
        state?: string;
        error?: string;
      };
      if (error) {
        sdk.notifier.error(`Asana denied the connection: ${error}`);
        return;
      }
      if (!saved || !code || !state) {
        sdk.notifier.error('The Asana connection response was invalid. Please try again.');
        return;
      }

      const {
        state: expectedState,
        codeVerifier,
        redirectUri,
      } = JSON.parse(saved) as { state: string; codeVerifier: string; redirectUri: string };
      if (state !== expectedState) {
        sdk.notifier.error(
          'The Asana connection response failed a security check. Please try again.'
        );
        return;
      }

      try {
        const result = await callAction<ExchangeAsanaOAuthCodeResponse>(
          'exchangeAsanaOAuthCodeAction',
          {
            code,
            codeVerifier,
            redirectUri,
            clientId: parameters.oauthClientId,
            clientSecret: parameters.oauthClientSecret,
          }
        );

        if (!result.success) {
          setConnectionState(ConnectionStatus.Error, result.message);
          return;
        }

        setTransientAccessToken(result.accessToken ?? '');
        setParameters((prev) => ({
          ...prev,
          oauthRefreshToken: result.refreshToken ?? '',
          oauthRedirectUri: redirectUri,
        }));
        setConnectionState(ConnectionStatus.Success, result.message);
        await loadWorkspaces(result.accessToken);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not connect to Asana.';
        setConnectionState(ConnectionStatus.Error, message);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [parameters.oauthClientId, parameters.oauthClientSecret, sdk]);

  return (
    <Flex fullWidth justifyContent="center">
      <Box style={{ width: '100%', maxWidth: '820px' }}>
        <Form>
          <Heading marginBottom="spacingS">Set up the Asana app</Heading>
          <Paragraph marginBottom="spacingL">
            Configure a secure Asana connection and choose default destinations for future
            automation actions. This first version focuses on connection validation and saved
            defaults so task actions can build on a stable base.
          </Paragraph>

          <Card marginBottom="spacingL">
            <Subheading marginBottom="spacingM">Connect Asana</Subheading>
            <FormControl
              isRequired
              isInvalid={Boolean(errors.oauthClientId)}
              marginBottom="spacingM">
              <FormControl.Label>Asana OAuth client ID</FormControl.Label>
              <TextInput
                id="oauthClientId"
                name="oauthClientId"
                value={parameters.oauthClientId}
                type="password"
                onChange={(event) => handleClientIdChange(event.target.value)}
              />
            </FormControl>

            <FormControl isRequired marginBottom="spacingM">
              <FormControl.Label>Asana OAuth client secret</FormControl.Label>
              <TextInput
                id="oauthClientSecret"
                name="oauthClientSecret"
                value={parameters.oauthClientSecret}
                type="password"
                onChange={(event) => handleClientSecretChange(event.target.value)}
              />
              {errors.oauthClientId ? (
                <FormControl.ValidationMessage>
                  {errors.oauthClientId}
                </FormControl.ValidationMessage>
              ) : (
                <FormControl.HelpText>
                  Register an OAuth app in the Asana developer console, then paste its client ID and
                  secret here.
                </FormControl.HelpText>
              )}
            </FormControl>

            <Flex alignItems="center" gap="spacingM">
              <Button onClick={connectToAsana} isLoading={isConnecting}>
                {parameters.oauthRefreshToken ? 'Reconnect to Asana' : 'Connect to Asana'}
              </Button>

              {isInstalled ? (
                <Button
                  variant="secondary"
                  onClick={testConnection}
                  isLoading={parameters.connectionStatus === ConnectionStatus.Testing}>
                  Test connection
                </Button>
              ) : (
                <Note variant="warning">Install the app to test the connection.</Note>
              )}

              {parameters.connectionStatus === ConnectionStatus.Success ? (
                <Badge variant="positive">Connected</Badge>
              ) : null}
              {parameters.connectionStatus === ConnectionStatus.Error ? (
                <Badge variant="negative">Connection failed</Badge>
              ) : null}
            </Flex>

            {parameters.connectionMessage ? (
              <Box marginTop="spacingM">
                <Note
                  variant={
                    parameters.connectionStatus === ConnectionStatus.Success
                      ? 'positive'
                      : 'negative'
                  }>
                  {parameters.connectionMessage}
                </Note>
              </Box>
            ) : null}
          </Card>

          <Card marginBottom="spacingL">
            <Subheading marginBottom="spacingM">Assign content types</Subheading>
            <Paragraph marginBottom="spacingM">
              Limit the Asana sidebar experience to the content types where editors should create
              and manage linked Asana work.
            </Paragraph>
            <FormControl>
              <FormControl.Label>Enabled content types</FormControl.Label>
              <ContentTypeMultiSelect
                availableContentTypes={availableContentTypes}
                selectedContentTypes={selectedContentTypes}
                onSelectionChange={setSelectedContentTypes}
              />
              <FormControl.HelpText>
                The entry sidebar will only be assigned to the selected content types when you save
                the app configuration.
              </FormControl.HelpText>
            </FormControl>
          </Card>

          <Card>
            <Subheading marginBottom="spacingM">Default destination</Subheading>
            <Paragraph marginBottom="spacingM">
              Saved defaults make later task actions easier to configure while still allowing
              per-call overrides.
            </Paragraph>

            <FormControl marginBottom="spacingM">
              <FormControl.Label>Default workspace</FormControl.Label>
              <Select
                value={parameters.defaultWorkspaceGid}
                onChange={(event) => void handleWorkspaceChange(event.target.value)}
                isDisabled={!workspaces.length || isLoadingWorkspaces}>
                <Select.Option value="">
                  {isLoadingWorkspaces ? 'Loading workspaces...' : 'Select a workspace'}
                </Select.Option>
                {workspaces.map((workspace) => (
                  <Select.Option key={workspace.gid} value={workspace.gid}>
                    {workspace.name}
                  </Select.Option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormControl.Label>Default project</FormControl.Label>
              <Autocomplete<AsanaProject>
                items={filteredProjects}
                onInputValueChange={setProjectSearchQuery}
                onSelectItem={(item) => handleProjectChange(item.gid)}
                placeholder={
                  !parameters.defaultWorkspaceGid
                    ? 'Select a workspace first'
                    : isLoadingProjects
                      ? 'Loading projects...'
                      : 'Type to search projects'
                }
                isDisabled={!parameters.defaultWorkspaceGid || isLoadingProjects}
                itemToString={(item) => item.name}
                renderItem={(item) => item.name}
                textOnAfterSelect="clear"
                closeAfterSelect
                listWidth="full"
              />
              {selectedProject ? (
                <Box marginTop="spacingS">
                  <Paragraph marginBottom="spacing2Xs">Selected project:</Paragraph>
                  <Pill
                    label={selectedProject.name}
                    isDraggable={false}
                    onClose={() => handleProjectChange('')}
                  />
                </Box>
              ) : null}
            </FormControl>

            {isLoadingWorkspaces || isLoadingProjects ? (
              <Flex alignItems="center" gap="spacingS" marginTop="spacingM">
                <Spinner size="small" />
                <Paragraph marginBottom="none">
                  {isLoadingProjects
                    ? 'Loading projects from Asana...'
                    : 'Loading workspaces from Asana...'}
                </Paragraph>
              </Flex>
            ) : null}
          </Card>
        </Form>
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
