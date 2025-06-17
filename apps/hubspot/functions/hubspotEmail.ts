import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';

import type { AppActionParameters, HubSpotRequestContext } from './types';
import { getEmails } from './email-http-methods/getEmails';
import { postEmail } from './email-http-methods/postEmail';
import { patchEmail } from './email-http-methods/patchEmail';
import { deleteEmail } from './email-http-methods/deleteEmail';

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', AppActionParameters>,
  context: FunctionEventContext
) => {
  try {
    const { method } = event.body;
    const apiKey = context.appInstallationParameters.apiKey;

    if (!apiKey) {
      return { response: { error: 'Missing apiKey from installation parameters' } };
    }

    if (!method) {
      return { response: { error: 'Missing method from parameters' } };
    }

    const hubspotContext: HubSpotRequestContext = {
      apiKey,
      event,
      context,
    };

    switch (method.toUpperCase()) {
      case 'GET':
        return await getEmails(hubspotContext);

      case 'POST':
        return await postEmail(hubspotContext);

      case 'PATCH':
        return await patchEmail(hubspotContext);

      case 'DELETE':
        return await deleteEmail(hubspotContext);

      default:
        return { response: { error: `Unsupported HTTP method: ${method}` } };
    }
  } catch (error) {
    console.error('HubSpot App Action error:', error);
    return {
      response: { error: 'An error occurred' },
    };
  }
};
