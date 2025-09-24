import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionResult, Channel } from '../../../types';
import { fetchTenantId } from '../utils';
import helpers from '../helpers';
import { withAsyncAppActionErrorHandling } from '../helpers/error-handling';

export const handler = withAsyncAppActionErrorHandling(
  async (_payload: {}, context: AppActionCallContext): Promise<AppActionResult<Channel[]>> => {
    const {
      cma,
      appActionCallContext: { appInstallationId, userId, environmentId, spaceId },
    } = context;

    const tenantId = await fetchTenantId(cma, appInstallationId);
    let channels: Channel[] = [];
    channels = await helpers.getChannelsList(tenantId, {
      appInstallationId,
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
