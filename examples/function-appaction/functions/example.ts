import { FunctionEventHandler } from '@contentful/node-apps-toolkit';
import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit/lib/requests/typings';
import { type PlainClientAPI, createClient } from 'contentful-management';

// When using a 'Custom' category App Action, you may define the parameters that the App Action will receive.
// This should match what you configured in the App Action definition.
type MyCustomAppActionParameters = {
  foo: string;
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
  event: AppActionRequest<'Custom', MyCustomAppActionParameters>, // For better typing, specify your App Action category and, if using the 'Custom' category, parameter types here
  context: FunctionEventContext
) => {
  const cma = initContentfulManagementClient(context); // App Action Call Functions have access to the authenticated CMA client

  const { foo } = event.body; // Access the parameters passed to the App Action Call via the event body

  console.log('this is from my app action function!');
  return {
    action: 'this is my action',
    event,
    foo,
    someExampleUsingCMA: await cma.locale.getMany({}),
  };
};
