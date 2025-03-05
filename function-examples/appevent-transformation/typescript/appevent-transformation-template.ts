import {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { AppEventEntry, AppEventRequest } from '@contentful/node-apps-toolkit/lib/requests/typings';

/**
 * App Event Transformation Function Template
 *
 * This template provides the structure for creating a transformation function
 * for Contentful app events.
 *
 * Transformation functions allow you to modify event payloads before they are
 * delivered to subscribers. You can add, remove, or change data in the payload.
 *
 * @param event - The app event to be transformed
 * @param context - The execution context with app installation parameters
 * @returns An object with the transformed body and headers
 */
export const handler: FunctionEventHandler<FunctionTypeEnum.AppEventTransformation> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  // TODO: Implement your custom transformation logic here

  // Check the event type
  if (event.headers['X-Contentful-Topic'].includes('Entry')) {
    const entryEvent = event as AppEventEntry;

    // TODO: Process or transform specific fields
    // Example: Transform specific fields based on your requirements
    // const someField = entryEvent.body.fields.someField?.['en-US'];
    // const transformedField = someFunction(someField);

    // TODO: Add additional fields or data to the payload
    // const additionalData = await fetchExternalData(apiKey);
  }

  // Return the transformed event
  // You should return an object with the body and headers
  return {
    body: {
      ...event.body,
      // Add your transformed fields here
      // transformedField: transformedValue,
    },
    headers: {
      ...event.headers,
      // Add any custom headers here
      // 'X-Custom-Header': 'custom-value',
    },
  };
};
