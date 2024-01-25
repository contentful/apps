import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse, MessageResponse } from '../types';
import { fetchTenantId } from '../utils';
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
    const { name: contentTypeName } = await cma.contentType.get({ contentTypeId });
    const tenantId = await fetchTenantId(cma, appInstallationId);

    const testMessagePayload = {
      channel: {
        teamId,
        channelId,
      },
      contentTypeName,
    };

    const msTeamsBotServiceResponse = await config.msTeamsBotService.sendTestMessage(
      testMessagePayload,
      tenantId
    );

    //
    if (!msTeamsBotServiceResponse.ok) {
      throw new Error(msTeamsBotServiceResponse.error ?? 'Failed to send test message');
    }

    return msTeamsBotServiceResponse;
  }
);
