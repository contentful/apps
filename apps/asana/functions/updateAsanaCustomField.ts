import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { VALIDATION_MESSAGES } from '../src/const';
import type { UpdateAsanaCustomFieldRequest, UpdateAsanaCustomFieldResponse } from '../src/types';
import { extractTaskGid, getAsanaAccessToken, updateTaskCustomField } from './asanaClient';

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<UpdateAsanaCustomFieldResponse> => {
  const body = (event.body as UpdateAsanaCustomFieldRequest | undefined) ?? {};

  const taskGid = extractTaskGid(body.taskId);
  if (!taskGid) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.taskIdRequired,
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
    return {
      success: false,
      message: VALIDATION_MESSAGES.tokenRequired,
    };
  }

  try {
    const task = await updateTaskCustomField(accessToken, taskGid, fieldGid, value);

    return {
      success: true,
      message: VALIDATION_MESSAGES.customFieldUpdated,
      task,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error && error.message
          ? error.message
          : VALIDATION_MESSAGES.customFieldUpdateFailed,
    };
  }
};
