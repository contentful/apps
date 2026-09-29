import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { VALIDATION_MESSAGES } from '../src/const';
import type { GetAsanaCustomFieldsRequest, GetAsanaCustomFieldsResponse } from '../src/types';
import { getAsanaAccessToken, getProjectCustomFields } from './asanaClient';

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<GetAsanaCustomFieldsResponse> => {
  const body = (event.body as GetAsanaCustomFieldsRequest | undefined) ?? {};

  const projectGid = body.projectGid?.trim();
  if (!projectGid) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.taskDestinationRequired,
    };
  }

  const accessToken = await getAsanaAccessToken(event, context);
  if (!accessToken) {
    throw new Error(VALIDATION_MESSAGES.tokenRequired);
  }

  try {
    const customFields = await getProjectCustomFields(accessToken, projectGid);

    return {
      success: true,
      message: 'Asana custom fields loaded successfully.',
      customFields,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error && error.message
          ? error.message
          : `${VALIDATION_MESSAGES.customFieldsFailed} (${String(error)})`,
    };
  }
};
