#!/usr/bin/env node

import 'dotenv/config';
import contentful, { createClient } from 'contentful-management';
import { readFileSync } from 'fs';
import { join } from 'path';

interface UpsertAppActionProps {
  client?: contentful.PlainClientAPI;
  organizationId: string;
  appDefinitionId: string;
  appActionId: string;
  stage?: string;
}

interface AppAction {
  id: string;
  name: string;
  category: string;
  description: string;
  type: string;
  url?: string;
  allowNetworks: string[];
  parametersSchema?: any;
  resultSchema?: any;
}

interface AppManifest {
  name: string;
  description: string;
  id: string;
  category: string;
  version: string;
  actions: AppAction[];
}

async function createCMAClient(): Promise<contentful.PlainClientAPI> {
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

function getBackendUrl(): string {
  const backendUrl = process.env.REACT_APP_BACKEND_BASE_URL;

  if (!backendUrl) {
    throw new Error(`Backend URL not found. Set REACT_APP_BACKEND_BASE_URL environment variable.`);
  }

  console.log(`🔗 Using backend URL: ${backendUrl}`);
  return backendUrl;
}

function validateEnvironment(): void {
  const requiredVars = [
    'CONTENTFUL_ACCESS_TOKEN',
    'CONTENTFUL_ORG_ID',
    'CONTENTFUL_APP_DEF_ID',
    'APP_ACTION_ID',
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

export async function upsertSlackAppAction({
  client,
  organizationId,
  appDefinitionId,
  appActionId,
}: UpsertAppActionProps) {
  if (!client) {
    client = await createCMAClient();
  }

  try {
    // Get the backend URL
    const backendUrl = getBackendUrl();

    // Read the manifest file from the Slack app directory
    const manifestPath = join(__dirname, '../contentful-app-manifest.json');
    const manifestContent = readFileSync(manifestPath, 'utf8');
    const manifest: AppManifest = JSON.parse(manifestContent);

    console.log(`📖 Reading Slack app manifest from: ${manifestPath}`);
    console.log(`📋 Found ${manifest.actions?.length || 0} actions in manifest`);

    // Find the specific action in the manifest
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

    const existingAction = existingActions.items.find((action) => action.sys.id === appActionId);

    if (existingAction) {
      console.log(`🔄 Updating existing action: ${existingAction.name} (${existingAction.sys.id})`);

      // Update the existing action
      const endpointPath = `${backendUrl}${actionToUpdate.url}`;
      const updateData: any = {
        name: actionToUpdate.name,
        category: actionToUpdate.category as 'Entries.v1.0' | 'Notification.v1.0' | 'Custom',
        description: actionToUpdate.description,
        parametersSchema: actionToUpdate.parametersSchema,
        resultSchema: actionToUpdate.resultSchema,
        type: 'endpoint',
        url: endpointPath,
      };

      const updatedAction = await client.appAction.update(
        {
          organizationId,
          appDefinitionId,
          appActionId,
        },
        updateData
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

      // Create a new action
      const endpointPath = `${backendUrl}${actionToUpdate.url}`;
      const actionData: any = {
        name: actionToUpdate.name,
        category: 'Custom',
        description: actionToUpdate.description,
        parametersSchema: actionToUpdate.parametersSchema,
        resultSchema: actionToUpdate.resultSchema,
        type: 'endpoint',
        url: endpointPath,
      };

      const createdAction = await client.appAction.create(
        {
          organizationId,
          appDefinitionId,
        },
        actionData
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

export async function upsertSlackAppActionFromCLI() {
  try {
    validateEnvironment();

    const organizationId = process.env.CONTENTFUL_ORG_ID!;
    const appDefinitionId = process.env.CONTENTFUL_APP_DEF_ID!;
    const appActionId = process.env.APP_ACTION_ID!;

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

// Run from command line if this file is executed directly
if (require.main === module) {
  upsertSlackAppActionFromCLI();
}
