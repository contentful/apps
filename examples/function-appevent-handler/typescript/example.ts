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
    exampleEmailServerHandler(event);
  }

  // AppEvent Handlers don't have a response
  return;
};

const exampleAuditServerHandler = (event: AppEventRequest) => {
  // Post event to external audit log server
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

const exampleEmailServerHandler = (event: AppEventRequest) => {
  // Send an email with the event data

  // Create a nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-password',
    },
  });

  // Set up the email options
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: 'recipient-email@example.com',
    subject: 'Example Email',
    text: `This is an example email. Event: ${JSON.stringify(event)}`,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error: any, info: any) => {
    if (error) {
      console.error(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

export const handler: EventHandler = (event, context) => {
  if (event.type === 'appevent.handler') {
    return appEventHandlerHandler(event, context);
  }
  throw new Error('Unknown Event');
};
