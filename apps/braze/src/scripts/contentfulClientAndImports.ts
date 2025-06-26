import assert from 'node:assert';
import { createClient } from 'contentful-management';

const {
  CONTENTFUL_ORG_ID: organizationId = '',
  CONTENTFUL_APP_DEF_ID: appDefinitionId = '',
  CONTENTFUL_ACCESS_TOKEN: accessToken = '',
  CONTENTFUL_HOST: contentfulHost = 'api.contentful.com',
  CONTENTFUL_SPACE_ID: spaceId = '',
  CONTENTFUL_ENVIRONMENT_ID: environmentId = 'master',
  CONTENTFUL_FUNCTION_ID: functionId = 'appEventHandler',
  CONTENTFUL_CONTENT_TYPE_ID: contentTypeId = '',
} = process.env;

assert.ok(organizationId !== '', `CONTENTFUL_ORG_ID environment variable must be defined`);

assert.ok(appDefinitionId !== '', `CONTENTFUL_APP_DEF_ID environment variable must be defined`);

assert.ok(accessToken !== '', `CONTENTFUL_ACCESS_TOKEN environment variable must be defined`);

assert.ok(spaceId !== '', `CONTENTFUL_SPACE_ID environment variable must be defined`);

assert.ok(functionId !== '', `CONTENTFUL_FUNCTION_ID environment variable must be defined`);

const client = createClient(
  {
    accessToken,
    host: contentfulHost,
  },
  { type: 'plain' }
);

export {
  client,
  organizationId,
  appDefinitionId,
  accessToken,
  contentfulHost,
  spaceId,
  environmentId,
  functionId,
  contentTypeId,
};
