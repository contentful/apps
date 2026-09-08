import {
  FunctionEventHandler,
  AppActionRequest,
  FunctionTypeEnum,
  AppActionResponse,
} from '@contentful/node-apps-toolkit';
import { UpdateRunParams } from './types';

/**
 * TODO: NOT IMPLEMENTED. Dummy stub — does not persist to app storage.
 * App Storage is not available for external usage.
 * Replace with a real update of the `runs` table when it is.
 */
export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', UpdateRunParams>
): Promise<AppActionResponse> => {
  console.log('updateRun dummy invoked', event.body);

  return {
    statusCode: 200,
    success: true,
    runId: event.body.runId,
  };
};
