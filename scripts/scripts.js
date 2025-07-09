import contentful from 'contentful-management';
import { createSpace,  } from './actions/createSpace.js';
import { createAppDefinition } from './actions/createAppDefinition.js';
import { addTeamToSpace } from './actions/addTeamToSpace.js';
import { installApp } from './actions/installApp.js';
import { deleteSpace } from './actions/deleteSpace.js';
import { deleteAppDefinition } from './actions/deleteAppDefinition.js';


// Fill out before running the script
const accessToken = '';
const organizationId = '';
const appName = 'Your App Name';
const teamId = ''; 
const environmentId = 'master'; 


const client = contentful.createClient({
  accessToken: accessToken,
});

const appDefinitionStaging = await createAppDefinition(client, organizationId, appName + ' (staging)').catch(console.error);
const appDefinitionProduction = await createAppDefinition(client, organizationId, appName + ' (production)').catch(console.error);

const stagingSpace = await createSpace(client, organizationId, appName + ' (staging)').catch(console.error);
const productionSpace = await createSpace(client, organizationId, appName + ' (production)').catch(console.error);

const teamSpaceMembershipStaging = await addTeamToSpace(client, stagingSpace.sys.id, teamId).catch(console.error);
const teamSpaceMembershipProduction = await addTeamToSpace(client, productionSpace.sys.id, teamId).catch(console.error);


const appInstallatioStaging = await installApp(client, stagingSpace.sys.id, environmentId, appDefinitionStaging.sys.id).catch(console.error);
const appInstallationProduction = await installApp(client, productionSpace.sys.id, environmentId, appDefinitionProduction.sys.id).catch(console.error);

console.log("\n Finish configuring the app definitions here:\n")
console.log("\n ⚙️  Staging: https://app.contentful.com/account/organizations/" + organizationId + "/apps/definitions/" + appDefinitionStaging.sys.id + "/general")
console.log("\n ⚙️  Production: https://app.contentful.com/account/organizations/" + organizationId + "/apps/definitions/" + appDefinitionProduction.sys.id + "/general")


// UNDO - comment out for testing 
// deleteSpace(client, productionSpace.sys.id).catch(console.error);
// deleteSpace(client, stagingSpace.sys.id).catch(console.error);
// deleteAppDefinition(client, organizationId, appDefinition.sys.id).catch(console.error);
  

