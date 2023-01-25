import serverless from 'serverless-http';
import { bootstrap } from './lib/app';

export const handler = serverless(bootstrap(), {
  // serverless-http reads the body stream automatically
  // this causes issues with Slack's request verification as it requires `req.rawBody` to be set or the unparsed body stream
  // see https://github.com/slackapi/node-slack-sdk/blob/720e672b6f62ff11c905236b4c539ebe1965e083/packages/events-api/src/http-handler.ts#L168
  // this "transformer" is not part of the express app as it solves an issue introduced by serverless and the express app would work without this hack
  request: (request: { body: Buffer; rawBody?: Buffer }) => {
    request.rawBody = request.body;
  },
});
