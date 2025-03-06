import {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';

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
  // Access the authenticated CMA client to interact with Contentful
  const cma = context.cma!;

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
