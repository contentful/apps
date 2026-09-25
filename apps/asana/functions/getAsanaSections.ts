import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { VALIDATION_MESSAGES } from '../src/const';
import type { GetAsanaSectionsRequest, GetAsanaSectionsResponse } from '../src/types';
import { getAsanaAccessToken, getProjectSections } from './asanaClient';

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<GetAsanaSectionsResponse> => {
  const body = (event.body as GetAsanaSectionsRequest | undefined) ?? {};

  const projectGid = body.projectGid?.trim();
  if (!projectGid) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.taskDestinationRequired,
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
    const sections = await getProjectSections(accessToken, projectGid);

    return {
      success: true,
      message: 'Asana groups loaded successfully.',
      sections,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error && error.message
          ? error.message
          : VALIDATION_MESSAGES.sectionsFailed,
    };
  }
};
