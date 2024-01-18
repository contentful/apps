import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse, Channel } from '../types';
import { fetchTenantId } from '../utils';
import helpers from '../helpers';
import { config } from '../config';

export const handler = async (
  _payload: {},
  context: AppActionCallContext
): Promise<AppActionCallResponse<Channel[]>> => {
  const {
    cma,
    appActionCallContext: { appInstallationId },
  } = context;

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
