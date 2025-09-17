import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { Channel, AppActionCallResponse } from '../types';
import { fetchTenantId } from '../utils';
import helpers from '../helpers';
import { ApiError } from '../errors';

export const handler = async (
  _payload: {},
  context: AppActionCallContext
): Promise<AppActionCallResponse<Channel[]>> => {
  const {
    cma,
    appActionCallContext: { appInstallationId: appDefinitionId, userId, environmentId, spaceId },
  } = context;

  const tenantId = await fetchTenantId(cma, appDefinitionId);

  const channels = await helpers.getChannelsList(tenantId, {
    appInstallationId: appDefinitionId,
    userId,
    environmentId,
    spaceId,
  });

  return {
    ok: true,
    data: channels,
  };
};
