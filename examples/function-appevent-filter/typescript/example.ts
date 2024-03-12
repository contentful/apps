import {
  FunctionEventHandler,
  FunctionEventType,
  FunctionEventContext,
} from '@contentful/node-apps-toolkit';
import {
  AppEventFilterRequest,
  AppEventFilterResponse,
} from '@contentful/node-apps-toolkit/lib/requests/typings';

const appEventFilteringHandler: FunctionEventHandler<'appevent.filter'> = (
  event: AppEventFilterRequest,
  context: FunctionEventContext
): AppEventFilterResponse => {
  // Filter out all events that are not of type 'Entry' (Assets, etc.)
  return {
    result: event.entityType === 'Entry',
    errors: [],
  };
};

export const handler: FunctionEventHandler = (
  event: any,
  context: FunctionEventContext
): AppEventFilterResponse | Promise<AppEventFilterResponse> => {
  if (event.type === 'appevent.filter') {
    return appEventFilteringHandler(event, context);
  }
  throw new Error('Unknown Event');
};
