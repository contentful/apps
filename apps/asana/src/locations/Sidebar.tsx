import { SidebarAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  FormControl,
  Note,
  Paragraph,
  SectionHeading,
  Stack,
  Text,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState, type MouseEvent } from 'react';
import { ASANA_AUTOMATION_CONFIG, VALIDATION_MESSAGES } from '../const';
import {
  type AppInstallationParameters,
  type AsanaTask,
  type CheckAsanaStatusResponse,
  type CreateAsanaTaskResponse,
  type GetAsanaTaskResponse,
  type GetAsanaTasksResponse,
  type PrimaryAsanaTaskLink,
  type TaskDetailsDialogResult,
  type TaskDetailsDialogParameters,
} from '../types';
import { parseInstallationParameters } from '../utils/installationParameters';
import {
  deleteTaskLinkForEntry,
  getTaskLinkForEntry,
  saveTaskLinkForEntry,
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
  const hasConnection = hasDefaultProject && isUserConnected;
  const [taskLink, setTaskLink] = useState<PrimaryAsanaTaskLink | null>(null);
  const [isLoadingTaskLink, setIsLoadingTaskLink] = useState(true);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isLinkingTask, setIsLinkingTask] = useState(false);
  const [isUnlinkingTask, setIsUnlinkingTask] = useState(false);
  const [isOpeningTaskDetails, setIsOpeningTaskDetails] = useState(false);
  const [taskLinkInput, setTaskLinkInput] = useState('');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskSearchResults, setTaskSearchResults] = useState<Array<{ gid: string; name: string }>>(
    []
  );
  const [isSearchingTasks, setIsSearchingTasks] = useState(false);
  const [showManualLinkInput, setShowManualLinkInput] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadTaskLink = async () => {
      try {
        const link = await getTaskLinkForEntry(sdk.cma, entrySys.id);
        if (!isCancelled) {
          setTaskLink(link);
        }
      } catch {
        // Best-effort load so a temporary CMA error doesn't block the sidebar.
      } finally {
        if (!isCancelled) {
          setIsLoadingTaskLink(false);
        }
      }
    };

    void loadTaskLink();

    // Poll while unlinked so an open sidebar notices tasks created elsewhere
    // (e.g. by the automation-driven app function) without a manual refresh.
    const intervalId = window.setInterval(() => {
      if (!taskLink) {
        void loadTaskLink();
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
    actionParameters: Record<string, string> = {}
  ): Promise<TResult> => {
    const response = await sdk.cma.appActionCall.createWithResponse(
      { appDefinitionId: sdk.ids.app!, appActionId },
      { parameters: actionParameters }
    );

    return JSON.parse(response.response.body) as TResult;
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

  const entryUrl = `https://app.contentful.com/spaces/${sdk.ids.space}/environments/${sdk.ids.environment}/entries/${entrySys.id}`;
  const taskNameFieldValue = sdk.entry.fields[ASANA_AUTOMATION_CONFIG.taskNameFieldId]?.getValue();

  const buildTaskTitle = () => {
    const taskName = typeof taskNameFieldValue === 'string' ? taskNameFieldValue.trim() : '';
    const displayTitle = typeof entryTitle === 'string' ? entryTitle.trim() : '';
    return taskName || displayTitle || entrySys.id;
  };

  const buildInitialTaskDescription = () =>
    `Contentful entry: ${entryUrl}\nContent type: ${sdk.contentType.name}`;

  const refreshLinkedTask = async () => {
    if (!taskLink) {
      return null;
    }

    try {
      const response = await callAction<GetAsanaTaskResponse>('getAsanaTaskAction', {
        taskId: taskLink.taskGid,
      });

      if (!response.success || !response.task) {
        throw new Error(response.message || 'Could not refresh the Asana task.');
      }

      await savePrimaryTaskLink(response.task);
      return response.task;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not refresh the Asana task.';
      sdk.notifier.error(message);
      return null;
    }
  };

  const openTaskDetailsDialog = async () => {
    if (!taskLink || isOpeningTaskDetails) {
      return;
    }

    setIsOpeningTaskDetails(true);

    try {
      const latestTask = await refreshLinkedTask();
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
          }
        : {
            taskGid: taskLink.taskGid,
            taskName: taskLink.taskName,
            taskUrl: taskLink.taskUrl,
            ...(taskLink.taskDescription ? { taskDescription: taskLink.taskDescription } : {}),
            ...(taskLink.status ? { status: taskLink.status } : {}),
            ...(taskLink.assigneeName ? { assigneeName: taskLink.assigneeName } : {}),
            ...(taskLink.dueDate ? { dueDate: taskLink.dueDate } : {}),
          };

      const workspaceGid = latestTask?.workspaceGid || installationParameters.defaultWorkspaceGid;

      const result = (await sdk.dialogs.openCurrentApp({
        title: 'Manage Asana task',
        width: 'large',
        minHeight: '560px',
        parameters: {
          ...dialogTask,
          ...(workspaceGid ? { workspaceGid } : {}),
        } satisfies TaskDetailsDialogParameters,
      })) as TaskDetailsDialogResult | null;

      if (result?.updatedTask) {
        await savePrimaryTaskLink(result.updatedTask);
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

  const createPrimaryTask = async () => {
    const taskTitle = buildTaskTitle();
    if (!taskTitle) {
      sdk.notifier.error(VALIDATION_MESSAGES.taskTitleRequired);
      return;
    }

    setIsCreatingTask(true);

    try {
      const response = await callAction<CreateAsanaTaskResponse>('createAsanaTaskAction', {
        title: taskTitle,
        notes: buildInitialTaskDescription(),
      });

      if (!response.success || !response.task) {
        throw new Error(response.message || VALIDATION_MESSAGES.taskCreateFailed);
      }
      await savePrimaryTaskLink(response.task);
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

      await savePrimaryTaskLink(response.task);
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
      taskLink ||
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
  }, [hasConnection, installationParameters.defaultWorkspaceGid, sdk, taskLink, taskSearchQuery]);

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

  return (
    <Stack flexDirection="column" spacing="spacingM">
      {isCheckingUserConnection ? null : !isUserConnected ? (
        <Note variant="warning" title="Connect your Asana account">
          You haven&apos;t connected your Asana account yet. Connect in the app config before
          building entry-to-task linking.
          <TextLink href="#" onClick={openAppConfig}>
            Open app configuration
          </TextLink>
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
        <SectionHeading>Primary Asana Task</SectionHeading>
        {isLoadingTaskLink ? null : taskLink ? (
          <Stack flexDirection="column" spacing="spacingM" alignItems="stretch">
            <Box>
              <Text as="div" marginBottom="spacing2Xs" fontColor="gray600">
                Linked task
              </Text>
              <Paragraph marginBottom="spacing2Xs">{taskLink.taskName}</Paragraph>
              <TextLink href={taskLink.taskUrl} target="_blank" rel="noreferrer">
                Open in Asana
              </TextLink>
            </Box>
            <Stack flexDirection="column" spacing="spacingS" alignItems="stretch">
              <Button
                isFullWidth
                variant="secondary"
                onClick={openTaskDetailsDialog}
                isLoading={isOpeningTaskDetails}
                isDisabled={isOpeningTaskDetails || isUnlinkingTask}>
                Manage task
              </Button>
              <Button
                isFullWidth
                variant="negative"
                onClick={unlinkTask}
                isLoading={isUnlinkingTask}
                isDisabled={isUnlinkingTask}>
                Unlink task
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack flexDirection="column" spacing="spacingL" alignItems="stretch">
            <Box>
              <Text as="div" marginBottom="spacing2Xs" fontColor="gray600">
                Create new task
              </Text>
              <Paragraph marginBottom="spacingS">
                Creates a primary Asana task in the configured default project.
              </Paragraph>
              <Button
                isFullWidth
                onClick={createPrimaryTask}
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
                <FormControl.HelpText>
                  Select one result to link it to this entry.
                </FormControl.HelpText>
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
        )}
      </Box>
    </Stack>
  );
};

export default Sidebar;
