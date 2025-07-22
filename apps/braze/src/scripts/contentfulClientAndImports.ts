import assert from 'node:assert';
import { createClient } from 'contentful-management';

const {
  CONTENTFUL_ORG_ID: organizationId = '',
  CONTENTFUL_APP_DEF_ID: appDefinitionId = '',
  CONTENTFUL_ACCESS_TOKEN: accessToken = '',
  CONTENTFUL_HOST: contentfulHost = 'api.contentful.com',
  CONTENTFUL_FUNCTION_ID: functionId = 'appEventHandler',
} = process.env;

assert.ok(organizationId !== '', `CONTENTFUL_ORG_ID environment variable must be defined`);
assert.ok(appDefinitionId !== '', `CONTENTFUL_APP_DEF_ID environment variable must be defined`);
assert.ok(accessToken !== '', `CONTENTFUL_ACCESS_TOKEN environment variable must be defined`);

const client = createClient(
  {
    accessToken,
    host: contentfulHost,
  },
  { type: 'plain' }
);

export { client, organizationId, appDefinitionId, functionId };
