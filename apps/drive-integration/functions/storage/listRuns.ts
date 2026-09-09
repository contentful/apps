import {
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionResponse,
} from '@contentful/node-apps-toolkit';

/**
 * TODO: NOT IMPLEMENTED. Dummy stub — does not persist to app storage.
 * App Storage is not available for external usage.
 * Replace with a real query of the `runs` table when it is.
 */
export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall
> = async (): Promise<AppActionResponse> => {
  console.log('listRuns dummy invoked');

  return {
    statusCode: 200,
    runs: [],
  };
};
