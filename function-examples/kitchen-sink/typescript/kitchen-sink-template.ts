import {
  FunctionEventHandler,
  FunctionEventContext,
  AppEventRequest,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';

/**
 * Unified Contentful Function Template
 *
 * This template includes handlers for all Contentful management function types:
 * - App Action
 * - App Event Handler
 * - App Event Filter
 * - App Event Transformation
 *
 * USAGE:
 * 1. Keep the function types you need
 * 2. Remove the ones you don't need
 * 3. Implement your custom logic in each handler
 */

// ============================================================
// App Action Function
// ============================================================

// TODO: Define your App Action parameters
type AppActionParameters = {
  // Example:
  // paramName: string;
  // numberParam: number;
};

/**
 * Handles App Action calls
 * This function is triggered when your custom app action is called
 */
const appActionHandler = async (
  event: AppActionRequest<'Custom', AppActionParameters>,
  context: FunctionEventContext
) => {
  // Access the CMA client to interact with Contentful
  const cma = context.cma!;

  // Extract parameters from the event body
  // const { paramName } = event.body;

  // TODO: Implement your app action logic here

  return {
    message: 'TODO: Replace with your App Action implementation',
    timestamp: new Date().toISOString(),
  };
};

// ============================================================
// App Event Handler Function
// ============================================================

/**
 * Handles app events
 * Use this to respond to events in Contentful by performing actions
 */
const appEventHandler = async (event: AppEventRequest, context: FunctionEventContext) => {
  // Check if the event is an Entry event
  if (event.headers['X-Contentful-Topic'].includes('Entry')) {
    const entryEvent = event.body;

    // TODO: Implement your event handling logic here
    // Example: Send data to external services, log events, etc.
  }

  // App Event Handlers don't return a response
  return;
};

// ============================================================
// App Event Filter Function
// ============================================================

/**
 * Filters app events
 * Use this to determine which events should be processed
 */
const appEventFilter = (event: AppEventRequest, context: FunctionEventContext) => {
  if (event.headers['X-Contentful-Topic'].includes('Entry')) {
    const entryEvent = event.body;

    // TODO: Implement your filtering logic here
    // Example: Only allow events for specific content types
    // const contentTypeId = body.sys.contentType.sys.id;
    // if (contentTypeId !== 'myContentType') {
    //   return { result: false };
    // }
  }

  // By default, allow all events
  return { result: true };
};

// ============================================================
// App Event Transformation Function
// ============================================================

/**
 * Transforms app events
 * Use this to modify events before they're delivered to subscribers
 */
const appEventTransformation = async (event: AppEventRequest, context: FunctionEventContext) => {
  if (event.headers['X-Contentful-Topic'].includes('Entry')) {
    const entryEvent = event.body;

    // TODO: Implement your transformation logic here
    // Example: Add computed fields or external data
  }

  // Return the transformed event
  return {
    body: {
      ...event.body,
      // Add your transformed fields here
      // transformedField: 'transformedValue',
    },
    headers: {
      ...event.headers,
      // Add custom headers here if needed
    },
  };
};

// ============================================================
// Main Handler - Routes events to the appropriate handler
// ============================================================

export const handler: FunctionEventHandler = async (event, context) => {
  // Route the event to the appropriate handler based on event type
  switch (event.type) {
    case 'appaction.call':
      return appActionHandler(event as AppActionRequest, context);

    case 'appevent.handler':
      return appEventHandler(event as AppEventRequest, context);

    case 'appevent.filter':
      return appEventFilter(event as AppEventRequest, context);

    case 'appevent.transformation':
      return appEventTransformation(event as AppEventRequest, context);

    default:
      throw new Error(`Unsupported event type: ${event.type}`);
  }
};
