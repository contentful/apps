import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse, Channel } from '../types';
import { fetchTenantId } from '../utils';
import helpers from '../helpers';

export const handler = async (
  _payload: {},
  context: AppActionCallContext
): Promise<AppActionCallResponse<Channel[]>> => {
  const {
    cma,
    appActionCallContext: { appInstallationId },
  } = context;

  // TODO: Move this to its own file so it can be shared across actions
  const config = {
    botServiceUrl: process.env.MSTEAMS_BOT_SERVICE_BASE_URL,
    apiKey: process.env.MSTEAMS_CLIENT_API_KEY,
  };

  let channels: Channel[];

  try {
    if (config.botServiceUrl === undefined) {
      throw new Error('MS Teams Bot Service URL not provided.');
    }

    if (config.apiKey === undefined) {
      throw new Error('MS Teams Bot Service API Key not provided.');
    }

    const tenantId = await fetchTenantId(cma, appInstallationId);
    channels = await helpers.getChannelsList(config.botServiceUrl, config.apiKey, tenantId);
  } catch (err) {
    // TODO: Refactor to utilize an error handler
    if (!(err instanceof Error)) {
      return {
        ok: false,
        errors: [
          {
            message: 'Unknown error occurred',
            type: 'UnknownError',
          },
        ],
      };
    }
    return {
      ok: false,
      errors: [
        {
          message: err.message,
          type: err.constructor.name,
        },
      ],
    };
  }

  return {
    ok: true,
    data: channels,
  };
};
