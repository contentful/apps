import { DialogAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  Flex,
  FormControl,
  Paragraph,
  Pill,
  SectionHeading,
  Text,
  TextInput,
  TextLink,
  Textarea,
} from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useMemo, useState } from 'react';
import { VALIDATION_MESSAGES } from '../const';
import type {
  AddAsanaCommentResponse,
  AsanaComment,
  AsanaTaskOption,
  AsanaUserOption,
  GetAsanaCommentsResponse,
  GetAsanaTasksResponse,
  GetAsanaUsersResponse,
  TaskDetailsDialogParameters,
  TaskDetailsDialogResult,
  UpdateAsanaTaskResponse,
} from '../types';

function formatCommentTimestamp(isoDate: string) {
  if (!isoDate) {
    return '';
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffMinutes < 1) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  useAutoResizer();

  const invocation = (sdk.parameters.invocation ?? {}) as unknown as TaskDetailsDialogParameters;
  const task = invocation.taskGid
    ? {
        taskGid: invocation.taskGid,
        taskName: invocation.taskName,
        taskUrl: invocation.taskUrl,
        taskDescription: invocation.taskDescription,
        status: invocation.status,
        assigneeName: invocation.assigneeName,
        dueDate: invocation.dueDate,
      }
    : null;
  const workspaceGid = invocation.workspaceGid ?? '';

  const [description, setDescription] = useState(invocation.taskDescription ?? '');
  const [dueDate, setDueDate] = useState(invocation.dueDate ?? '');
  const [assigneeQuery, setAssigneeQuery] = useState('');
  const [assigneeResults, setAssigneeResults] = useState<AsanaUserOption[]>([]);
  const [isSearchingAssignees, setIsSearchingAssignees] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<AsanaUserOption | null>(null);
  const [assigneeCleared, setAssigneeCleared] = useState(false);
  const [pendingDependencyAdds, setPendingDependencyAdds] = useState<AsanaTaskOption[]>([]);
  const [pendingDependencyRemovals, setPendingDependencyRemovals] = useState<string[]>([]);
  const [dependencyQuery, setDependencyQuery] = useState('');
  const [dependencyResults, setDependencyResults] = useState<AsanaTaskOption[]>([]);
  const [isSearchingDependencies, setIsSearchingDependencies] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<AsanaComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);

  const effectiveDependencies = [
    ...(invocation.dependencies ?? []).filter(
      (dependency) => !pendingDependencyRemovals.includes(dependency.gid)
    ),
    ...pendingDependencyAdds,
  ];

  const hasDescriptionChanges = useMemo(
    () => description.trim() !== (task?.taskDescription ?? '').trim(),
    [description, task?.taskDescription]
  );
  const hasDueDateChanges = dueDate !== (invocation.dueDate ?? '');
  const hasAssigneeChanges = Boolean(selectedAssignee) || assigneeCleared;
  const hasDependencyChanges =
    pendingDependencyAdds.length > 0 || pendingDependencyRemovals.length > 0;
  const hasDetailChanges =
    hasDescriptionChanges || hasDueDateChanges || hasAssigneeChanges || hasDependencyChanges;
  const isBusy = isSaving || isPostingComment;

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

  useEffect(() => {
    if (!workspaceGid || !assigneeQuery.trim()) {
      setAssigneeResults([]);
      setIsSearchingAssignees(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSearchingAssignees(true);
      try {
        const response = await callAction<GetAsanaUsersResponse>('getAsanaUsersAction', {
          workspaceGid,
          query: assigneeQuery.trim(),
        });
        setAssigneeResults(response.users);
      } catch {
        setAssigneeResults([]);
      } finally {
        setIsSearchingAssignees(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [assigneeQuery, workspaceGid]);

  useEffect(() => {
    if (!workspaceGid || !dependencyQuery.trim()) {
      setDependencyResults([]);
      setIsSearchingDependencies(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSearchingDependencies(true);
      try {
        const response = await callAction<GetAsanaTasksResponse>('getAsanaTasksAction', {
          workspaceGid,
          query: dependencyQuery.trim(),
        });
        setDependencyResults(
          response.tasks.filter(
            (candidate) =>
              candidate.gid !== task?.taskGid &&
              !effectiveDependencies.some((dependency) => dependency.gid === candidate.gid)
          )
        );
      } catch {
        setDependencyResults([]);
      } finally {
        setIsSearchingDependencies(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dependencyQuery, workspaceGid]);

  const loadComments = async () => {
    if (!task) {
      return;
    }

    setIsLoadingComments(true);
    setCommentsError(null);
    try {
      const response = await callAction<GetAsanaCommentsResponse>('getAsanaCommentsAction', {
        taskId: task.taskGid,
      });

      if (!response.success) {
        setComments([]);
        setCommentsError(response.message || 'Could not load comments.');
        return;
      }

      setComments(response.comments ?? []);
    } catch (error) {
      setComments([]);
      setCommentsError(error instanceof Error ? error.message : 'Could not load comments.');
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    void loadComments();
  }, [task?.taskGid]);

  const handleSaveDetails = async () => {
    if (!task || !hasDetailChanges) {
      return;
    }

    setIsSaving(true);

    try {
      const fieldUpdateParams = {
        ...(hasDescriptionChanges ? { notes: description.trim() } : {}),
        ...(hasAssigneeChanges ? { assignee: selectedAssignee ? selectedAssignee.gid : '' } : {}),
        ...(hasDueDateChanges ? { dueDate: dueDate.trim() } : {}),
      };

      const dependencyOps: Array<Record<string, string>> = [];
      const maxOps = Math.max(pendingDependencyAdds.length, pendingDependencyRemovals.length);
      for (let index = 0; index < maxOps; index += 1) {
        const op: Record<string, string> = {};
        if (pendingDependencyAdds[index]) {
          op.addDependencyGid = pendingDependencyAdds[index].gid;
        }
        if (pendingDependencyRemovals[index]) {
          op.removeDependencyGid = pendingDependencyRemovals[index];
        }
        dependencyOps.push(op);
      }

      let latestTask: UpdateAsanaTaskResponse['task'] | undefined;

      if (dependencyOps.length === 0) {
        const response = await callAction<UpdateAsanaTaskResponse>('updateAsanaTaskAction', {
          taskId: task.taskGid,
          ...fieldUpdateParams,
        });

        if (!response.success || !response.task) {
          throw new Error(response.message || VALIDATION_MESSAGES.taskUpdateFailed);
        }

        latestTask = response.task;
      } else {
        for (let index = 0; index < dependencyOps.length; index += 1) {
          const response = await callAction<UpdateAsanaTaskResponse>('updateAsanaTaskAction', {
            taskId: task.taskGid,
            ...(index === 0 ? fieldUpdateParams : {}),
            ...dependencyOps[index],
          });

          if (!response.success || !response.task) {
            throw new Error(response.message || VALIDATION_MESSAGES.taskUpdateFailed);
          }

          latestTask = response.task;
        }
      }

      if (!latestTask) {
        throw new Error(VALIDATION_MESSAGES.taskUpdateFailed);
      }

      sdk.notifier.success(VALIDATION_MESSAGES.taskUpdated);
      sdk.close({ updatedTask: latestTask } satisfies TaskDetailsDialogResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : VALIDATION_MESSAGES.taskUpdateFailed;
      sdk.notifier.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAssignee = (user: AsanaUserOption) => {
    setSelectedAssignee(user);
    setAssigneeCleared(false);
    setAssigneeQuery('');
    setAssigneeResults([]);
  };

  const handleClearAssigneeSelection = () => {
    setSelectedAssignee(null);
    setAssigneeCleared(false);
  };

  const handleUnassign = () => {
    setSelectedAssignee(null);
    setAssigneeCleared(true);
    setAssigneeQuery('');
    setAssigneeResults([]);
  };

  const handleAddDependency = (candidate: AsanaTaskOption) => {
    setPendingDependencyAdds((current) =>
      current.some((dependency) => dependency.gid === candidate.gid)
        ? current
        : [...current, candidate]
    );
    setDependencyQuery('');
    setDependencyResults([]);
  };

  const handleRemoveDependency = (dependencyGid: string) => {
    if (pendingDependencyAdds.some((dependency) => dependency.gid === dependencyGid)) {
      setPendingDependencyAdds((current) =>
        current.filter((dependency) => dependency.gid !== dependencyGid)
      );
      return;
    }

    setPendingDependencyRemovals((current) =>
      current.includes(dependencyGid) ? current : [...current, dependencyGid]
    );
  };

  const handleAddComment = async () => {
    if (!task) {
      return;
    }

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      sdk.notifier.error(VALIDATION_MESSAGES.taskCommentRequired);
      return;
    }

    setIsPostingComment(true);

    try {
      const response = await callAction<AddAsanaCommentResponse>('addAsanaCommentAction', {
        taskId: task.taskGid,
        comment: trimmedComment,
      });

      if (!response.success) {
        throw new Error(response.message || VALIDATION_MESSAGES.taskCommentFailed);
      }

      setComment('');
      await loadComments();
      sdk.notifier.success(VALIDATION_MESSAGES.taskCommentAdded);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : VALIDATION_MESSAGES.taskCommentFailed;
      sdk.notifier.error(message);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleClose = () => {
    sdk.close();
  };

  if (!task) {
    return (
      <Box padding="spacingL">
        <Paragraph marginBottom="spacingM">
          No linked Asana task was provided to this dialog.
        </Paragraph>
        <Button onClick={handleClose}>Close</Button>
      </Box>
    );
  }

  return (
    <Box padding="spacingL" style={{ width: '100%' }}>
      <Flex flexDirection="column" gap="spacingL" alignItems="stretch" style={{ width: '100%' }}>
        <Box>
          <Text as="div" marginBottom="spacing2Xs" fontColor="gray600">
            Linked task
          </Text>
          <SectionHeading marginBottom="spacing2Xs">{task.taskName}</SectionHeading>
          <TextLink href={task.taskUrl} target="_blank" rel="noreferrer">
            Open in Asana
          </TextLink>
        </Box>

        <Box>
          <Text as="div" marginBottom="spacing2Xs" fontColor="gray600">
            Status
          </Text>
          <Text>{task.status || 'Unknown'}</Text>
        </Box>

        <Flex gap="spacingL" flexWrap="wrap">
          <FormControl style={{ minWidth: '260px', flex: 1 }}>
            <Flex justifyContent="space-between" alignItems="center">
              <FormControl.Label marginBottom="none">Assignee</FormControl.Label>
              {selectedAssignee || (task.assigneeName && !assigneeCleared) ? (
                <Button
                  variant="transparent"
                  size="small"
                  onClick={selectedAssignee ? handleClearAssigneeSelection : handleUnassign}
                  isDisabled={isBusy}>
                  {selectedAssignee ? 'Cancel' : 'Unassign'}
                </Button>
              ) : null}
            </Flex>
            {selectedAssignee || assigneeCleared ? (
              <Box marginBottom="spacingXs">
                <Pill
                  label={assigneeCleared ? 'Unassigned' : selectedAssignee!.name}
                  onClose={handleClearAssigneeSelection}
                  closeButtonAriaLabel="Clear assignee selection"
                />
              </Box>
            ) : null}
            <Box style={{ position: 'relative' }}>
              <TextInput
                value={assigneeQuery}
                onChange={(event) => setAssigneeQuery(event.target.value)}
                placeholder={
                  selectedAssignee
                    ? selectedAssignee.name
                    : task.assigneeName || 'Search people to assign'
                }
                isDisabled={isBusy}
              />
              {assigneeQuery.trim() ? (
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
                  {isSearchingAssignees ? (
                    <Paragraph margin="spacingS">Searching Asana people...</Paragraph>
                  ) : assigneeResults.length ? (
                    <Flex flexDirection="column" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      {assigneeResults.map((candidate, index) => (
                        <Button
                          key={candidate.gid}
                          variant="transparent"
                          isFullWidth
                          isDisabled={isBusy}
                          onClick={() => handleSelectAssignee(candidate)}
                          style={{
                            justifyContent: 'flex-start',
                            borderRadius: 0,
                            borderTop: index === 0 ? 'none' : '1px solid #e5ebed',
                          }}>
                          {candidate.name}
                          {candidate.email ? ` (${candidate.email})` : ''}
                        </Button>
                      ))}
                    </Flex>
                  ) : (
                    <Paragraph margin="spacingS">No matching people found.</Paragraph>
                  )}
                </Box>
              ) : null}
            </Box>
            <FormControl.HelpText>
              Currently: {task.assigneeName || 'Unassigned'}. Search by name or email to reassign.
            </FormControl.HelpText>
          </FormControl>
          <FormControl style={{ minWidth: '200px', flex: 1 }}>
            <FormControl.Label>Due date</FormControl.Label>
            <TextInput
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              isDisabled={isBusy}
            />
            <FormControl.HelpText>Clear the date to remove the due date.</FormControl.HelpText>
          </FormControl>
        </Flex>

        <FormControl>
          <FormControl.Label>Description</FormControl.Label>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={8}
            isDisabled={isBusy}
          />
          <FormControl.HelpText>Updates the linked Asana task description.</FormControl.HelpText>
        </FormControl>

        <Box>
          <Text as="div" marginBottom="spacingXs" fontColor="gray600">
            Dependencies
          </Text>
          <Flex gap="spacingXs" flexWrap="wrap" marginBottom="spacingS">
            {effectiveDependencies.length ? (
              effectiveDependencies.map((dependency) => (
                <Pill
                  key={dependency.gid}
                  label={dependency.name}
                  onClose={() => handleRemoveDependency(dependency.gid)}
                  closeButtonAriaLabel={`Remove ${dependency.name} dependency`}
                />
              ))
            ) : (
              <Text fontColor="gray500">No dependencies.</Text>
            )}
          </Flex>
          {workspaceGid ? (
            <FormControl marginBottom="none">
              <FormControl.Label>Add dependency</FormControl.Label>
              <Box style={{ position: 'relative' }}>
                <TextInput
                  value={dependencyQuery}
                  onChange={(event) => setDependencyQuery(event.target.value)}
                  placeholder="Search Asana tasks to add as a dependency"
                  isDisabled={isBusy}
                />
                {dependencyQuery.trim() ? (
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
                    {isSearchingDependencies ? (
                      <Paragraph margin="spacingS">Searching Asana tasks...</Paragraph>
                    ) : dependencyResults.length ? (
                      <Flex
                        flexDirection="column"
                        style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        {dependencyResults.map((candidate, index) => (
                          <Button
                            key={candidate.gid}
                            variant="transparent"
                            isFullWidth
                            isDisabled={isBusy}
                            onClick={() => handleAddDependency(candidate)}
                            style={{
                              justifyContent: 'flex-start',
                              borderRadius: 0,
                              borderTop: index === 0 ? 'none' : '1px solid #e5ebed',
                            }}>
                            {candidate.name}
                          </Button>
                        ))}
                      </Flex>
                    ) : (
                      <Paragraph margin="spacingS">No matching tasks found.</Paragraph>
                    )}
                  </Box>
                ) : null}
              </Box>
            </FormControl>
          ) : null}
        </Box>

        <Box>
          <Text as="div" marginBottom="spacingXs" fontColor="gray600">
            Comments
          </Text>
          {isLoadingComments ? (
            <Paragraph marginBottom="spacingS">Loading comments...</Paragraph>
          ) : commentsError ? (
            <Text fontColor="red600" as="div" marginBottom="spacingS">
              {commentsError}
            </Text>
          ) : comments.length ? (
            <Flex
              flexDirection="column"
              gap="spacingS"
              marginBottom="spacingS"
              style={{ maxHeight: '260px', overflowY: 'auto' }}>
              {comments.map((commentItem) => (
                <Box
                  key={commentItem.gid}
                  style={{ borderBottom: '1px solid #e5ebed', paddingBottom: '8px' }}>
                  <Flex justifyContent="space-between" alignItems="baseline" gap="spacingXs">
                    <Text fontWeight="fontWeightMedium">{commentItem.authorName}</Text>
                    <Text fontColor="gray500" fontSize="fontSizeS">
                      {formatCommentTimestamp(commentItem.createdAt)}
                    </Text>
                  </Flex>
                  <Text as="div">{commentItem.text}</Text>
                </Box>
              ))}
            </Flex>
          ) : (
            <Text fontColor="gray500" as="div" marginBottom="spacingS">
              No comments yet.
            </Text>
          )}
          <FormControl marginBottom="none">
            <FormControl.Label>Add comment</FormControl.Label>
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              isDisabled={isBusy}
              placeholder="Write a new Asana comment"
            />
            <FormControl.HelpText>
              Posts a new comment to the linked Asana task.
            </FormControl.HelpText>
          </FormControl>
        </Box>

        <Flex justifyContent="flex-end" gap="spacingS">
          <Button variant="secondary" onClick={handleClose} isDisabled={isBusy}>
            Close
          </Button>
          <Button
            variant="secondary"
            onClick={handleAddComment}
            isLoading={isPostingComment}
            isDisabled={isBusy}>
            Add comment
          </Button>
          <Button
            onClick={handleSaveDetails}
            isLoading={isSaving}
            isDisabled={!hasDetailChanges || isBusy}>
            Save changes
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Dialog;
