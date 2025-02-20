import { FunctionEventHandler as EventHandler } from '@contentful/node-apps-toolkit';
import {
  AppEventEntry,
  AppEventRequest,
  FunctionEventContext,
} from '@contentful/node-apps-toolkit/lib/requests/typings';

const exampleAuditServerHandler = async (event: AppEventEntry) => {
  // Post event sys and metadata to external audit log server
  const body = JSON.stringify({
    sys: event.body.sys,
    meta: event.body.metadata,
  });
  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body).toString(),
    },
    body,
  };

  try {
    const response = await fetch('http://FakeAuditLogServer.com/path/to/your/resource', options);
    console.log('Audit log server status code:', response.status);

    const responseData = await response.json();
    console.log(responseData);
  } catch (error) {
    console.error('Failed to send sys and metadata to audit log server', error);
  }
};

const exampleAnalyticsHandler = async (event: AppEventEntry) => {
  // Create a summary of event and post it to an external analytics server
  const body = JSON.stringify({
    entryId: event.body.sys.id,
    userId: event.body.sys.updatedBy,
    eventType: 'EntryUpdated',
  });
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body).toString(),
    },
    body,
  };

  try {
    const response = await fetch('http://FakeAnalyticsServer.com/path/to/your/resource', options);
    console.log('Analytics server status code:', response.status);

    const responseData = await response.json();
    console.log(responseData);
  } catch (error) {
    console.error(error);
  }
};

// Since our function only accepts handler events,
// we can safely assume the event is of type appevent.handler
export const handler: EventHandler<'appevent.handler'> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  // This function will check to see if the event is an Entry and then send it to multiple external services to be handled
  if (event.headers['X-Contentful-Topic'].includes('Entry')) {
    event = event as AppEventEntry;
    await exampleAuditServerHandler(event);
    await exampleAnalyticsHandler(event);
  }

  // AppEvent Handlers don't have a response
  return;
};
