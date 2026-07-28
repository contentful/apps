import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { VALIDATION_MESSAGES } from '../src/const';
import type { AddAsanaCommentRequest, AddAsanaCommentResponse } from '../src/types';
import { addCommentToTask, extractTaskGid, getPersonalAccessToken } from './asanaClient';

function getTrimmedValue(value?: string) {
  return value?.trim() ?? '';
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<AddAsanaCommentResponse> => {
  const personalAccessToken = getPersonalAccessToken(event, context);
  const body = (event.body as AddAsanaCommentRequest | undefined) ?? {};

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

  const comment = getTrimmedValue(body.comment);
  if (!comment) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.taskCommentRequired,
    };
  }

  try {
    await addCommentToTask(personalAccessToken, taskGid, comment);

    return {
      success: true,
      message: VALIDATION_MESSAGES.taskCommentAdded,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error && error.message
          ? error.message
          : VALIDATION_MESSAGES.taskCommentFailed,
    };
  }
};
