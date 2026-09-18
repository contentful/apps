import assert from 'node:assert';
import contentfulManagement from 'contentful-management';

const { createClient } = contentfulManagement;

const {
  CONTENTFUL_ORG_ID: organizationId = '',
  CONTENTFUL_APP_DEF_ID: appDefinitionId = '',
  CONTENTFUL_ACCESS_TOKEN: accessToken = '',
  CONTENTFUL_HOST: contentfulHost = 'api.contentful.com',
  CONTENTFUL_FUNCTION_ID: functionId = 'appEventHandler',
} = process.env;

async function upsertAppEventSubscription() {
  assert.ok(organizationId !== '', 'CONTENTFUL_ORG_ID environment variable must be defined');
  assert.ok(appDefinitionId !== '', 'CONTENTFUL_APP_DEF_ID environment variable must be defined');
  assert.ok(accessToken !== '', 'CONTENTFUL_ACCESS_TOKEN environment variable must be defined');

  const client = createClient(
    {
      accessToken,
      host: contentfulHost,
    },
    { type: 'plain' }
  );

  const eventSubscription = await client.appEventSubscription.upsert(
    {
      organizationId,
      appDefinitionId,
    },
    {
      topics: ['Entry.publish'],
      functions: {
        handler: {
          sys: {
            type: 'Link',
            linkType: 'Function',
            id: functionId,
          },
        },
      },
    }
  );

  console.log('Subscription to Entry.publish successfully upserted');
  console.dir(eventSubscription, { depth: 5 });
}

upsertAppEventSubscription().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
