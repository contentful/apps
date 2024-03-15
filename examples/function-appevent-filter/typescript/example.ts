import { FunctionEventHandler as EventHandler } from '@contentful/node-apps-toolkit';

const appEventFilteringHandler: EventHandler<'appevent.filter'> = (event, context) => {
  // Filter out all events that are not of type 'Entry' (Assets, etc.)
  return {
    result: event.entityType === 'Entry',
    errors: [],
  };
};

export const handler: EventHandler = (event, context) => {
  if (event.type === 'appevent.filter') {
    return appEventFilteringHandler(event, context);
  }
  throw new Error('Unknown Event');
};
