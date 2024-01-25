import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse, Channel } from '../types';
import { fetchTenantId } from '../utils';
import helpers from '../helpers';
import { config } from '../config';
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

    let channels: Channel[];

    const tenantId = await fetchTenantId(cma, appInstallationId);
    channels = await helpers.getChannelsList(config.botServiceUrl, config.apiKey, tenantId);

    return {
      ok: true,
      data: channels,
    };
  }
);
