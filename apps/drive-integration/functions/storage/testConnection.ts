import {
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionResponse,
} from '@contentful/node-apps-toolkit';

/**
 * TODO: NOT IMPLEMENTED. Dummy stub — does not probe app storage.
 * App Storage is not available for external usage.
 * Replace with a real read of the `runs` table when it is.
 */
export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall
> = async (): Promise<AppActionResponse> => {
  console.log('testConnection dummy invoked');

  return {
    statusCode: 200,
    connected: true,
  };
};
