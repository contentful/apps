const envOr = (key: string, defaultValue: string) => process.env[key] ?? defaultValue;

export const config = {
  dynamo: {
    endpoint: envOr('DYNAMO_ENDPOINT', 'local-dynamo-endpoint'),
    timeout: 10000,
    tableName: envOr('DYNAMO_TABLE_NAME', 'dynamo-table-name'),
  },
  slack: {
    clientId: envOr('SLACK_CLIENT_ID', 'slack-client-id'),
    clientSecret: envOr('SLACK_CLIENT_SECRET', 'slack-client-secret'),
    signingSecret: envOr('SLACK_SIGNING_SECRET', 'slack-signing-secret'),
  },
  appId: envOr('APP_ID', 'unknown'),
  frontendUrl: envOr('FRONTEND_URL', 'https://localhost:3001'),
  workflowsUrl: envOr('WORKFLOWS_URL', 'https://localhost:3001'),
  backendUrl: envOr('BACKEND_URL', 'https://localhost:3000/dev/api'),
  signingSecret: envOr('SIGNING_SECRET', 'shhhh'),
  serverless: {
    pathPrefix: envOr('SERVERLESS_PATH_PREFIX', '/dev'),
  },
};

export type DynamoConfiguration = (typeof config)['dynamo'];
export type SlackConfiguration = (typeof config)['slack'];
export type ServerlessConfiguration = (typeof config)['serverless'];
