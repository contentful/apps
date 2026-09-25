import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { VALIDATION_MESSAGES } from '../src/const';
import type { GetAsanaCommentsRequest, GetAsanaCommentsResponse } from '../src/types';
import { extractTaskGid, getAsanaAccessToken, getTaskComments } from './asanaClient';

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<GetAsanaCommentsResponse> => {
  const body = (event.body as GetAsanaCommentsRequest | undefined) ?? {};

  const taskGid = extractTaskGid(body.taskId);
  if (!taskGid) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.taskIdRequired,
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
    const comments = await getTaskComments(accessToken, taskGid);

    return {
      success: true,
      message: 'Asana comments loaded successfully.',
      comments,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error && error.message ? error.message : 'Could not load Asana comments.',
    };
  }
};
