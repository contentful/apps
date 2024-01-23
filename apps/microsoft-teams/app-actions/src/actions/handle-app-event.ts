import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse, EntryActivityMessage, Topic } from '../types';
import { EntryProps } from 'contentful-management/types';
import helpers from '../helpers';

interface AppActionCallParameters {
  payload: EntryProps;
  topic: string;
  eventDatetime: string;
}

export const handler = async (
  parameters: AppActionCallParameters,
  context: AppActionCallContext
): Promise<AppActionCallResponse<EntryActivityMessage>> => {
  const {
    cma,
    appActionCallContext: { appInstallationId },
  } = context;
  // TODO parse entry and topic
  const { payload: entry, topic: topicString, eventDatetime } = parameters;
  const topic = topicString as Topic;

  const entryActivity = await helpers.buildEntryActivity({ entry, topic, eventDatetime }, cma);

  // check app config to see if there are any subscriptions matching, return if none
  const appInstallation = await cma.appInstallation.get({ appDefinitionId: appInstallationId });

  // fetch all the notification subscriptions
  // for each notifcation subscription build event message with channel id / team id + entry activity
  // call the MS teams bot API for each message and collect results
  // return a list of message results

  return {
    ok: true,
    data: {
      channel: {
        channelId: 'TODO-channel-id',
        teamId: 'TODO-team-id',
      },
      entryActivity,
    },
  };
};
