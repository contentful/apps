/**
 * Creates the sfccApi App Action linked to the sfccApi Function.
 * Run after deploying a new bundle when the App Action doesn't exist yet.
 * Usage: node scripts/create-app-action.js
 *
 * Required env vars:
 *   CONTENTFUL_CMA_TOKEN or TEST_CMA_TOKEN
 *   DEFINITIONS_ORG_ID or DEV_TESTING_ORG_ID
 *   APP_DEFINITION_ID (or uses defaults below)
 */

const { createClient } = require('contentful-management');

const accessToken = process.env.CONTENTFUL_CMA_TOKEN || process.env.TEST_CMA_TOKEN;
const organizationId = process.env.DEFINITIONS_ORG_ID || process.env.DEV_TESTING_ORG_ID;
const appDefinitionId = process.env.APP_DEFINITION_ID || process.env.DEV_APP_DEFINITION_ID;

if (!accessToken || !organizationId || !appDefinitionId) {
  console.error(
    'Missing required env vars: CONTENTFUL_CMA_TOKEN (or TEST_CMA_TOKEN), ' +
      'DEFINITIONS_ORG_ID (or DEV_TESTING_ORG_ID), APP_DEFINITION_ID (or DEV_APP_DEFINITION_ID)'
  );
  process.exit(1);
}

const client = createClient({ accessToken }, { type: 'plain' });

async function main() {
  // Check if action already exists
  const existing = await client.appAction.getMany({ organizationId, appDefinitionId });
  const alreadyExists = existing.items.find(
    (a) => a.type === 'function-invocation' && a.function?.sys?.id === 'sfccApi'
  );
  if (alreadyExists) {
    console.log(`App Action already exists: ${alreadyExists.sys.id}`);
    return alreadyExists.sys.id;
  }

  const result = await client.appAction.create(
    { organizationId, appDefinitionId },
    {
      name: 'SFCC API',
      type: 'function-invocation',
      category: 'Custom',
      function: { sys: { type: 'Link', linkType: 'Function', id: 'sfccApi' } },
      parameters: [
        { id: 'type', name: 'Action Type', type: 'Symbol', required: true },
        { id: 'query', name: 'Query', type: 'Symbol', required: false },
        { id: 'productId', name: 'Product ID', type: 'Symbol', required: false },
        { id: 'catalogId', name: 'Catalog ID', type: 'Symbol', required: false },
        { id: 'categoryId', name: 'Category ID', type: 'Symbol', required: false },
      ],
    }
  );

  console.log(`Created App Action: ${result.sys.id}`);
  return result.sys.id;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
