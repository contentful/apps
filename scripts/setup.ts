import contentful from 'contentful-management';
import dotenv from 'dotenv';
import { createSpace } from './actions/createSpace.ts';
import { createAppDefinition } from './actions/createAppDefinition.ts';
import { addTeamToSpace } from './actions/addTeamToSpace.ts';
import { installApp } from './actions/installApp.ts';
import { teardown } from './actions/teardown.ts';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in scripts directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Configuration from environment variables
const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN || process.env.TEST_CMA_TOKEN;
const organizationId = process.env.CONTENTFUL_ORGANIZATION_ID || process.env.TEST_ORG_ID;
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

  // // FOR TESTING - uncomment to undo setup
  // await teardown({
  //   client,
  //   organizationId,
  //   spaceIdStaging: stagingSpace.sys.id,
  //   spaceIdProduction: productionSpace.sys.id,
  //   appDefinitionIdStaging: appDefinitionStaging.sys.id,
  //   appDefinitionIdProduction: appDefinitionProduction.sys.id,
  // });
} catch (error) {
  console.error('❌ Setup failed:', error);
  process.exit(1);
}
