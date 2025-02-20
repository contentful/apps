import { FunctionEventHandler as EventHandler } from '@contentful/node-apps-toolkit';
import {
  AppEventRequest,
  FunctionEventContext,
} from '@contentful/node-apps-toolkit/lib/requests/typings';

// Since our function only accepts handler events,
// we can safely assume the event is of type appevent.handler
export const handler: EventHandler<'appevent.handler'> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  return;
};
