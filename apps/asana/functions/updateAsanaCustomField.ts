import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { VALIDATION_MESSAGES } from '../src/const';
import type { UpdateAsanaCustomFieldRequest, UpdateAsanaCustomFieldResponse } from '../src/types';
import { getTaskLinkForEntry } from '../src/utils/taskLinkStore';
import {
  extractTaskGid,
  getAsanaAccessToken,
  TaskRefreshFailedError,
  updateTaskCustomField,
} from './asanaClient';

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<UpdateAsanaCustomFieldResponse> => {
  const body = (event.body as UpdateAsanaCustomFieldRequest | undefined) ?? {};

  let taskGid = extractTaskGid(body.taskId);
  const entryId = body.entryId?.trim() ?? '';
  if (!taskGid && entryId && context.cma) {
    const taskLink = await getTaskLinkForEntry(context.cma, entryId);
    taskGid = taskLink?.taskGid ?? '';
  }

  if (!taskGid) {
    return {
      success: false,
      message: entryId ? VALIDATION_MESSAGES.entryNotLinked : VALIDATION_MESSAGES.taskIdRequired,
    };
  }

  const fieldGid = body.fieldGid?.trim();
  if (!fieldGid) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.customFieldRequired,
    };
  }

  let value: unknown = null;
  try {
    value = typeof body.value === 'string' && body.value.trim() ? JSON.parse(body.value) : null;
  } catch {
    return {
      success: false,
      message: VALIDATION_MESSAGES.customFieldInvalidValue,
    };
  }

  const accessToken = await getAsanaAccessToken(event, context);
  if (!accessToken) {
    throw new Error(VALIDATION_MESSAGES.tokenRequired);
  }

  try {
    const task = await updateTaskCustomField(accessToken, taskGid, fieldGid, value);

    return {
      success: true,
      message: VALIDATION_MESSAGES.customFieldUpdated,
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
          : VALIDATION_MESSAGES.customFieldUpdateFailed,
    };
  }
};
