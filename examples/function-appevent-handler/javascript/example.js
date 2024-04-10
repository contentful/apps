import { FunctionEventHandler as EventHandler } from '@contentful/node-apps-toolkit';
const http = require('http');

const appEventHandlerHandler = (event, context) => {
  // This function will check to see if the event is an Entry and then send it to a (fake) JSON server
  if (event.entityType === 'Entry') {
    const postData = JSON.stringify(event);
    const options = {
      hostname: 'fakejsonserver.com',
      port: 80,
      path: '/path/to/your/resource',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      console.log(`statusCode: ${res.statusCode}`);

      res.on('data', (res) => {
        process.stdout.write(res);
      });
    });

    req.on('error', (error) => {
      console.error(error);
    });

    req.write(postData);
    req.end();
  }

  // AppEvent Handlers don't have a response
  return;
};

export const handler = (event, context) => {
  if (event.type === 'appevent.handler') {
    return appEventHandlerHandler(event, context);
  }
  throw new Error('Unknown Event');
};
