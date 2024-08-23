import { BaseAppSDK } from '@contentful/app-sdk';
import { GetAppActionCallParams } from 'contentful-management';
import { OptionalDefaults } from 'contentful-management/dist/typings/plain/wrappers/wrap';

export const toHAAParams = (
  appActionId: string,
  ids: BaseAppSDK['ids']
): OptionalDefaults<GetAppActionCallParams> => ({
  appActionId,
  environmentId: ids.environment,
  spaceId: ids.space,
  appDefinitionId: ids.app!,
});
