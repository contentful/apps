import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { type PlainClientAPI, createClient } from 'contentful-management';

type AppActionParameters = {};

type AppInstallationParameters = {
  clientId: string;
  clientSecret: string;
  munchkinId: string;
};

function initContentfulManagementClient(context: FunctionEventContext): PlainClientAPI {
  if (!context.cmaClientOptions) {
    throw new Error(
      'Contentful Management API client options are only provided for certain function types. To learn more about using the CMA within functions, see https://www.contentful.com/developers/docs/extensibility/app-framework/functions/#using-the-cma.'
    );
  }
  return createClient(context.cmaClientOptions, {
    type: 'plain',
    defaults: {
      spaceId: context.spaceId,
      environmentId: context.environmentId,
    },
  });
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', AppActionParameters>,
  context: FunctionEventContext
) => {
  const { clientId, clientSecret, munchkinId } =
    context.appInstallationParameters as AppInstallationParameters;

  const authResponse = await fetch(
    `${munchkinId}.mktorest.com/identity/oauth/token?grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
  );
  const auth = await authResponse.json();

  const response = await fetch(
    `${munchkinId}.mktorest.com/rest/asset/v1/forms.json?maxReturn=200`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.access_token}`,
      },
    }
  );

  const formsResponse = await response.json();
  const mappedResponse = formsResponse.result.map((item: any) => {
    return {
      id: item.id,
      url: item.url,
      name: item.name,
    };
  });

  return {
    forms: mappedResponse,
  };
};
