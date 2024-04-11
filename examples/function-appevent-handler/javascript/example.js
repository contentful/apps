const http = require('http');

const appEventHandlerHandler = (event, context) => {
  if (event.entityType === 'Entry') {
    exampleAuditServerHandler(event);
    exampleAnalyticsHandler(event);
  }

  return;
};

const exampleAuditServerHandler = (event) => {
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

  const req = http.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on('data', (res) => {
      console.log(res);
    });
  });

  req.on('error', (error) => {
    console.error(error);
  });

  req.write(postData);
  req.end();
};

const exampleAnalyticsHandler = (event) => {
  if (event.entityType !== 'Entry') {
    return;
  }

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

  const req = http.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on('data', (res) => {
      console.log(res);
    });
  });

  req.on('error', (error) => {
    console.error(error);
  });

  req.write(postData);
  req.end();
};

export const handler = (event, context) => {
  if (event.type === 'appevent.handler') {
    return appEventHandlerHandler(event, context);
  }
  throw new Error('Unknown Event');
};
