import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse, EntryActivityMessage, Topic } from '../types';
import { EntryProps } from 'contentful-management/types';
import helpers from '../helpers';
import { parametersFromAppInstallation } from '../helpers/app-installation';

interface AppActionCallParameters {
  payload: string;
  topic: string;
  eventDatetime: string;
}

export const handler = async (
  parameters: AppActionCallParameters,
  context: AppActionCallContext
): Promise<AppActionCallResponse<EntryActivityMessage[]>> => {
  const {
    cma,
    appActionCallContext: { appInstallationId },
  } = context;

  const { payload, topic: topicString, eventDatetime } = parameters;

  // TODO parse entry and topic
  const entry = JSON.parse(payload) as EntryProps;
  const contentTypeId = entry.sys.contentType.sys.id;
  const topic = topicString as Topic;

  const entryActivity = await helpers.buildEntryActivity({ entry, topic, eventDatetime }, cma);

  // TODO check app config to see if there are any subscriptions matching, return if none
  const appInstallation = await cma.appInstallation.get({ appDefinitionId: appInstallationId });
  const { tenantId, notifications } = parametersFromAppInstallation(appInstallation);

  const matchingNotifications = notifications.filter((notification) => {
    // don't send if the notification is for a different content type
    if (notification.contentTypeId !== contentTypeId) return false;

    // don't send if the topic is not "checked" in the notification subscription
    if (!notification.selectedEvents[topic]) return false;

    return true;
  });

  const entryActivityMessages = matchingNotifications.map((notification) => {
    const entryActivityMessage: EntryActivityMessage = {
      channel: {
        teamId: notification.channel.teamId,
        channelId: notification.channel.id,
      },
      entryActivity,
    };
    // TOOD send message via API here
    console.log(tenantId, entryActivityMessage);

    // TOOD include the message id in the result to innclude in the response
    // TODO handle errors one by one
    return entryActivityMessage;
  });

  return {
    ok: true,
    data: entryActivityMessages,
  };
};
