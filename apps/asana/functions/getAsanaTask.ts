import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { VALIDATION_MESSAGES } from '../src/const';
import type { GetAsanaTaskRequest, GetAsanaTaskResponse } from '../src/types';
import { AsanaNotFoundError, extractTaskGid, getAsanaAccessToken, getTask } from './asanaClient';

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<GetAsanaTaskResponse> => {
  const body = (event.body as GetAsanaTaskRequest | undefined) ?? {};

  const taskGid = extractTaskGid(body.taskId);
  if (!taskGid) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.taskIdRequired,
    };
  }

  const accessToken = await getAsanaAccessToken(event, context);
  if (!accessToken) {
    throw new Error(VALIDATION_MESSAGES.tokenRequired);
  }

  try {
    const task = await getTask(accessToken, taskGid);

    return {
      success: true,
      message: 'Asana task loaded successfully.',
      task,
    };
  } catch (error) {
    if (error instanceof AsanaNotFoundError) {
      return {
        success: false,
        message: VALIDATION_MESSAGES.taskNotFound,
        taskDeleted: true,
      };
    }

    return {
      success: false,
      message:
        error instanceof Error && error.message ? error.message : 'Could not load the Asana task.',
    };
  }
};
