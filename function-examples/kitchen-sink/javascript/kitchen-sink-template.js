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

/**
 * Handles App Action calls
 * This function is triggered when your custom app action is called
 *
 * @param {Object} event - Contains parameters passed to your App Action
 * @param {Object} context - Provides access to the CMA client and other context
 * @returns {Object} The response from your App Action
 */
const appActionHandler = async (event, context) => {
  // Access the CMA client to interact with Contentful
  const cma = context.cma;

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
 *
 * @param {Object} event - The app event to be handled
 * @param {Object} context - The execution context
 * @returns {void} App event handlers don't return a response
 */
const appEventHandler = async (event, context) => {
  // Check if the event is an Entry event
  if (event.headers['X-Contentful-Topic'].includes('Entry')) {
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
 *
 * @param {Object} event - The app event to be filtered
 * @param {Object} context - The execution context
 * @returns {Object} An object with a result property (true to allow, false to filter out)
 */
const appEventFilter = (event, context) => {
  if (event.headers['X-Contentful-Topic'].includes('Entry')) {
    const { body } = event;

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
 *
 * @param {Object} event - The app event to be transformed
 * @param {Object} context - The execution context
 * @returns {Object} An object with the transformed body and headers
 */
const appEventTransformation = async (event, context) => {
  if (event.headers['X-Contentful-Topic'].includes('Entry')) {
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

/**
 * Main handler that routes events to the appropriate function
 *
 * @param {Object} event - The event object
 * @param {Object} context - The execution context
 * @returns {*} The response from the appropriate handler
 */
export const handler = async (event, context) => {
  // Route the event to the appropriate handler based on event type
  switch (event.type) {
    case 'appaction.call':
      return appActionHandler(event, context);

    case 'appevent.handler':
      return appEventHandler(event, context);

    case 'appevent.filter':
      return appEventFilter(event, context);

    case 'appevent.transformation':
      return appEventTransformation(event, context);

    default:
      throw new Error(`Unsupported event type: ${event.type}`);
  }
};
