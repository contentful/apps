import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse, Channel } from '../types';
import { fetchTenantId } from '../utils';
import helpers from '../helpers';
import { withAsyncAppActionErrorHandling } from '../helpers/error-handling';

export const handler = withAsyncAppActionErrorHandling(
  async (
    _payload: {},
    context: AppActionCallContext
  ): Promise<AppActionCallResponse<Channel[]>> => {
    const {
      cma,
      appActionCallContext: { appInstallationId },
    } = context;

    const tenantId = await fetchTenantId(cma, appInstallationId);
    const channels = await helpers.getChannelsList(tenantId);

    return {
      ok: true,
      data: channels,
    };
  }
);
