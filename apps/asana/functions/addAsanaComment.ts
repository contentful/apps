import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { VALIDATION_MESSAGES } from '../src/const';
import type { AddAsanaCommentRequest, AddAsanaCommentResponse } from '../src/types';
import { addCommentToTask, extractTaskGid, getAsanaAccessToken } from './asanaClient';

function getTrimmedValue(value?: string) {
  return value?.trim() ?? '';
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<AddAsanaCommentResponse> => {
  const body = (event.body as AddAsanaCommentRequest | undefined) ?? {};

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

  const accessToken = await getAsanaAccessToken(event, context);
  if (!accessToken) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.tokenRequired,
    };
  }

  try {
    await addCommentToTask(accessToken, taskGid, comment);

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
