import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { VALIDATION_MESSAGES } from '../src/const';
import type { GetAsanaTaskRequest, GetAsanaTaskResponse } from '../src/types';
import { extractTaskGid, getPersonalAccessToken, getTask } from './asanaClient';

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<GetAsanaTaskResponse> => {
  const personalAccessToken = getPersonalAccessToken(event, context);
  const body = (event.body as GetAsanaTaskRequest | undefined) ?? {};

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

  try {
    const task = await getTask(personalAccessToken, taskGid);

    return {
      success: true,
      message: 'Asana task loaded successfully.',
      task,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error && error.message ? error.message : 'Could not load the Asana task.',
    };
  }
};
