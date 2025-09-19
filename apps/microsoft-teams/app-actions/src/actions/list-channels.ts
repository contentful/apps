import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { Channel, AppActionCallResponse } from '../types';
import { fetchTenantId } from '../utils';
import helpers from '../helpers';
import { ApiError } from '../errors';
import { withAsyncAppActionErrorHandling } from '../helpers/error-handling';

export const handler = withAsyncAppActionErrorHandling(
  async (
    _payload: {},
    context: AppActionCallContext
  ): Promise<AppActionCallResponse<Channel[]>> => {
    const {
      cma,
      appActionCallContext: { appInstallationId: appDefinitionId, userId, environmentId, spaceId },
    } = context;

    const tenantId = await fetchTenantId(cma, appDefinitionId);
    let channels: Channel[] = [];
    channels = await helpers.getChannelsList(tenantId, {
      appInstallationId: appDefinitionId,
      userId,
      environmentId,
      spaceId,
    });

    return {
      ok: true,
      data: channels,
    };
  }
);
