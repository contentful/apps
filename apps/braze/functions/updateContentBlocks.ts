import {
  FunctionEventHandler,
  FunctionTypeEnum,
  FunctionEventContext,
  AppEventRequest,
} from '@contentful/node-apps-toolkit';

/**
 * App Event Handler Function Template
 *
 * This template provides the structure for creating a handler function
 * for Contentful app events.
 *
 * Customize the implementation within the handler
 * to define your specific handling logic.
 *
 * @param event - The app event to be handled
 * @param context - The execution context
 * @returns None - App event handlers don't return a response
 */
export const handler: FunctionEventHandler<FunctionTypeEnum.AppEventHandler> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  // Check if the event is an Entry event
  // You can also handle other event types like Asset or ContentType
  if (event.headers['X-Contentful-Topic'].includes('Entry')) {
    const entryEvent = event.body;

    // TODO: Implement your custom handling logic here
    // Examples: Extract data from the entry, Send data to external services, etc.
  }

  // AppEvent Handlers don't have a response
  return;
};
