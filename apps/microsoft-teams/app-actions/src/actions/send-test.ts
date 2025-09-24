import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionResult, MessageResponse } from '../../../types';
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
  ): Promise<AppActionResult<MessageResponse>> => {
    const { channelId, teamId, contentTypeId } = payload;
    const {
      cma,
      appActionCallContext: { appInstallationId, environmentId, userId, spaceId },
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
      tenantId,
      { appInstallationId, environmentId, userId, spaceId }
    );

    return msTeamsBotServiceResponse;
  }
);
