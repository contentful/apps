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
  GetAsanaProjectsResponse,
  GetAsanaWorkspacesResponse,
  PrimaryTaskLinkFieldMapping,
  ValidateAsanaCredentialsResponse,
} from '../types';
import { buildEditorInterfaceTargetState, EditorInterfaceState } from '../utils/editorInterface';
import { getDefaultPrimaryTaskLinkMapping } from '../utils/primaryTaskLink';

const emptyParameters: AppInstallationParameters = {
  personalAccessToken: '',
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

  const validateRequiredFields = (): boolean => {
    if (parameters.personalAccessToken.trim()) {
      setErrors({});
      return true;
    }

    setErrors({ personalAccessToken: VALIDATION_MESSAGES.tokenRequired });
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

  const loadProjects = async (workspaceGid: string, personalAccessToken?: string) => {
    if (!workspaceGid) {
      setProjects([]);
      return;
    }

    setIsLoadingProjects(true);
    try {
      const data = await callAction<GetAsanaProjectsResponse>('getAsanaProjectsAction', {
        workspaceGid,
        personalAccessToken: personalAccessToken ?? parameters.personalAccessToken,
      });
      setProjects(data.projects);
    } catch (_error) {
      sdk.notifier.error(VALIDATION_MESSAGES.projectsFailed);
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const loadWorkspaces = async (personalAccessToken?: string) => {
    setIsLoadingWorkspaces(true);
    try {
      const data = await callAction<GetAsanaWorkspacesResponse>('getAsanaWorkspacesAction', {
        personalAccessToken: personalAccessToken ?? parameters.personalAccessToken,
      });
      setWorkspaces(data.workspaces);
      return data.workspaces;
    } catch (_error) {
      sdk.notifier.error(VALIDATION_MESSAGES.workspacesFailed);
      setWorkspaces([]);
      return [];
    } finally {
      setIsLoadingWorkspaces(false);
    }
  };

  const hydrateSavedOptions = async (savedParameters: AppInstallationParameters) => {
    if (!savedParameters.personalAccessToken.trim()) {
      return;
    }

    const loadedWorkspaces = await loadWorkspaces(savedParameters.personalAccessToken);
    const selectedWorkspaceGid = savedParameters.defaultWorkspaceGid;

    if (
      selectedWorkspaceGid &&
      loadedWorkspaces.some((workspace) => workspace.gid === selectedWorkspaceGid)
    ) {
      await loadProjects(selectedWorkspaceGid, savedParameters.personalAccessToken);
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

  const handleTokenChange = (value: string) => {
    setParameters((prev) => ({
      ...prev,
      personalAccessToken: value,
      connectionStatus: ConnectionStatus.None,
      connectionMessage: '',
      defaultWorkspaceGid: '',
      defaultWorkspaceName: '',
      defaultProjectGid: '',
      defaultProjectName: '',
    }));
    setWorkspaces([]);
    setProjects([]);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.personalAccessToken;
      return next;
    });
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
    if (!validateRequiredFields()) {
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
        { personalAccessToken: parameters.personalAccessToken }
      );

      const nextStatus = data.valid ? ConnectionStatus.Success : ConnectionStatus.Error;
      setConnectionState(nextStatus, data.message);

      if (data.valid) {
        await loadWorkspaces(parameters.personalAccessToken);
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
              isInvalid={Boolean(errors.personalAccessToken)}
              marginBottom="spacingM">
              <FormControl.Label>Asana personal access token</FormControl.Label>
              <TextInput
                id="personalAccessToken"
                name="personalAccessToken"
                value={parameters.personalAccessToken}
                type="password"
                onChange={(event) => handleTokenChange(event.target.value)}
              />
              {errors.personalAccessToken ? (
                <FormControl.ValidationMessage>
                  {errors.personalAccessToken}
                </FormControl.ValidationMessage>
              ) : (
                <FormControl.HelpText>
                  Use a personal access token for the first local version of the app.
                </FormControl.HelpText>
              )}
            </FormControl>

            <Flex alignItems="center" gap="spacingM">
              {isInstalled ? (
                <Button
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
