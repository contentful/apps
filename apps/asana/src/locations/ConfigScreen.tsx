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
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useRef, useState } from 'react';
import ContentTypeMultiSelect from '../components/ContentTypeMultiSelect';
import {
  TASK_LINK_CONTENT_TYPE_ID,
  TASK_LINK_CONTENT_TYPE_NAME,
  VALIDATION_MESSAGES,
} from '../const';
import {
  AppInstallationParameters,
  AsanaProject,
  AsanaWorkspace,
  CheckAsanaStatusResponse,
  CompleteAsanaOAuthResponse,
  ContentTypeOption,
  DisconnectAsanaResponse,
  GetAsanaProjectsResponse,
  GetAsanaWorkspacesResponse,
  InitiateAsanaOAuthResponse,
} from '../types';
import { buildEditorInterfaceTargetState, EditorInterfaceState } from '../utils/editorInterface';
import { parseInstallationParameters } from '../utils/installationParameters';
import { ensureTaskLinkContentType } from '../utils/taskLinkStore';

const emptyParameters: AppInstallationParameters = {
  defaultWorkspaceGid: '',
  defaultWorkspaceName: '',
  defaultProjectGid: '',
  defaultProjectName: '',
};

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<AppInstallationParameters>(emptyParameters);
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [workspaces, setWorkspaces] = useState<AsanaWorkspace[]>([]);
  const [projects, setProjects] = useState<AsanaProject[]>([]);
  const [availableContentTypes, setAvailableContentTypes] = useState<ContentTypeOption[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentTypeOption[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const popupWindowRef = useRef<Window | null>(null);

  const callAction = async <TResult,>(
    appActionId: string,
    actionParameters: Record<string, string> = {}
  ): Promise<TResult> => {
    // Uses createWithResult (not createWithResponse) because createWithResponse's
    // polling hits a legacy endpoint that has a call-not-found race right after
    // creation, which the currently bundled web app CMA client doesn't retry.
    const call = await sdk.cma.appActionCall.createWithResult(
      { appDefinitionId: sdk.ids.app!, appActionId },
      { parameters: actionParameters }
    );

    if (call.sys.status === 'failed') {
      throw new Error(call.sys.error.message);
    }

    if (call.sys.status !== 'succeeded') {
      throw new Error(`Unexpected app action call status: ${call.sys.status}`);
    }

    return call.sys.result as TResult;
  };

  const loadContentTypes = async (): Promise<ContentTypeOption[]> => {
    const response = await sdk.cma.contentType.getMany({});

    return response.items
      .filter((contentType) => contentType.sys.id !== TASK_LINK_CONTENT_TYPE_ID)
      .map((contentType) => ({
        id: contentType.sys.id,
        name: contentType.name,
      }));
  };

  const loadProjects = async (workspaceGid: string) => {
    if (!workspaceGid) {
      setProjects([]);
      return;
    }

    setIsLoadingProjects(true);
    try {
      const data = await callAction<GetAsanaProjectsResponse>('getAsanaProjectsAction', {
        workspaceGid,
      });
      setProjects(data.projects);
    } catch {
      sdk.notifier.error(VALIDATION_MESSAGES.projectsFailed);
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const loadWorkspaces = async () => {
    setIsLoadingWorkspaces(true);
    try {
      const data = await callAction<GetAsanaWorkspacesResponse>('getAsanaWorkspacesAction');
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

  const checkAsanaStatus = async (expectedStatus?: boolean, maxRetries = 5): Promise<boolean> => {
    setIsCheckingStatus(true);
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    let resolvedStatus = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const data = await callAction<CheckAsanaStatusResponse>('checkStatusAction');
        resolvedStatus = data.connected;

        if (expectedStatus === undefined || data.connected === expectedStatus) {
          setIsConnected(data.connected);
          break;
        }

        if (attempt === maxRetries) {
          setIsConnected(data.connected);
          break;
        }

        await delay(400 * attempt);
      } catch {
        resolvedStatus = false;

        if (attempt === maxRetries) {
          setIsConnected(false);
          break;
        }

        await delay(400 * attempt);
      }
    }

    setIsCheckingStatus(false);
    return resolvedStatus;
  };

  const cleanupOAuthPopup = () => {
    window.removeEventListener('message', messageHandler);
    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      popupWindowRef.current.close();
    }
    popupWindowRef.current = null;
  };

  const messageHandler = async (event: MessageEvent) => {
    if (event.data?.type !== 'oauth:complete') {
      return;
    }

    const { code, state, error } = event.data as {
      code?: string;
      state?: string;
      error?: string;
    };

    if (error) {
      cleanupOAuthPopup();
      setIsConnecting(false);
      sdk.notifier.error(`Asana denied the connection: ${error}`);
      return;
    }

    if (!code || !state) {
      cleanupOAuthPopup();
      setIsConnecting(false);
      sdk.notifier.error('The Asana connection response was invalid. Please try again.');
      return;
    }

    try {
      const result = await callAction<CompleteAsanaOAuthResponse>('completeOauthAction', {
        code,
        state,
      });

      const connected = await checkAsanaStatus(true);

      if (connected) {
        await loadWorkspaces();
      }

      if (result.success) {
        sdk.notifier.success(result.message);
      } else {
        sdk.notifier.error(result.message);
      }
    } catch (err) {
      sdk.notifier.error(err instanceof Error ? err.message : 'Could not connect to Asana.');
    } finally {
      cleanupOAuthPopup();
      setIsConnecting(false);
    }
  };

  const handleOAuth = async () => {
    setIsConnecting(true);
    window.removeEventListener('message', messageHandler);
    window.addEventListener('message', messageHandler);

    // Open the popup synchronously, in direct response to the click, before any
    // await. Some browsers (e.g. Safari) only allow window.open() to navigate to
    // the target URL when it's called synchronously from a user gesture; opening
    // it after an await leaves it stuck on about:blank.
    const popup = window.open('', 'asana-oauth', 'width=600,height=700');
    popupWindowRef.current = popup;

    if (!popup) {
      cleanupOAuthPopup();
      setIsConnecting(false);
      sdk.notifier.error(VALIDATION_MESSAGES.popupBlocked);
      return;
    }

    try {
      const data = await callAction<InitiateAsanaOAuthResponse>('initiateOauthAction');
      popup.location.href = data.authorizationUrl;
    } catch {
      cleanupOAuthPopup();
      setIsConnecting(false);
      sdk.notifier.error('Could not start the Asana connection.');
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const result = await callAction<DisconnectAsanaResponse>('disconnectAction');
      await checkAsanaStatus(false);

      setParameters((prev) => ({
        ...prev,
        defaultWorkspaceGid: '',
        defaultWorkspaceName: '',
        defaultProjectGid: '',
        defaultProjectName: '',
      }));
      setWorkspaces([]);
      setProjects([]);

      if (result.success) {
        sdk.notifier.success(result.message);
      } else {
        sdk.notifier.error(result.message);
      }
    } catch (error) {
      sdk.notifier.error(
        error instanceof Error ? error.message : VALIDATION_MESSAGES.oauthDisconnectFailed
      );
    } finally {
      setIsDisconnecting(false);
    }
  };

  useEffect(() => {
    sdk.app.onConfigure(async () => {
      if (!isConnected) {
        sdk.notifier.error(VALIDATION_MESSAGES.connectionRequired);
        return false;
      }

      await ensureTaskLinkContentType(sdk.cma);

      const currentState = (await sdk.app.getCurrentState()) as {
        EditorInterface?: Record<
          string,
          {
            sidebar?: { position: number };
            editors?: { position: number };
          }
        >;
      } | null;

      const currentEditorInterface = (currentState?.EditorInterface ?? {}) as EditorInterfaceState;
      const selectedIds = new Set(selectedContentTypes.map((contentType) => contentType.id));

      // enabledContentTypeIds is declared as a Symbol (string) installation parameter in the
      // app definition, so it must be sent as a JSON string.
      const parametersToSave = {
        ...parameters,
        enabledContentTypeIds: JSON.stringify([...selectedIds]),
      } as unknown as AppInstallationParameters;

      return {
        parameters: parametersToSave,
        targetState: {
          EditorInterface: buildEditorInterfaceTargetState(currentEditorInterface, [
            ...selectedIds,
          ]),
        },
      };
    });

    sdk.app.onConfigurationCompleted((error) => {
      if (error) {
        sdk.notifier.error(VALIDATION_MESSAGES.saveFailed);
      }
    });
  }, [isConnected, parameters, sdk, selectedContentTypes]);

  useEffect(() => {
    (async () => {
      const [currentParameters, installed, currentState, contentTypes] = await Promise.all([
        sdk.app.getParameters<AppInstallationParameters>(),
        sdk.app.isInstalled(),
        sdk.app.getCurrentState(),
        loadContentTypes(),
      ]);

      const nextParameters = parseInstallationParameters(
        currentParameters ? { ...emptyParameters, ...currentParameters } : emptyParameters
      );

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

      let connected = false;
      if (installed) {
        connected = await checkAsanaStatus();
      } else {
        setIsCheckingStatus(false);
      }

      if (connected) {
        const loadedWorkspaces = await loadWorkspaces();
        if (
          nextParameters.defaultWorkspaceGid &&
          loadedWorkspaces.some((workspace) => workspace.gid === nextParameters.defaultWorkspaceGid)
        ) {
          await loadProjects(nextParameters.defaultWorkspaceGid);
        }
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  useEffect(() => {
    return () => {
      cleanupOAuthPopup();
    };
  }, []);

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

  return (
    <Flex fullWidth justifyContent="center">
      <Box style={{ width: '100%', maxWidth: '820px' }}>
        <Form>
          <Heading marginBottom="spacingS">Set up the Asana app</Heading>
          <Paragraph marginBottom="spacingL">
            Connect this app to Asana and choose default destinations for future automation actions.
            This first version focuses on connection validation and saved defaults so task actions
            can build on a stable base.
          </Paragraph>

          <Box marginBottom="spacingL">
            <Note variant="neutral">
              Upon install, the Asana app will create a content type labeled &quot;
              {TASK_LINK_CONTENT_TYPE_NAME}&quot;. This content type stores the links between your
              entries and Asana tasks. Do not delete or modify it manually.
            </Note>
          </Box>

          <Card marginBottom="spacingL">
            <Subheading marginBottom="spacingM">Connect to Asana</Subheading>
            <Paragraph marginBottom="spacingM">
              Connect this app to Asana using OAuth. You won&apos;t need to create or manage any
              Asana API credentials.
            </Paragraph>

            <Flex alignItems="center" gap="spacingM">
              {isInstalled ? (
                isConnected ? (
                  <Button
                    variant="negative"
                    onClick={handleDisconnect}
                    isLoading={isDisconnecting}
                    isDisabled={isDisconnecting || isCheckingStatus}>
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    onClick={handleOAuth}
                    isLoading={isConnecting}
                    isDisabled={isConnecting || isCheckingStatus}>
                    Connect to Asana
                  </Button>
                )
              ) : (
                <Note variant="warning">Install the app to connect to Asana.</Note>
              )}

              {isCheckingStatus ? null : isConnected ? (
                <Badge variant="positive">Connected</Badge>
              ) : (
                <Badge variant="negative">Not connected</Badge>
              )}
            </Flex>
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
