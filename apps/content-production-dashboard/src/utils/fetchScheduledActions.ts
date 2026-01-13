import { PageAppSDK } from '@contentful/app-sdk';
import { QueryOptions, ScheduledActionProps } from 'contentful-management';
import { getEnvironmentId } from './sdkUtils';

export interface FetchScheduledActionsResult {
  items: ScheduledActionProps[];
  total: number;
  fetchedAt: Date;
}

// The current limit of scheduled actions in scheduled status is 500. Once it's reached, no additional scheduled actions can be created.

export const fetchScheduledActions = async (
  sdk: PageAppSDK,
  query: QueryOptions = {}
): Promise<FetchScheduledActionsResult> => {
  const scheduledActions = await sdk.cma.scheduledActions.getMany({
    spaceId: sdk.ids.space,
    query: {
      'environment.sys.id': getEnvironmentId(sdk),
      'sys.status[in]': 'scheduled',
      order: 'scheduledFor.datetime',
      ...query,
      limit: 500,
    },
  });

  return {
    items: scheduledActions.items,
    total: scheduledActions.items.length,
    fetchedAt: new Date(),
  };
};
