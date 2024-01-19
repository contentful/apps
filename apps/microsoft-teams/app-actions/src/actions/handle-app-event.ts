import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse } from '../types';
import { EntryProps } from 'contentful-management/types';

interface AppActionCallParameters {
  payload: EntryProps;
  topic: string;
  eventDatetime: string;
}

export const handler = async (
  parameters: AppActionCallParameters,
  context: AppActionCallContext
): Promise<AppActionCallResponse<boolean>> => {
  const {
    cma,
    appActionCallContext: { appInstallationId },
  } = context;

  const appInstallation = await cma.appInstallation.get({ appDefinitionId: appInstallationId });
  console.log(appInstallation);

  // check app config to see if there are any subscriptions matching, return if none
  // build event activity
  // for each notifcation subscription build event message
  // return a list of message results

  return {
    ok: true,
    data: true,
  };
};
