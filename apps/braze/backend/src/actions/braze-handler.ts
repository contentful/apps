import { FunctionEventHandler as EventHandler } from '@contentful/node-apps-toolkit';
import {
  AppEventEntry,
  AppEventRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { EntryPayload, hasDeletedBy, hasMetadata, hasUpdatedBy } from './types';

// TODO: Update these constants with the URLs of your external services
const AUDIT_LOG_URL = 'https://webhook.site/61dbc5f1-d41d-4d1d-aad6-1e64bc98ad2f';
const ANALYTICS_URL = '	https://webhook.site/9f220c9a-d8a6-478a-b21c-1bf46d7139f1';

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
    //await exampleAuditServerHandler(event);
    //await exampleAnalyticsHandler(event);
    await brazeExample(event);
    await brazeUpdateExample(event);
  }

  // AppEvent Handlers don't have a response
  return;
};

const brazeExample = async (event: AppEventEntry) => {
  try {
    const url = 'https://rest.iad-03.braze.com/content_blocks/list';

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `123`,
        'Content-Type': 'application/json',
      },
    });
    console.log(response.body);
  } catch (error) {
    console.error('Failed to send sys and metadata to audit log server', error);
  }
};

const brazeUpdateExample = async (event: AppEventEntry) => {
  const body = JSON.stringify({
    content_block_id: '123',
    name: 'Entry-field-A',
    description: 'Contrary to popular belief, Lorem Ipsum is not simply random',
    content: '<h1>Hola use una app function para actualizar este contenido</h1>',
    state: 'active',
    tags: [],
  });

  try {
    const url = 'https://rest.iad-03.braze.com/content_blocks/update';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `1234`,
        'Content-Type': 'application/json',
      },
      body,
    });
    console.log(response);
  } catch (error) {
    console.error('Failed to send sys and metadata to audit log server', error);
  }
};
