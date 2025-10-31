#!/usr/bin/env node

const { createClient } = require('contentful-management');
const { readFileSync } = require('fs');
const { join } = require('path');

async function createCMAClient() {
  if (!process.env.CONTENTFUL_ACCESS_TOKEN) {
    throw new Error('Cannot find CMA token. Set CONTENTFUL_ACCESS_TOKEN environment variable.');
  }

  const client = createClient(
    {
      accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
      host: 'api.contentful.com',
    },
    { type: 'plain' }
  );

  return client;
}

function getBackendUrl() {
  const backendUrl = process.env.APP_BACKEND_BASE_URL;

  if (!backendUrl) {
    throw new Error(`Backend URL not found. Set APP_BACKEND_BASE_URL environment variable.`);
  }

  console.log(`🔗 Using backend URL: ${backendUrl}`);
  return backendUrl;
}

function validateEnvironment() {
  const requiredVars = [
    'CONTENTFUL_ACCESS_TOKEN',
    'CONTENTFUL_ORG_ID',
    'CONTENTFUL_APP_DEF_ID',
    'APP_BACKEND_BASE_URL',
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach((varName) => {
      console.error(`   • ${varName}`);
    });
    console.error('\nPlease set all required environment variables before running the script.');
    throw new Error('Missing required environment variables');
  }
}

async function upsertSlackAppAction({ client, organizationId, appDefinitionId, appActionId }) {
  if (!client) {
    client = await createCMAClient();
  }

  try {
    const backendUrl = getBackendUrl();

    const manifestPath = join(__dirname, '../../contentful-app-manifest.json');
    const manifestContent = readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    console.log(`📖 Reading Slack app manifest from: ${manifestPath}`);
    console.log(`📋 Found ${manifest.actions?.length || 0} actions in manifest`);

    const actionToUpdate = manifest.actions?.find((action) => action.id === appActionId);

    if (!actionToUpdate) {
      console.error(`❌ Action with ID '${appActionId}' not found in manifest.`);
      console.log('Available actions in manifest:');
      manifest.actions?.forEach((action) => {
        console.log(`   • ${action.id} - ${action.name}`);
      });
      throw new Error(`Action '${appActionId}' not found in manifest`);
    }

    console.log(`🔍 Found action to update: ${actionToUpdate.name} (${actionToUpdate.id})`);

    // Get existing app actions to check if the action exists
    const existingActions = await client.appAction.getMany({
      organizationId,
      appDefinitionId,
    });

    // Prefer matching by explicit ID. If not found, fall back to matching by name from manifest
    const existingAction =
      appActionId &&
      (existingActions.items.find((action) => action.sys.id === appActionId) ||
        existingActions.items.find((action) => action.name === actionToUpdate.name));

    // Update the existing action
    const endpointPath = `${backendUrl}${actionToUpdate.url}`;
    const payload = {
      name: actionToUpdate.name,
      category: actionToUpdate.category,
      description: actionToUpdate.description,
      parametersSchema: actionToUpdate.parametersSchema,
      resultSchema: actionToUpdate.resultSchema,
      type: 'endpoint',
      url: endpointPath,
    };

    if (existingAction) {
      console.log(`🔄 Updating existing action: ${existingAction.name} (${existingAction.sys.id})`);

      const updatedAction = await client.appAction.update(
        {
          organizationId,
          appDefinitionId,
          appActionId,
        },
        payload
      );

      console.log(
        `✅ Successfully updated action: ${updatedAction.name} (${updatedAction.sys.id})`
      );
      console.log(`   Category: ${updatedAction.category}`);
      console.log(`   Type: ${updatedAction.type}`);
      if (updatedAction.type === 'endpoint' && updatedAction.url) {
        console.log(`   URL: ${updatedAction.url}`);
      }

      return updatedAction;
    } else {
      console.log(`🆕 Creating new action: ${actionToUpdate.name} (${actionToUpdate.id})`);

      const createdAction = await client.appAction.create(
        {
          organizationId,
          appDefinitionId,
        },
        payload
      );

      console.log(
        `✅ Successfully created action: ${createdAction.name} (${createdAction.sys.id})`
      );
      console.log(`   Category: ${createdAction.category}`);
      console.log(`   Type: ${createdAction.type}`);
      if (createdAction.type === 'endpoint' && createdAction.url) {
        console.log(`   URL: ${createdAction.url}`);
      }

      return createdAction;
    }
  } catch (error) {
    console.error('❌ Error updating Slack app action:', error);
    throw error;
  }
}

async function upsertSlackAppActionFromCLI() {
  try {
    validateEnvironment();

    const organizationId = process.env.CONTENTFUL_ORG_ID;
    const appDefinitionId = process.env.CONTENTFUL_APP_DEF_ID;
    const appActionId = process.env.APP_ACTION_ID;

    console.log('🚀 Starting Slack app action upsert...');
    console.log(`📋 Organization ID: ${organizationId}`);
    console.log(`📱 App Definition ID: ${appDefinitionId}`);
    console.log(`⚡ App Action ID: ${appActionId}`);

    await upsertSlackAppAction({
      organizationId,
      appDefinitionId,
      appActionId,
    });

    console.log('\n🎉 Slack app action upsert completed successfully!');
  } catch (error) {
    console.error('❌ Failed to upsert Slack app action:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  upsertSlackAppActionFromCLI();
}

module.exports = {
  upsertSlackAppAction,
  upsertSlackAppActionFromCLI,
};
