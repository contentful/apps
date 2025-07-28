import assert from 'node:assert';
import { createClient } from 'contentful-management';

const {
  CONTENTFUL_ORG_ID: organizationId = '',
  CONTENTFUL_APP_DEF_ID: appDefinitionId = '',
  CONTENTFUL_ACCESS_TOKEN: accessToken = '',
  CONTENTFUL_HOST: contentfulHost = 'api.contentful.com',
  CONTENTFUL_FUNCTION_ID: functionId = 'appEventHandler',
} = process.env;

export const createAppEventSubscription = async () => {
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

  try {
    const eventSubscription = await client.appEventSubscription.upsert(
      {
        organizationId,
        appDefinitionId,
      },
      {
        topics: ['Entry.save', 'Entry.auto_save', 'Entry.delete', 'AppInstallation.delete'],
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

    console.log('Subscription to events successfully created');
    console.dir(eventSubscription, { depth: 5 });
  } catch (error) {
    console.error(error);
  }
};

// This is needed for testing purposes
// We only want to run the script if it is the main module
if (require.main === module) {
  createAppEventSubscription();
}
