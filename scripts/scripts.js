import contentful from 'contentful-management';
import dotenv from 'dotenv';
import { createSpace } from './actions/createSpace.js';
import { createAppDefinition } from './actions/createAppDefinition.js';
import { addTeamToSpace } from './actions/addTeamToSpace.js';
import { installApp } from './actions/installApp.js';
import { deleteSpace } from './actions/deleteSpace.js';
import { deleteAppDefinition } from './actions/deleteAppDefinition.js';

// Load environment variables
dotenv.config();

// Configuration from environment variables
const accessToken = process.env.TEST_CMA_TOKEN || process.env.CONTENTFUL_ACCESS_TOKEN;
const organizationId = process.env.TEST_ORG_ID || process.env.CONTENTFUL_ORGANIZATION_ID;
const appName = process.env.CONTENTFUL_APP_NAME || 'Iterable';
const teamId = process.env.CONTENTFUL_TEAM_ID;
const environmentId = process.env.CONTENTFUL_ENVIRONMENT || 'master';

console.log('Access token:', accessToken);
console.log('Organization ID:', organizationId);
console.log('App name:', appName);
console.log('Team ID:', teamId);
console.log('Environment ID:', environmentId);

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

const appDefinitionStaging = await createAppDefinition(
  client,
  organizationId,
  appName + ' (staging)'
).catch(console.error);
const appDefinitionProduction = await createAppDefinition(
  client,
  organizationId,
  appName + ' (production)'
).catch(console.error);

const stagingSpace = await createSpace(client, organizationId, appName + ' (staging)').catch(
  console.error
);
const productionSpace = await createSpace(client, organizationId, appName + ' (production)').catch(
  console.error
);

const teamSpaceMembershipStaging = await addTeamToSpace(client, stagingSpace.sys.id, teamId).catch(
  console.error
);
const teamSpaceMembershipProduction = await addTeamToSpace(
  client,
  productionSpace.sys.id,
  teamId
).catch(console.error);

const appInstallatioStaging = await installApp(
  client,
  stagingSpace.sys.id,
  environmentId,
  appDefinitionStaging.sys.id
).catch(console.error);
const appInstallationProduction = await installApp(
  client,
  productionSpace.sys.id,
  environmentId,
  appDefinitionProduction.sys.id
).catch(console.error);

console.log('\n✅ Setup complete! Finish configuring the app definitions here:\n');
console.log(
  '\n ⚙️  Staging: https://app.contentful.com/account/organizations/' +
    organizationId +
    '/apps/definitions/' +
    appDefinitionStaging.sys.id +
    '/general'
);
console.log(
  '\n ⚙️  Production: https://app.contentful.com/account/organizations/' +
    organizationId +
    '/apps/definitions/' +
    appDefinitionProduction.sys.id +
    '/general'
);

// UNDO - comment out for testing
// deleteSpace(client, productionSpace.sys.id).catch(console.error);
// deleteSpace(client, stagingSpace.sys.id).catch(console.error);
// deleteAppDefinition(client, organizationId, appDefinition.sys.id).catch(console.error);
