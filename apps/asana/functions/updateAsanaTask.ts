import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { VALIDATION_MESSAGES } from '../src/const';
import type { UpdateAsanaTaskRequest, UpdateAsanaTaskResponse } from '../src/types';
import { extractTaskGid, getPersonalAccessToken, updateTask } from './asanaClient';

function getTrimmedValue(value?: string) {
  return value?.trim() ?? '';
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<UpdateAsanaTaskResponse> => {
  const personalAccessToken = getPersonalAccessToken(event, context);
  const body = (event.body as UpdateAsanaTaskRequest | undefined) ?? {};

  if (!personalAccessToken) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.tokenRequired,
    };
  }

  const taskGid = extractTaskGid(body.taskId);
  if (!taskGid) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.taskIdRequired,
    };
  }

  const title = getTrimmedValue(body.title);
  const notes = getTrimmedValue(body.notes);
  const hasTitleUpdate = typeof body.title === 'string';
  const hasNotesUpdate = typeof body.notes === 'string';
  const hasCompletedUpdate = typeof body.completed === 'boolean';

  if (!hasTitleUpdate && !hasNotesUpdate && !hasCompletedUpdate) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.taskUpdateFieldsRequired,
    };
  }

  try {
    const task = await updateTask(personalAccessToken, taskGid, {
      ...(hasTitleUpdate ? { name: title } : {}),
      ...(hasNotesUpdate ? { notes } : {}),
      ...(hasCompletedUpdate ? { completed: body.completed } : {}),
    });

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
