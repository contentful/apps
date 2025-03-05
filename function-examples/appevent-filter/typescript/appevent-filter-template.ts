import { FunctionEventHandler, FunctionTypeEnum } from '@contentful/node-apps-toolkit';
import { AppEventEntry } from '@contentful/node-apps-toolkit/lib/requests/typings';

/**
 * App Event Filter Function Template
 *
 * This template provides the structure for creating a filter function
 * for Contentful app events.
 *
 * Customize the implementation within the handler
 * to define your specific filtering logic.
 *
 * @param event - The app event to be filtered
 * @param context - The execution context
 * @returns An object with a result property (true to allow the event, false to filter it out)
 */
export const handler: FunctionEventHandler<FunctionTypeEnum.AppEventFilter> = (event, context) => {
  // Since our app event subscription only reacts to Entry events,
  // we can safely assume that the event is an AppEventEntry
  const { body } = event as AppEventEntry;

  // TODO: Implement your custom filtering logic here
  // Extract relevant fields from the entry
  // const someField = body.fields.someField['en-US'];

  // TODO: Perform analysis or validation on the extracted fields
  // Example: Analyze text, validate data, check relationships, etc.

  // TODO: Determine whether to allow or filter out the event
  // Return true to allow the event or false to filter it out
  const shouldAllowEvent = true; // Replace with your actual condition

  return { result: shouldAllowEvent };
};
