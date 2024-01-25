import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse } from '../types';
import { fetchTenantId } from '../utils';
import helpers from '../helpers';
import { config } from '../config';
import { withAsyncAppActionErrorHandling } from '../helpers/error-handling';

interface AppActionCallParameters {
  channelId: string;
  teamId: string;
  contentTypeId: string;
  spaceName: string;
}

export const handler = withAsyncAppActionErrorHandling(
  async (
    payload: AppActionCallParameters,
    context: AppActionCallContext
  ): Promise<AppActionCallResponse<string>> => {
    const { channelId, teamId, contentTypeId, spaceName } = payload;
    const {
      cma,
      appActionCallContext: { appInstallationId },
    } = context;

    let response: AppActionCallResponse<string>;

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

    return {
      ok: true,
      data: response.data ?? '',
    };
  }
);
