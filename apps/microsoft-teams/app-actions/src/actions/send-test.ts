import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse, MessageResponse, SendMessageResult } from '../types';
import { fetchTenantId } from '../utils';
import helpers from '../helpers';
import { config } from '../config';
import { withAsyncAppActionErrorHandling } from '../helpers/error-handling';

interface AppActionCallParameters {
  channelId: string;
  teamId: string;
  contentTypeId: string;
}

export const handler = withAsyncAppActionErrorHandling(
  async (
    payload: AppActionCallParameters,
    context: AppActionCallContext
  ): Promise<AppActionCallResponse<MessageResponse>> => {
    const { channelId, teamId, contentTypeId } = payload;
    const {
      cma,
      appActionCallContext: { appInstallationId },
    } = context;

    let response: SendMessageResult;

    const { name: contentTypeName } = await cma.contentType.get({ contentTypeId });
    const tenantId = await fetchTenantId(cma, appInstallationId);

    const testMessagePayload = {
      channel: {
        teamId,
        channelId,
      },
      contentTypeName,
    };

    response = await helpers.sendTestMessage(
      config.botServiceUrl,
      config.apiKey,
      tenantId,
      testMessagePayload
    );

    if (!response.ok) {
      throw new Error(response.error ?? 'Failed to send test message');
    }

    return {
      ok: true,
      data: response.data ?? '',
    };
  }
);
