import { DialogAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  Flex,
  FormControl,
  Paragraph,
  SectionHeading,
  Text,
  TextLink,
  Textarea,
} from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useMemo, useState } from 'react';
import { VALIDATION_MESSAGES } from '../const';
import type {
  AddAsanaCommentResponse,
  GetAsanaTaskResponse,
  TaskDetailsDialogParameters,
  TaskDetailsDialogResult,
  UpdateAsanaTaskResponse,
} from '../types';

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

  const [description, setDescription] = useState(invocation.taskDescription ?? '');
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);

  const hasDescriptionChanges = useMemo(
    () => description.trim() !== (task?.taskDescription ?? '').trim(),
    [description, task?.taskDescription]
  );

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

  const refreshTask = async () => {
    if (!task) {
      throw new Error('No linked Asana task is available in this dialog.');
    }

    const response = await callAction<GetAsanaTaskResponse>('getAsanaTaskAction', {
      taskId: task.taskGid,
    });

    if (!response.success || !response.task) {
      throw new Error(response.message || 'Could not refresh the Asana task.');
    }

    return response.task;
  };

  const handleSaveDescription = async () => {
    if (!task || !hasDescriptionChanges) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await callAction<UpdateAsanaTaskResponse>('updateAsanaTaskAction', {
        taskId: task.taskGid,
        notes: description.trim(),
      });

      if (!response.success || !response.task) {
        throw new Error(response.message || VALIDATION_MESSAGES.taskUpdateFailed);
      }

      sdk.notifier.success(VALIDATION_MESSAGES.taskUpdated);
      sdk.close({ updatedTask: response.task } satisfies TaskDetailsDialogResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : VALIDATION_MESSAGES.taskUpdateFailed;
      sdk.notifier.error(message);
    } finally {
      setIsSaving(false);
    }
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

      const refreshedTask = await refreshTask();
      sdk.notifier.success(VALIDATION_MESSAGES.taskCommentAdded);
      sdk.close({ updatedTask: refreshedTask } satisfies TaskDetailsDialogResult);
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
        <Paragraph marginBottom="spacingM">No linked Asana task was provided to this dialog.</Paragraph>
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

        <Flex gap="spacingL" flexWrap="wrap">
          <Box>
            <Text as="div" marginBottom="spacing2Xs" fontColor="gray600">
              Status
            </Text>
            <Text>{task.status || 'Unknown'}</Text>
          </Box>
          <Box>
            <Text as="div" marginBottom="spacing2Xs" fontColor="gray600">
              Assignee
            </Text>
            <Text>{task.assigneeName || 'Unassigned'}</Text>
          </Box>
          <Box>
            <Text as="div" marginBottom="spacing2Xs" fontColor="gray600">
              Due date
            </Text>
            <Text>{task.dueDate || 'No due date'}</Text>
          </Box>
        </Flex>

        <FormControl>
          <FormControl.Label>Description</FormControl.Label>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={8}
            isDisabled={isSaving || isPostingComment}
          />
          <FormControl.HelpText>
            Updates the linked Asana task description.
          </FormControl.HelpText>
        </FormControl>

        <Box>
          <FormControl marginBottom="none">
            <FormControl.Label>Add comment</FormControl.Label>
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              isDisabled={isSaving || isPostingComment}
              placeholder="Write a new Asana comment"
            />
            <FormControl.HelpText>
              Posts a new comment to the linked Asana task.
            </FormControl.HelpText>
          </FormControl>
        </Box>

        <Flex justifyContent="flex-end" gap="spacingS">
          <Button variant="secondary" onClick={handleClose} isDisabled={isSaving || isPostingComment}>
            Close
          </Button>
          <Button
            variant="secondary"
            onClick={handleAddComment}
            isLoading={isPostingComment}
            isDisabled={isSaving || isPostingComment}>
            Add comment
          </Button>
          <Button
            onClick={handleSaveDescription}
            isLoading={isSaving}
            isDisabled={!hasDescriptionChanges || isSaving || isPostingComment}>
            Save description
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Dialog;
