import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse } from '../types';
import { fetchTenantId } from '../utils';

interface AppActionCallParameters {
  channelId: string;
  teamId: string;
  contentTypeId: string;
  spaceName: string;
}

interface BotServiceResponse {
  ok: boolean;
  data?: string;
  error?: string;
}

export const handler = async (
  _payload: AppActionCallParameters,
  _context: AppActionCallContext
): Promise<AppActionCallResponse<string>> => {
  const { channelId, teamId, contentTypeId, spaceName } = _payload;
  const {
    cma,
    appActionCallContext: { appInstallationId },
  } = _context;

  const config = {
    botServiceUrl: process.env.MSTEAMS_BOT_SERVICE_URL ?? '',
    apiKey: process.env.MSTEAMS_CLIENT_API_KEY ?? '',
  };

  let response;

  try {
    if (config.botServiceUrl === undefined) {
      throw new Error('MS Teams Bot Service URL not provided.');
    }

    if (!config.apiKey === undefined) {
      throw new Error('MS Teams Bot Service API Key not provided.');
    }

    const { name: contentTypeName } = await cma.contentType.get({ contentTypeId });
    const tenantId = await fetchTenantId(cma, appInstallationId);

    const payload = {
      teamId,
      channelId,
      tenantId,
      spaceName,
      contentTypeName,
    };

    const res = await fetch(config.botServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
      },
      body: JSON.stringify(payload),
    });

    response = (await res.json()) as BotServiceResponse;

    if (!res.ok) {
      throw new Error(response.error ?? 'Failed to send test message');
    }
  } catch (err) {
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
    data: response.data ?? '',
  };
};
