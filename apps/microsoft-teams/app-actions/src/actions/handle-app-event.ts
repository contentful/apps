import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import {
  AppActionCallResponse,
  EntryActivityMessage,
  SendEntryActivityMessageResult,
  Topic,
} from '../types';
import { EntryProps } from 'contentful-management/types';
import helpers from '../helpers';
import { parametersFromAppInstallation } from '../helpers/app-installation';
import { config } from '../config';
import { withAsyncAppActionErrorHandling } from '../helpers/error-handling';

interface AppActionCallParameters {
  payload: string;
  topic: string;
  eventDatetime: string;
}

export const handler = withAsyncAppActionErrorHandling(
  async (
    parameters: AppActionCallParameters,
    context: AppActionCallContext
  ): Promise<AppActionCallResponse<SendEntryActivityMessageResult[]>> => {
    const {
      cma,
      appActionCallContext: { appInstallationId, environmentId, spaceId, userId },
    } = context;

    const { payload, topic: topicString, eventDatetime } = parameters;

    // TODO parse entry and topic
    const entry = JSON.parse(payload) as EntryProps;
    const contentTypeId = entry.sys.contentType.sys.id;
    const topic = topicString as Topic;

    const entryActivity = await helpers.buildEntryActivity({ entry, topic, eventDatetime }, cma);

    const appInstallation = await cma.appInstallation.get({ appDefinitionId: appInstallationId });
    const { tenantId, notifications } = parametersFromAppInstallation(appInstallation);

    const matchingNotifications = notifications.filter((notification) => {
      // don't send if the notification is for a different content type
      if (notification.contentTypeId !== contentTypeId) return false;

      // don't send if the topic is not "checked" in the notification subscription
      if (!notification.selectedEvents[topic]) return false;

      return true;
    });

    const entryActivityMessages = matchingNotifications.map(async (notification) => {
      const entryActivityMessage: EntryActivityMessage = {
        channel: {
          teamId: notification.channel.teamId,
          channelId: notification.channel.id,
        },
        entryActivity,
      };

      const sendMessageResult = await config.msTeamsBotService.sendEntryActivityMessage(
        entryActivityMessage,
        tenantId,
        { appInstallationId, environmentId, userId, spaceId }
      );

      return { sendMessageResult, entryActivityMessage };
    });

    const sendEntryActiviyMessageResult: SendEntryActivityMessageResult[] = await Promise.all(
      entryActivityMessages
    );

    return {
      ok: true,
      data: sendEntryActiviyMessageResult,
    };
  }
);
