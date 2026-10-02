import { SidebarAppSDK } from '@contentful/app-sdk';
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  IconButton,
  Menu,
  Note,
  Paragraph,
  SectionHeading,
  Stack,
  Text,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { ASANA_AUTOMATION_CONFIG, VALIDATION_MESSAGES } from '../const';
import {
  type AppInstallationParameters,
  type AsanaTask,
  type AsanaTaskLink,
  type CheckAsanaStatusResponse,
  type CompleteAsanaOAuthResponse,
  type CreateAsanaTaskResponse,
  type GetAsanaTaskResponse,
  type GetAsanaTasksResponse,
  type InitiateAsanaOAuthResponse,
  type TaskDetailsDialogResult,
  type TaskDetailsDialogParameters,
  type UpdateAsanaTaskResponse,
} from '../types';
import { parseInstallationParameters } from '../utils/installationParameters';
import {
  addSecondaryTaskLinkForEntry,
  deleteTaskLinkEntry,
  deleteTaskLinkForEntry,
  getAllTaskLinksForEntry,
  saveTaskLinkForEntry,
  updateTaskLink,
} from '../utils/taskLinkStore';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();

  const installationParameters = parseInstallationParameters(
    sdk.parameters.installation as AppInstallationParameters
  );
  const entryTitle = sdk.contentType.displayField
    ? sdk.entry.fields[sdk.contentType.displayField]?.getValue()
    : '';
  const entrySys = sdk.entry.getSys();
  const contentTypeId = sdk.contentType.sys.id;
  const hasDefaultProject = Boolean(installationParameters?.defaultProjectGid);
  const [isUserConnected, setIsUserConnected] = useState(false);
  const [isCheckingUserConnection, setIsCheckingUserConnection] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const popupWindowRef = useRef<Window | null>(null);
  const hasConnection = hasDefaultProject && isUserConnected;
  const [taskLink, setTaskLink] = useState<AsanaTaskLink | null>(null);
  const [secondaryTasks, setSecondaryTasks] = useState<AsanaTaskLink[]>([]);
  const [isLoadingTaskLink, setIsLoadingTaskLink] = useState(true);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isLinkingTask, setIsLinkingTask] = useState(false);
  const [isUnlinkingTask, setIsUnlinkingTask] = useState(false);
  const [isOpeningTaskDetails, setIsOpeningTaskDetails] = useState(false);
  const [isAddingSecondaryTask, setIsAddingSecondaryTask] = useState(false);
  const [unlinkingSecondaryId, setUnlinkingSecondaryId] = useState<string | null>(null);
  const [taskLinkInput, setTaskLinkInput] = useState('');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskSearchResults, setTaskSearchResults] = useState<Array<{ gid: string; name: string }>>(
    []
  );
  const [isSearchingTasks, setIsSearchingTasks] = useState(false);
  const [showManualLinkInput, setShowManualLinkInput] = useState(false);
  const [taskTitleDraft, setTaskTitleDraft] = useState('');
  const [duplicateTaskWarning, setDuplicateTaskWarning] = useState<{
    existingTaskName: string;
    existingTaskUrl?: string;
  } | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadTaskLinks = async () => {
      try {
        const links = await getAllTaskLinksForEntry(sdk.cma, entrySys.id);
        if (!isCancelled) {
          setTaskLink(links.find((link) => link.isPrimary) ?? null);
          setSecondaryTasks(links.filter((link) => !link.isPrimary));
        }
      } catch {
        // Best-effort load so a temporary CMA error doesn't block the sidebar.
      } finally {
        if (!isCancelled) {
          setIsLoadingTaskLink(false);
        }
      }
    };

    void loadTaskLinks();

    // Poll while unlinked so an open sidebar notices tasks created elsewhere
    // (e.g. by the automation-driven app function) without a manual refresh.
    const intervalId = window.setInterval(() => {
      if (!taskLink) {
        void loadTaskLinks();
      }
    }, 3000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [entrySys.id, sdk.cma]);

  const openAppConfig = async (event: MouseEvent) => {
    event.preventDefault();
    await sdk.navigator.openAppConfig();
  };

  const callAction = async <TResult,>(
    appActionId: string,
    actionParameters: Record<string, string | boolean> = {}
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

  useEffect(() => {
    let isCancelled = false;

    (async () => {
      try {
        const status = await callAction<CheckAsanaStatusResponse>('checkStatusAction');
        if (!isCancelled) {
          setIsUserConnected(status.connected);
        }
      } catch {
        if (!isCancelled) {
          setIsUserConnected(false);
        }
      } finally {
        if (!isCancelled) {
          setIsCheckingUserConnection(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [sdk]);

  const cleanupOAuthPopup = () => {
    window.removeEventListener('message', oauthMessageHandler);
    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      popupWindowRef.current.close();
    }
    popupWindowRef.current = null;
  };

  const oauthMessageHandler = async (event: MessageEvent) => {
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

      const status = await callAction<CheckAsanaStatusResponse>('checkStatusAction');
      setIsUserConnected(status.connected);

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

  const handleConnectToAsana = async () => {
    setIsConnecting(true);
    window.removeEventListener('message', oauthMessageHandler);
    window.addEventListener('message', oauthMessageHandler);

    // Open the popup synchronously, in direct response to the click, before any
    // await - some browsers only allow window.open() to navigate to the target
    // URL when called synchronously from a user gesture.
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

  useEffect(() => {
    return () => {
      cleanupOAuthPopup();
    };
  }, []);

  const entryUrl = `https://app.contentful.com/spaces/${sdk.ids.space}/environments/${sdk.ids.environment}/entries/${entrySys.id}`;
  const taskNameFieldValue = sdk.entry.fields[ASANA_AUTOMATION_CONFIG.taskNameFieldId]?.getValue();

  const buildTaskTitle = () => {
    const taskName = typeof taskNameFieldValue === 'string' ? taskNameFieldValue.trim() : '';
    const displayTitle = typeof entryTitle === 'string' ? entryTitle.trim() : '';
    return taskName || displayTitle || entrySys.id;
  };

  const buildInitialTaskDescription = () =>
    `Contentful entry: ${entryUrl}\nContent type: ${sdk.contentType.name}`;

  const refreshLinkedTask = async (link: AsanaTaskLink): Promise<AsanaTask | null | 'unlinked'> => {
    try {
      const response = await callAction<GetAsanaTaskResponse>('getAsanaTaskAction', {
        taskId: link.taskGid,
      });

      if (response.taskDeleted) {
        if (link.isPrimary) {
          await clearPrimaryTaskLink();
        } else {
          await removeSecondaryTask(link);
        }
        sdk.notifier.warning(VALIDATION_MESSAGES.taskUnlinkedDeleted);
        return 'unlinked';
      }

      if (!response.success || !response.task) {
        throw new Error(response.message || 'Could not refresh the Asana task.');
      }

      if (link.isPrimary) {
        await savePrimaryTaskLink(response.task);
      } else {
        await updateSecondaryTask(link, response.task);
      }
      return response.task;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not refresh the Asana task.';
      sdk.notifier.error(message);
      return null;
    }
  };

  // Detect a task that was deleted in Asana while unlinked from Contentful (e.g. the user didn't
  // notice until reopening this entry). Only runs once per sidebar mount, and only for the primary
  // task, so it doesn't spam the Asana API - `refreshLinkedTask` already unlinks and notifies when
  // it finds the task is gone.
  const hasCheckedTaskExistenceRef = useRef(false);
  useEffect(() => {
    if (!taskLink || hasCheckedTaskExistenceRef.current) {
      return;
    }
    hasCheckedTaskExistenceRef.current = true;
    void refreshLinkedTask(taskLink);
  }, [taskLink]);

  const openTaskDetailsDialog = async (link: AsanaTaskLink) => {
    if (isOpeningTaskDetails) {
      return;
    }

    setIsOpeningTaskDetails(true);

    try {
      const latestTask = await refreshLinkedTask(link);
      if (latestTask === 'unlinked') {
        return;
      }

      const dialogTask = latestTask
        ? {
            taskGid: latestTask.gid,
            taskName: latestTask.name,
            taskUrl: latestTask.permalinkUrl,
            ...(latestTask.description ? { taskDescription: latestTask.description } : {}),
            ...(latestTask.status ? { status: latestTask.status } : {}),
            ...(latestTask.assigneeName ? { assigneeName: latestTask.assigneeName } : {}),
            ...(latestTask.dueDate ? { dueDate: latestTask.dueDate } : {}),
            ...(latestTask.dependencies ? { dependencies: latestTask.dependencies } : {}),
            ...(latestTask.sectionGid ? { sectionGid: latestTask.sectionGid } : {}),
            ...(latestTask.sectionName ? { sectionName: latestTask.sectionName } : {}),
            ...(latestTask.customFields ? { customFields: latestTask.customFields } : {}),
            ...(latestTask.createdAt ? { createdAt: latestTask.createdAt } : {}),
            ...(latestTask.modifiedAt ? { modifiedAt: latestTask.modifiedAt } : {}),
            ...(latestTask.tags ? { tags: latestTask.tags } : {}),
          }
        : {
            taskGid: link.taskGid,
            taskName: link.taskName,
            taskUrl: link.taskUrl,
            ...(link.taskDescription ? { taskDescription: link.taskDescription } : {}),
            ...(link.status ? { status: link.status } : {}),
            ...(link.assigneeName ? { assigneeName: link.assigneeName } : {}),
            ...(link.dueDate ? { dueDate: link.dueDate } : {}),
          };

      const workspaceGid = latestTask?.workspaceGid || installationParameters.defaultWorkspaceGid;
      const projectGid = latestTask?.projectGid || installationParameters.defaultProjectGid;

      // Custom field values carry nested optional properties that don't structurally satisfy
      // the SDK's SerializedJSONValue type, even though they serialize to JSON just fine (which
      // is what actually happens when these parameters cross into the dialog). Round-tripping
      // through JSON here keeps the `satisfies` check for our own shape while sidestepping that
      // mismatch.
      const result = (await sdk.dialogs.openCurrentApp({
        title: 'Manage Asana task',
        width: 'large',
        minHeight: '560px',
        parameters: JSON.parse(
          JSON.stringify({
            ...dialogTask,
            ...(workspaceGid ? { workspaceGid } : {}),
            ...(projectGid ? { projectGid } : {}),
          } satisfies TaskDetailsDialogParameters)
        ),
      })) as TaskDetailsDialogResult | null;

      if (result?.updatedTask) {
        if (link.isPrimary) {
          await savePrimaryTaskLink(result.updatedTask);
        } else {
          await updateSecondaryTask(link, result.updatedTask);
        }
      }
    } finally {
      setIsOpeningTaskDetails(false);
    }
  };

  const savePrimaryTaskLink = async (task: AsanaTask) => {
    const savedTaskLink = await saveTaskLinkForEntry(sdk.cma, {
      entryId: entrySys.id,
      contentTypeId,
      task,
    });

    setTaskLink(
      savedTaskLink ?? {
        entryId: entrySys.id,
        taskGid: task.gid,
        taskUrl: task.permalinkUrl,
        taskName: task.name,
        linkEntryId: taskLink?.linkEntryId ?? '',
        isPrimary: true,
        ...(typeof task.description === 'string' ? { taskDescription: task.description } : {}),
        ...(typeof task.status === 'string' ? { status: task.status } : {}),
        ...(typeof task.assigneeName === 'string' ? { assigneeName: task.assigneeName } : {}),
        ...(typeof task.dueDate === 'string' ? { dueDate: task.dueDate } : {}),
      }
    );
  };

  const clearPrimaryTaskLink = async () => {
    await deleteTaskLinkForEntry(sdk.cma, entrySys.id);
    setTaskLink(null);
  };

  const updateSecondaryTask = async (link: AsanaTaskLink, task: AsanaTask) => {
    const updatedLink = await updateTaskLink(sdk.cma, link.linkEntryId, task);
    setSecondaryTasks((prev) =>
      prev.map((item) =>
        item.linkEntryId === link.linkEntryId
          ? updatedLink ?? {
              ...item,
              taskGid: task.gid,
              taskUrl: task.permalinkUrl,
              taskName: task.name,
              ...(typeof task.description === 'string'
                ? { taskDescription: task.description }
                : {}),
              ...(typeof task.status === 'string' ? { status: task.status } : {}),
              ...(typeof task.assigneeName === 'string' ? { assigneeName: task.assigneeName } : {}),
              ...(typeof task.dueDate === 'string' ? { dueDate: task.dueDate } : {}),
            }
          : item
      )
    );
  };

  const removeSecondaryTask = async (link: AsanaTaskLink) => {
    setUnlinkingSecondaryId(link.linkEntryId);

    try {
      await deleteTaskLinkEntry(sdk.cma, link.linkEntryId);
      setSecondaryTasks((prev) => prev.filter((item) => item.linkEntryId !== link.linkEntryId));
      sdk.notifier.success('Asana task unlinked successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not unlink the Asana task.';
      sdk.notifier.error(message);
    } finally {
      setUnlinkingSecondaryId(null);
    }
  };

  const addSecondaryTask = async (task: AsanaTask) => {
    const link = await addSecondaryTaskLinkForEntry(sdk.cma, {
      entryId: entrySys.id,
      contentTypeId,
      task,
    });

    if (link) {
      setSecondaryTasks((prev) => [...prev, link]);
    }
  };

  const persistNewTaskLink = async (task: AsanaTask) => {
    if (isAddingSecondaryTask) {
      await addSecondaryTask(task);
    } else {
      await savePrimaryTaskLink(task);
    }
  };

  const startAddingSecondaryTask = () => {
    setTaskLinkInput('');
    setTaskSearchQuery('');
    setTaskSearchResults([]);
    setShowManualLinkInput(false);
    setTaskTitleDraft('');
    setDuplicateTaskWarning(null);
    setIsAddingSecondaryTask(true);
  };

  const cancelAddingSecondaryTask = () => {
    setIsAddingSecondaryTask(false);
    setTaskLinkInput('');
    setTaskSearchQuery('');
    setTaskSearchResults([]);
    setShowManualLinkInput(false);
    setTaskTitleDraft('');
    setDuplicateTaskWarning(null);
  };

  const createTask = async (options?: { allowDuplicateName?: boolean }) => {
    const taskTitle = taskTitleDraft.trim() || buildTaskTitle();
    if (!taskTitle) {
      sdk.notifier.error(VALIDATION_MESSAGES.taskTitleRequired);
      return;
    }

    setIsCreatingTask(true);
    setDuplicateTaskWarning(null);

    try {
      const response = await callAction<CreateAsanaTaskResponse>('createAsanaTaskAction', {
        title: taskTitle,
        notes: buildInitialTaskDescription(),
        checkDuplicateName: true,
        ...(options?.allowDuplicateName ? { allowDuplicateName: true } : {}),
      });

      if (response.duplicateTaskName) {
        setDuplicateTaskWarning({
          existingTaskName: response.duplicateTask?.name || taskTitle,
          existingTaskUrl: response.duplicateTask?.permalinkUrl,
        });
        return;
      }

      if (!response.success || !response.task) {
        throw new Error(response.message || VALIDATION_MESSAGES.taskCreateFailed);
      }
      await persistNewTaskLink(response.task);
      setIsAddingSecondaryTask(false);
      setTaskTitleDraft('');
      sdk.notifier.success(VALIDATION_MESSAGES.taskCreated);
    } catch (error) {
      const message = error instanceof Error ? error.message : VALIDATION_MESSAGES.taskCreateFailed;
      sdk.notifier.error(message);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const linkExistingTask = async () => {
    await linkTaskById(taskLinkInput);
  };

  const linkTaskById = async (taskIdentifier: string) => {
    const taskId = taskIdentifier.trim();
    if (!taskId) {
      sdk.notifier.error(VALIDATION_MESSAGES.taskIdRequired);
      return;
    }

    setIsLinkingTask(true);

    try {
      const response = await callAction<GetAsanaTaskResponse>('getAsanaTaskAction', {
        taskId,
      });

      if (!response.success || !response.task) {
        throw new Error(response.message || 'Could not load the Asana task.');
      }

      // Linking an existing task (rather than creating a new one) means it may already be linked
      // to other entries - make sure its description also references this entry, so anyone
      // looking at the task in Asana can see every entry it's tied to.
      let linkedTask = response.task;
      try {
        const updateResponse = await callAction<UpdateAsanaTaskResponse>('updateAsanaTaskAction', {
          taskId: linkedTask.gid,
          entryId: entrySys.id,
          appendEntryLink: true,
        });
        if (updateResponse.success && updateResponse.task) {
          linkedTask = updateResponse.task;
        }
      } catch {
        // Best-effort - if this fails, still proceed to link the task using the details we
        // already have, rather than blocking the link on it.
      }

      await persistNewTaskLink(linkedTask);
      setIsAddingSecondaryTask(false);
      setTaskLinkInput('');
      setTaskSearchQuery('');
      setTaskSearchResults([]);
      sdk.notifier.success('Asana task linked successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not link the Asana task.';
      sdk.notifier.error(message);
    } finally {
      setIsLinkingTask(false);
    }
  };

  useEffect(() => {
    if (
      !hasConnection ||
      !installationParameters.defaultWorkspaceGid ||
      (taskLink && !isAddingSecondaryTask) ||
      !taskSearchQuery.trim()
    ) {
      setTaskSearchResults([]);
      setIsSearchingTasks(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSearchingTasks(true);
      try {
        const response = await callAction<GetAsanaTasksResponse>('getAsanaTasksAction', {
          workspaceGid: installationParameters.defaultWorkspaceGid,
          projectGid: installationParameters.defaultProjectGid,
          query: taskSearchQuery.trim(),
        });
        setTaskSearchResults(response.tasks);
      } catch {
        setTaskSearchResults([]);
        sdk.notifier.error('Could not search Asana tasks.');
      } finally {
        setIsSearchingTasks(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    hasConnection,
    installationParameters.defaultWorkspaceGid,
    isAddingSecondaryTask,
    sdk,
    taskLink,
    taskSearchQuery,
  ]);

  const unlinkTask = async () => {
    if (!taskLink) {
      return;
    }

    setIsUnlinkingTask(true);

    try {
      await clearPrimaryTaskLink();
      sdk.notifier.success('Asana task unlinked successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not unlink the Asana task.';
      sdk.notifier.error(message);
    } finally {
      setIsUnlinkingTask(false);
    }
  };

  const renderCreateOrLinkForm = () => (
    <Stack flexDirection="column" spacing="spacingL" alignItems="stretch">
      <Box>
        <Text as="div" marginBottom="spacing2Xs" fontColor="gray600">
          Create new task
        </Text>
        <Paragraph marginBottom="spacingS">
          Creates {isAddingSecondaryTask ? 'an additional' : 'a primary'} Asana task in the
          configured default project.
        </Paragraph>
        <FormControl style={{ width: '100%' }} marginBottom="spacingS">
          <FormControl.Label>Task name</FormControl.Label>
          <TextInput
            value={taskTitleDraft}
            onChange={(event) => {
              setTaskTitleDraft(event.target.value);
              setDuplicateTaskWarning(null);
            }}
            placeholder={buildTaskTitle()}
            isDisabled={isCreatingTask || isLinkingTask || isUnlinkingTask}
            style={{ width: '100%' }}
          />
        </FormControl>
        {duplicateTaskWarning ? (
          <Box marginBottom="spacingS">
            <Note
              variant="warning"
              title="A task with this name already exists"
              withCloseButton
              closeButtonAriaLabel="Dismiss"
              onClose={() => setDuplicateTaskWarning(null)}>
              <Paragraph marginBottom="spacingXs">
                There&apos;s already an Asana task named &ldquo;
                {duplicateTaskWarning.existingTaskName}&rdquo;
                {duplicateTaskWarning.existingTaskUrl ? (
                  <>
                    {' '}
                    (
                    <TextLink
                      href={duplicateTaskWarning.existingTaskUrl}
                      target="_blank"
                      rel="noreferrer">
                      view in Asana
                    </TextLink>
                    )
                  </>
                ) : null}
                . Rename the task above, or create it anyway.
              </Paragraph>
              <Button
                size="small"
                variant="secondary"
                onClick={() => void createTask({ allowDuplicateName: true })}
                isLoading={isCreatingTask}
                isDisabled={isCreatingTask || isLinkingTask || isUnlinkingTask}>
                Create anyway
              </Button>
            </Note>
          </Box>
        ) : null}
        <Button
          isFullWidth
          onClick={() => void createTask()}
          isLoading={isCreatingTask}
          isDisabled={!hasConnection || isCreatingTask || isLinkingTask || isUnlinkingTask}>
          Create Asana task
        </Button>
      </Box>

      <Box>
        <Text as="div" marginBottom="spacing2Xs" fontColor="gray600">
          Link existing task
        </Text>
        <Paragraph marginBottom="none">
          Search the default project and choose a task to link to this entry.
        </Paragraph>
      </Box>
      {installationParameters.defaultProjectGid ? (
        <FormControl style={{ width: '100%' }}>
          <FormControl.Label>Search tasks</FormControl.Label>
          <Box style={{ position: 'relative', width: '100%' }}>
            <TextInput
              value={taskSearchQuery}
              onChange={(event) => setTaskSearchQuery(event.target.value)}
              placeholder="Search tasks in the default project"
              isDisabled={isCreatingTask || isLinkingTask || isUnlinkingTask}
              style={{ width: '100%' }}
            />
            {(isSearchingTasks ||
              (taskSearchQuery.trim() && taskSearchResults.length > 0) ||
              (taskSearchQuery.trim() && !isSearchingTasks && !taskSearchResults.length)) && (
              <Box
                marginTop="spacing2Xs"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 2,
                  border: '1px solid #cfd9e0',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                  overflow: 'hidden',
                }}>
                {isSearchingTasks ? (
                  <Paragraph margin="spacingS">Searching Asana tasks...</Paragraph>
                ) : null}
                {taskSearchQuery.trim() && taskSearchResults.length ? (
                  <Stack
                    flexDirection="column"
                    spacing="none"
                    style={{ maxHeight: '220px', overflowY: 'auto' }}>
                    {taskSearchResults.map((task, index) => (
                      <Button
                        key={task.gid}
                        variant="transparent"
                        isFullWidth
                        isDisabled={isCreatingTask || isLinkingTask || isUnlinkingTask}
                        onClick={() => void linkTaskById(task.gid)}
                        style={{
                          justifyContent: 'flex-start',
                          borderRadius: 0,
                          borderTop: index === 0 ? 'none' : '1px solid #e5ebed',
                        }}>
                        {task.name}
                      </Button>
                    ))}
                  </Stack>
                ) : null}
                {taskSearchQuery.trim() && !isSearchingTasks && !taskSearchResults.length ? (
                  <Paragraph margin="spacingS">No matching tasks found.</Paragraph>
                ) : null}
              </Box>
            )}
          </Box>
          <FormControl.HelpText>Select one result to link it to this entry.</FormControl.HelpText>
        </FormControl>
      ) : null}
      <Box>
        <TextLink
          as="button"
          type="button"
          onClick={() => setShowManualLinkInput((isVisible) => !isVisible)}
          style={{ fontSize: '14px' }}>
          {showManualLinkInput ? 'Hide URL or GID linking' : 'Link by URL or GID'}
        </TextLink>
      </Box>
      {showManualLinkInput ? (
        <Stack flexDirection="column" spacing="spacingM" alignItems="stretch">
          <FormControl style={{ width: '100%' }}>
            <FormControl.Label>Task URL or GID</FormControl.Label>
            <TextInput
              value={taskLinkInput}
              onChange={(event) => setTaskLinkInput(event.target.value)}
              placeholder="Paste an Asana task URL or task GID"
              isDisabled={isCreatingTask || isLinkingTask || isUnlinkingTask}
              style={{ width: '100%' }}
            />
          </FormControl>
          <Button
            isFullWidth
            variant="secondary"
            onClick={linkExistingTask}
            isLoading={isLinkingTask}
            isDisabled={!hasConnection || isCreatingTask || isLinkingTask || isUnlinkingTask}>
            Link pasted task
          </Button>
        </Stack>
      ) : null}
    </Stack>
  );

  return (
    <Stack flexDirection="column" spacing="spacingM">
      {isCheckingUserConnection ? null : !isUserConnected ? (
        <Note variant="warning" title="Connect your Asana account">
          <Paragraph marginBottom="spacingS">
            You haven&apos;t connected your Asana account yet.
          </Paragraph>
          <Button
            size="small"
            onClick={handleConnectToAsana}
            isLoading={isConnecting}
            isDisabled={isConnecting}>
            Connect to Asana
          </Button>
        </Note>
      ) : !hasConnection ? (
        <Note variant="warning" title="Finish Asana setup first">
          Choose a default project in the app config before building entry-to-task linking.
          <TextLink href="#" onClick={openAppConfig}>
            Open app configuration
          </TextLink>
        </Note>
      ) : (
        <Note variant="positive" title="Connected to Asana">
          Default project: {sdk.parameters.installation.defaultProjectName || 'Configured project'}
        </Note>
      )}

      <Box>
        <SectionHeading>Asana Tasks</SectionHeading>
        {isLoadingTaskLink ? null : taskLink ? (
          <Stack flexDirection="column" spacing="spacingM" alignItems="stretch">
            <Stack flexDirection="column" spacing="spacingS" alignItems="stretch">
              {[taskLink, ...secondaryTasks].map((link) => {
                const isUnlinkingThis = link.isPrimary
                  ? isUnlinkingTask
                  : unlinkingSecondaryId === link.linkEntryId;

                return (
                  <Box
                    key={link.linkEntryId || 'primary'}
                    style={{
                      border: `1px solid ${tokens.gray300}`,
                      borderRadius: tokens.borderRadiusMedium,
                      overflow: 'hidden',
                    }}>
                    <Flex
                      alignItems="center"
                      justifyContent="space-between"
                      gap="spacingXs"
                      paddingTop="spacingXs"
                      paddingBottom="spacingXs"
                      paddingLeft="spacingM"
                      paddingRight="spacingS"
                      style={{ borderBottom: `1px solid ${tokens.gray200}` }}>
                      <Text
                        fontWeight="fontWeightDemiBold"
                        fontColor="gray900"
                        fontSize="fontSizeM"
                        isWordBreak>
                        {link.taskName}
                      </Text>
                      <Flex alignItems="center" gap="spacingXs" style={{ flexShrink: 0 }}>
                        {link.isPrimary ? (
                          <Badge variant="primary" size="small">
                            Primary
                          </Badge>
                        ) : null}
                        <Menu>
                          <Menu.Trigger>
                            <IconButton
                              aria-label="Task actions"
                              icon={<Text fontColor="gray600">⋯</Text>}
                              variant="transparent"
                              size="small"
                            />
                          </Menu.Trigger>
                          <Menu.List>
                            <Menu.Item
                              onClick={() => void openTaskDetailsDialog(link)}
                              isDisabled={isOpeningTaskDetails || isUnlinkingThis}>
                              Manage task
                            </Menu.Item>
                            <Menu.Item
                              onClick={() =>
                                void (link.isPrimary ? unlinkTask() : removeSecondaryTask(link))
                              }
                              isDisabled={isUnlinkingThis}>
                              Unlink task
                            </Menu.Item>
                          </Menu.List>
                        </Menu>
                      </Flex>
                    </Flex>
                    <Stack
                      flexDirection="column"
                      spacing="spacing2Xs"
                      alignItems="flex-start"
                      paddingTop="spacingS"
                      paddingBottom="spacingS"
                      paddingLeft="spacingM"
                      paddingRight="spacingM">
                      {link.status || link.assigneeName ? (
                        <Text fontColor="gray600" fontSize="fontSizeS">
                          {[link.status, link.assigneeName].filter(Boolean).join(' · ')}
                        </Text>
                      ) : null}
                      <TextLink href={link.taskUrl} target="_blank" rel="noreferrer">
                        Open in Asana
                      </TextLink>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>

            {isAddingSecondaryTask ? (
              <Stack flexDirection="column" spacing="spacingM" alignItems="stretch">
                {renderCreateOrLinkForm()}
                <TextLink
                  as="button"
                  type="button"
                  onClick={cancelAddingSecondaryTask}
                  style={{ fontSize: '14px' }}>
                  Cancel
                </TextLink>
              </Stack>
            ) : (
              <Button
                isFullWidth
                variant="secondary"
                onClick={startAddingSecondaryTask}
                isDisabled={!hasConnection || isCreatingTask || isLinkingTask}>
                Add another task
              </Button>
            )}
          </Stack>
        ) : (
          renderCreateOrLinkForm()
        )}
      </Box>
    </Stack>
  );
};

export default Sidebar;
