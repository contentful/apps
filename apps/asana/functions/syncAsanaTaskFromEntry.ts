import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { VALIDATION_MESSAGES } from '../src/const';
import type { SyncAsanaTaskFromEntryRequest, SyncAsanaTaskFromEntryResponse } from '../src/types';
import { getTaskLinkForEntry } from '../src/utils/taskLinkStore';
import {
  getAsanaAccessToken,
  getTask,
  moveTaskToSection,
  TaskRefreshFailedError,
  updateTask,
} from './asanaClient';

function getTrimmedValue(value?: string) {
  return value?.trim() ?? '';
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<SyncAsanaTaskFromEntryResponse> => {
  const body = (event.body as SyncAsanaTaskFromEntryRequest | undefined) ?? {};

  const entryId = getTrimmedValue(body.entryId);
  if (!entryId) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.entryIdRequired,
    };
  }

  const sectionGid = getTrimmedValue(body.sectionGid);
  const title = getTrimmedValue(body.title);
  const notes = getTrimmedValue(body.notes);
  const assignee = getTrimmedValue(body.assignee);
  const dueDate = getTrimmedValue(body.dueDate);
  const hasCompletedUpdate = typeof body.completed === 'boolean';
  const hasTitleUpdate = typeof body.title === 'string';
  const hasNotesUpdate = typeof body.notes === 'string';
  const hasAssigneeUpdate = typeof body.assignee === 'string';
  const hasDueDateUpdate = typeof body.dueDate === 'string';

  const hasFieldUpdate =
    hasCompletedUpdate || hasTitleUpdate || hasNotesUpdate || hasAssigneeUpdate || hasDueDateUpdate;

  if (!hasFieldUpdate && !sectionGid) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.taskUpdateFieldsRequired,
    };
  }

  if (!context.cma) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.entryNotLinked,
    };
  }

  const taskLink = await getTaskLinkForEntry(context.cma, entryId);
  const taskGid = taskLink?.taskGid ?? '';
  if (!taskGid) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.entryNotLinked,
    };
  }

  const accessToken = await getAsanaAccessToken(event, context);
  if (!accessToken) {
    throw new Error(VALIDATION_MESSAGES.tokenRequired);
  }

  try {
    if (sectionGid) {
      await moveTaskToSection(accessToken, taskGid, sectionGid);
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
    if (error instanceof TaskRefreshFailedError) {
      return {
        success: true,
        message: error.message,
        task: error.task,
      };
    }

    return {
      success: false,
      message:
        error instanceof Error && error.message
          ? error.message
          : VALIDATION_MESSAGES.taskUpdateFailed,
    };
  }
};
