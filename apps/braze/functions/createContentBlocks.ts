import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { type PlainClientAPI, createClient } from 'contentful-management';

/**
 * App Action Function Template
 *
 * This template provides a starting point for creating an App Action function.
 * You'll need to implement your custom logic in the handler function below.
 */

// TODO: Define your App Action parameters here
// These parameters should match what you configured in your App Action definition
type AppActionParameters = {
  // Example:
  // paramName: string;
  // numberParam: number;
  // booleanParam: boolean;
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

/**
 * This handler is invoked when your App Action is called
 *
 * @param event - Contains the parameters passed to your App Action
 * @param context - Provides access to the CMA client and other context information
 */
export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', AppActionParameters>,
  context: FunctionEventContext
) => {
  // Instantiate an authenticated CMA client to interact with Contentful
  // const cma = initContentfulManagementClient(context);

  // Extract parameters from the event body
  // const { paramName } = event.body;

  // TODO: Implement your custom logic here

  // Examples of what you could do:
  // 1. Fetch or modify content with the CMA client
  // 2. Call external APIs
  // 3. Transform data
  // 4. Create or update entries

  // Return your response data
  // This will be available in the App Action response
  return {
    // Add your response data here
    message: 'TODO: Replace this with your implementation',
    timestamp: new Date().toISOString(),

    // Uncomment to see the event data during development
    // event: event,
  };
};
