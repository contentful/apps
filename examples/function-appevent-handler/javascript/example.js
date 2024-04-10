const http = require('http');
const nodemailer = require('nodemailer');

const appEventHandlerHandler = (event, context) => {
  if (event.entityType === 'Entry') {
    exampleAuditServerHandler(event);
    exampleEmailServerHandler(event);
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

const exampleEmailServerHandler = (event) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-password',
    },
  });

  const mailOptions = {
    from: 'your-email@gmail.com',
    to: 'recipient-email@example.com',
    subject: 'Example Email',
    text: `This is an example email. Event: ${JSON.stringify(event)}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

export const handler = (event, context) => {
  if (event.type === 'appevent.handler') {
    return appEventHandlerHandler(event, context);
  }
  throw new Error('Unknown Event');
};
