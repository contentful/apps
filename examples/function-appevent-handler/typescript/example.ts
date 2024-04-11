import { FunctionEventHandler as EventHandler } from '@contentful/node-apps-toolkit';
import { AppEventRequest } from '@contentful/node-apps-toolkit/lib/requests/typings';
const http = require('http');
const nodemailer = require('nodemailer');

const appEventHandlerHandler: EventHandler<'appevent.handler'> = (
  event: AppEventRequest,
  context
) => {
  // This function will check to see if the event is an Entry and then send it to multiple external services to be handled
  if (event.entityType === 'Entry') {
    exampleAuditServerHandler(event);
    exampleAnalyticsHandler(event);
  }

  // AppEvent Handlers don't have a response
  return;
};

const exampleAuditServerHandler = (event: AppEventRequest) => {
  // Post entire event to external audit log server
  const postData = JSON.stringify(event);
  const options = {
    hostname: 'FakeAuditLogServer.com',
    port: 80,
    path: '/path/to/your/resource',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const req = http.request(options, (res: any) => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on('data', (res: any) => {
      console.log(res);
    });
  });

  req.on('error', (error: any) => {
    console.error(error);
  });

  req.write(postData);
  req.end();
};

const exampleAnalyticsHandler = (event: AppEventRequest) => {
  if (event.entityType !== 'Entry') {
    return;
  }

  // Create a summary of just event and post it to an external analytics server
  const postData = JSON.stringify({
    userId: event.entityProps.sys.updatedBy,
    eventType: 'EntryUpdated',
  });
  const options = {
    hostname: 'FakeAnalyticsServer.com',
    port: 80,
    path: '/path/to/your/resource',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const req = http.request(options, (res: any) => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on('data', (res: any) => {
      console.log(res);
    });
  });

  req.on('error', (error: any) => {
    console.error(error);
  });

  req.write(postData);
  req.end();
};

export const handler: EventHandler = (event, context) => {
  if (event.type === 'appevent.handler') {
    return appEventHandlerHandler(event, context);
  }
  throw new Error('Unknown Event');
};
