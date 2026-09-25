import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { VALIDATION_MESSAGES } from '../src/const';
import type { UpdateAsanaTaskRequest, UpdateAsanaTaskResponse } from '../src/types';
import {
  addTaskDependency,
  extractTaskGid,
  getAsanaAccessToken,
  getTask,
  removeTaskDependency,
  updateTask,
} from './asanaClient';

function getTrimmedValue(value?: string) {
  return value?.trim() ?? '';
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<UpdateAsanaTaskResponse> => {
  const body = (event.body as UpdateAsanaTaskRequest | undefined) ?? {};

  const taskGid = extractTaskGid(body.taskId);
  if (!taskGid) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.taskIdRequired,
    };
  }

  const title = getTrimmedValue(body.title);
  const notes = getTrimmedValue(body.notes);
  const assignee = getTrimmedValue(body.assignee);
  const dueDate = getTrimmedValue(body.dueDate);
  const addDependencyGid = getTrimmedValue(body.addDependencyGid);
  const removeDependencyGid = getTrimmedValue(body.removeDependencyGid);
  const hasTitleUpdate = typeof body.title === 'string';
  const hasNotesUpdate = typeof body.notes === 'string';
  const hasCompletedUpdate = typeof body.completed === 'boolean';
  const hasAssigneeUpdate = typeof body.assignee === 'string';
  const hasDueDateUpdate = typeof body.dueDate === 'string';

  const hasFieldUpdate =
    hasTitleUpdate || hasNotesUpdate || hasCompletedUpdate || hasAssigneeUpdate || hasDueDateUpdate;

  if (!hasFieldUpdate && !addDependencyGid && !removeDependencyGid) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.taskUpdateFieldsRequired,
    };
  }

  const accessToken = await getAsanaAccessToken(event, context);
  if (!accessToken) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.tokenRequired,
    };
  }

  try {
    if (addDependencyGid) {
      await addTaskDependency(accessToken, taskGid, addDependencyGid);
    }

    if (removeDependencyGid) {
      await removeTaskDependency(accessToken, taskGid, removeDependencyGid);
    }

    const task = hasFieldUpdate
      ? await updateTask(accessToken, taskGid, {
          ...(hasTitleUpdate ? { name: title } : {}),
          ...(hasNotesUpdate ? { notes } : {}),
          ...(hasCompletedUpdate ? { completed: body.completed } : {}),
          ...(hasAssigneeUpdate ? { assignee: assignee || null } : {}),
          ...(hasDueDateUpdate ? { due_on: dueDate || null } : {}),
        })
      : await getTask(accessToken, taskGid);

    return {
      success: true,
      message: VALIDATION_MESSAGES.taskUpdated,
      task,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error && error.message
          ? error.message
          : VALIDATION_MESSAGES.taskUpdateFailed,
    };
  }
};
