import { FunctionEventHandler as EventHandler } from '@contentful/node-apps-toolkit';
import {
  AppEventEntry,
  AppEventRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { EntryPayload, hasDeletedBy, hasMetadata, hasUpdatedBy } from './types';

// TODO: Update these constants with the URLs of your external services
const AUDIT_LOG_URL = 'https://webhook.site/example-1';
const ANALYTICS_URL = 'https://webhook.site/example-2';

const exampleAuditServerHandler = async (event: AppEventEntry) => {
  // Post event sys and metadata to external audit log server
  const { body } = event as {
    body: EntryPayload;
  };

  const meta = hasMetadata(body) ? body.metadata : {};

  const postBody = JSON.stringify({
    sys: event.body.sys,
    meta,
  });

  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postBody).toString(),
    },
    body: postBody,
  };

  try {
    const response = await fetch(AUDIT_LOG_URL, options);
    console.log('Audit log server status code:', response.status);

    const responseData = await response.text();
    console.log('Audit log server response:', responseData);
  } catch (error) {
    console.error('Failed to send sys and metadata to audit log server', error);
  }
};

const exampleAnalyticsHandler = async (event: AppEventEntry) => {
  // Create a summary of event and post it to an external analytics server
  const { body } = event as {
    body: EntryPayload;
  };

  // Use the type guards to narrow down what should be used for the userId
  const userId = hasUpdatedBy(body)
    ? body.sys.updatedBy
    : hasDeletedBy(body)
    ? body.sys.deletedBy
    : '';

  const postBody = JSON.stringify({
    entryId: body.sys.id,
    userId,
    eventType: 'EntryUpdated',
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postBody).toString(),
    },
    body: postBody,
  };

  try {
    const response = await fetch(ANALYTICS_URL, options);
    console.log('Analytics server status code:', response.status);

    const responseData = await response.text();
    console.log('Analytics server response:', responseData);
  } catch (error) {
    console.error('Failed to send info to analytics server', error);
  }
};

// Since our function only accepts handler events,
// we can safely assume the event is of type appevent.handler
export const handler: EventHandler<FunctionTypeEnum.AppEventHandler> = async (
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
