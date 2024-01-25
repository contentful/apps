import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse } from '../types';
import { fetchTenantId } from '../utils';
import helpers from '../helpers';
import { config } from '../config';

interface AppActionCallParameters {
  channelId: string;
  teamId: string;
  contentTypeId: string;
  spaceName: string;
}

export const handler = async (
  payload: AppActionCallParameters,
  context: AppActionCallContext
): Promise<AppActionCallResponse<string>> => {
  const { channelId, teamId, contentTypeId, spaceName } = payload;
  const {
    cma,
    appActionCallContext: { appInstallationId },
  } = context;

  let response: AppActionCallResponse<string>;

  try {
    const { name: contentTypeName } = await cma.contentType.get({ contentTypeId });
    const tenantId = await fetchTenantId(cma, appInstallationId);

    const testNotificationPayload = {
      teamId,
      channelId,
      tenantId,
      spaceName,
      contentTypeName,
    };

    response = await helpers.sendTestNotification(
      config.botServiceUrl,
      config.apiKey,
      testNotificationPayload
    );

    if (!response.ok) {
      throw new Error(response.error.message ?? 'Failed to send test message');
    }
  } catch (err) {
    // TODO: Refactor to utilize an error handler
    if (!(err instanceof Error)) {
      return {
        ok: false,
        error: {
          message: 'Unknown error occurred',
          type: 'UnknownError',
        },
      };
    }
    return {
      ok: false,
      error: {
        message: err.message,
        type: err.constructor.name,
      },
    };
  }

  return {
    ok: true,
    data: response.data ?? '',
  };
};
