import contentful from 'contentful-management';
import dotenv from 'dotenv';
import { createSpace } from './actions/createSpace.ts';
import { createAppDefinition } from './actions/createAppDefinition.ts';
import { addTeamToSpace } from './actions/addTeamToSpace.ts';
import { installApp } from './actions/installApp.ts';
import { deleteSpace } from './actions/deleteSpace.ts';
import { deleteAppDefinition } from './actions/deleteAppDefinition.ts';

// Load environment variables
dotenv.config();

// Configuration from environment variables
const accessToken = process.env.TEST_CMA_TOKEN || process.env.CONTENTFUL_ACCESS_TOKEN;
const organizationId = process.env.TEST_ORG_ID || process.env.CONTENTFUL_ORGANIZATION_ID;
const appName = process.env.CONTENTFUL_APP_NAME || 'Test App';
const teamId = process.env.CONTENTFUL_TEAM_ID;
const environmentId = process.env.CONTENTFUL_ENVIRONMENT || 'master';

// Validate required environment variables
if (!accessToken) {
  console.error(
    '❌ Error: TEST_CMA_TOKEN or CONTENTFUL_ACCESS_TOKEN environment variable is required'
  );
  process.exit(1);
}

if (!organizationId) {
  console.error(
    '❌ Error: TEST_ORG_ID or CONTENTFUL_ORGANIZATION_ID environment variable is required'
  );
  process.exit(1);
}

if (!teamId) {
  console.error('❌ Error: CONTENTFUL_TEAM_ID environment variable is required');
  process.exit(1);
}

console.log(`🚀 Setting up ${appName} app for organization: ${organizationId}`);

const client = contentful.createClient({
  accessToken: accessToken,
});

try {
  const appDefinitionStaging = await createAppDefinition({
    client,
    organizationId,
    appName: appName + ' (staging)',
  });
  const appDefinitionProduction = await createAppDefinition({
    client,
    organizationId,
    appName: appName + ' (production)',
  });

  const stagingSpace = await createSpace({
    client,
    organizationId,
    spaceName: appName + ' (staging)',
  });
  const productionSpace = await createSpace({
    client,
    organizationId,
    spaceName: appName + ' (production)',
  });

  const teamSpaceMembershipStaging = await addTeamToSpace({
    client,
    spaceId: stagingSpace.sys.id,
    teamId,
  });
  const teamSpaceMembershipProduction = await addTeamToSpace({
    client,
    spaceId: productionSpace.sys.id,
    teamId,
  });

  const appInstallationStaging = await installApp({
    client,
    spaceId: stagingSpace.sys.id,
    environmentId,
    appDefinitionId: appDefinitionStaging.sys.id,
  });
  const appInstallationProduction = await installApp({
    client,
    spaceId: productionSpace.sys.id,
    environmentId,
    appDefinitionId: appDefinitionProduction.sys.id,
  });

  console.log('\n✅ Setup complete! Finish configuring the app definitions here:\n');
  console.log(
    `\n ⚙️  Staging: https://app.contentful.com/account/organizations/${organizationId}/apps/definitions/${appDefinitionStaging.sys.id}/general`
  );
  console.log(
    `\n ⚙️  Production: https://app.contentful.com/account/organizations/${organizationId}/apps/definitions/${appDefinitionProduction.sys.id}/general`
  );

  // UNDO - comment out for testing
  try {
    await deleteSpace({ client, spaceId: productionSpace.sys.id });
    await deleteSpace({ client, spaceId: stagingSpace.sys.id });
    await deleteAppDefinition({
      client,
      organizationId,
      appDefinitionId: appDefinitionProduction.sys.id,
    });
    await deleteAppDefinition({
      client,
      organizationId,
      appDefinitionId: appDefinitionStaging.sys.id,
    });
    console.log('🗑️  Cleanup completed successfully');
  } catch (cleanupError) {
    console.error('❌ Cleanup failed:', cleanupError);
  }
} catch (error) {
  console.error('❌ Setup failed:', error);
  process.exit(1);
}
