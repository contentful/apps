import assert from 'node:assert';
import contentfulManagement from 'contentful-management';

const { createClient } = contentfulManagement;

const {
  CONTENTFUL_ORG_ID: organizationId = '',
  CONTENTFUL_APP_DEF_ID: appDefinitionId = '',
  CONTENTFUL_ACCESS_TOKEN: accessToken = '',
  CONTENTFUL_SPACE_ID: spaceId = '',
  CONTENTFUL_ENVIRONMENT_ID: environmentId = 'master',
} = process.env;

const STALE_ACTION_NAMES = new Set(['Get Asana project']);

async function deleteStaleAppActions() {
  assert.ok(accessToken !== '', 'CONTENTFUL_ACCESS_TOKEN environment variable must be defined');
  assert.ok(organizationId !== '', 'CONTENTFUL_ORG_ID environment variable must be defined');
  assert.ok(appDefinitionId !== '', 'CONTENTFUL_APP_DEF_ID environment variable must be defined');
  assert.ok(spaceId !== '', 'CONTENTFUL_SPACE_ID environment variable must be defined');

  const client = createClient(
    {
      accessToken,
    },
    { type: 'plain' }
  );

  const response = await client.appAction.getManyForEnvironment({ spaceId, environmentId });
  const staleActions = response.items.filter((item) => STALE_ACTION_NAMES.has(item.name));

  if (staleActions.length === 0) {
    console.log('No stale app actions found.');
    return;
  }

  for (const action of staleActions) {
    await client.appAction.delete({
      organizationId,
      appDefinitionId,
      appActionId: action.sys.id,
    });
    console.log(`Deleted stale app action: ${action.name} (${action.sys.id})`);
  }
}

deleteStaleAppActions().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
