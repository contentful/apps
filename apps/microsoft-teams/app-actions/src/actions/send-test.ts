import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse } from '../types';
import { fetchTenantId } from '../utils';

interface AppActionCallParameters {
  channelId: string;
  teamId: string;
  contentTypeId: string;
  spaceName: string;
}

export const handler = async (
  _payload: AppActionCallParameters,
  _context: AppActionCallContext
): Promise<AppActionCallResponse<Response | undefined>> => {
  const { channelId, teamId, contentTypeId, spaceName } = _payload;
  const {
    cma,
    appActionCallContext: { appInstallationId },
  } = _context;

  let response;

  try {
    const { name: contentTypeName } = await cma.contentType.get({ contentTypeId });
    const tenantId = await fetchTenantId(cma, appInstallationId);

    const payload = {
      teamId,
      channelId,
      tenantId,
      spaceName,
      contentTypeName,
    };

    // const sampleData = {
    //   teamId: '19:de561ed5596d41339d75472650563f9d@thread.tacv2',
    //   channelId: '19:22eb6915433146709722018f16bc6e89@thread.tacv2',
    //   tenantId: '666e56a6-1f2a-47c7-b88c-1ed9e1bb8668',
    //   spaceName: 'Microsoft Teams (development)',
    //   contentTypeName: 'Blog Post',
    // };

    response = await fetch(
      'https://msteams-bot-service.contentful.ngrok.dev/dev/api/notifications/test_notification',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': '486ca60b-8c2c-443e-b54e-67c74a4fb925',
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.ok) {
      console.log('sent successfully');
    } else {
      throw new Error('Failed to send test message');
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
    data: response,
  };
};
