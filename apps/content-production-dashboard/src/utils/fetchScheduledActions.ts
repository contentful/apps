import { PageAppSDK } from "@contentful/app-sdk";
import { ScheduledActionProps } from "contentful-management";


export interface FetchScheduledActionsResult {
    scheduledActions: ScheduledActionProps[];
    total: number;
    fetchedAt: Date;
  }

// The current limit of scheduled actions in scheduled status is 500. Once it's reached, no additional scheduled actions can be created.

export const fetchScheduledActions = async (sdk: PageAppSDK): Promise<FetchScheduledActionsResult> => {
    const scheduledActions = await sdk.cma.scheduledActions.getMany({
        spaceId: sdk.ids.space,
        query: {
          'environment.sys.id': sdk.ids.environment,
          'sys.status[in]': 'scheduled',
          'order': 'scheduledFor.datetime',
          'limit': 500
        }
      });
      
      return {
        scheduledActions: scheduledActions.items,
        total: scheduledActions.items.length,
        fetchedAt: new Date(),
      };
};