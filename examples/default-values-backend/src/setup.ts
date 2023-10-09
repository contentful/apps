/*
 * This file is a setup script that uses your Content Management API (CMA) token
 * and the variables you specify in the ".env" file to:
 * + Create a new App
 * + Add the app to your Space
 * + Create a RSA key pair and use it to authenticate your app
 * + Create an example Content Type
 * + Set up a webhook that reacts to new Entries
 */

import fs from 'fs';
import path from 'path';
import * as contentful from 'contentful-management';
require('dotenv').config();
const { ORG_ID, SPACE_ID, ENVIRONMENT_ID, HOSTED_APP_URL, CMA_TOKEN, PRIVATE_APP_KEY } =
  process.env;

const client = contentful.createClient(
  {
    // This is the access token for this space. Normally you get the token in the Contentful web app
    accessToken: CMA_TOKEN as string,
  },
  {
    type: 'plain',
    defaults: {
      spaceId: SPACE_ID,
      environmentId: ENVIRONMENT_ID,
    },
  }
);

// ---------------------------------------
// Main setup flow
// ---------------------------------------

async function main() {
  // Create App
  let APP_ID;
  if (process.env.APP_ID) {
    APP_ID = process.env.APP_ID;
    console.log(
      'Found an existing APP_ID in .env, re-using it. If you want to set up a new app, remove APP_ID from .env'
    );
  } else {
    APP_ID = await createAppDefinition();
    fs.appendFileSync(path.join(__dirname, '..', '.env'), `APP_ID=${APP_ID}\n`);
  }

  // Install App into space/environment
  await installApp(APP_ID, {
    // Here you are able to pass installation-specific configuration variables
    defaultValue: 'This is the default value set by your app',
  });

  // Create an App Key
  if (fs.existsSync(path.join(__dirname, '..', PRIVATE_APP_KEY as string))) {
    console.log('Found an existing private key under %s, re-using it.', PRIVATE_APP_KEY);
  } else {
    await createAppKey(APP_ID);
  }

  // Create an example Content Type
  if (process.env.CONTENT_TYPE_ID) {
    console.log(
      'Found an existing CONTENT_TYPE_ID in .env, re-using it. If you want to set up a new content type, remove CONTENT_TYPE_ID from .env'
    );
  } else {
    const CONTENT_TYPE_ID = await createContentType();
    fs.appendFileSync(path.join(__dirname, '..', '.env'), `CONTENT_TYPE_ID=${CONTENT_TYPE_ID}\n`);
  }

  // Add event webhook
  await createAppEvent(APP_ID);

  console.log(`Created new APP APP_ID=${APP_ID}`);
}

main().catch((e) => {
  console.error(e);
});

// ---------------------------------------
// Helper functions
// ---------------------------------------

async function createAppDefinition() {
  try {
    const appDefinitionProps = await client.appDefinition.create(
      {
        organizationId: ORG_ID,
      },
      {
        name: 'Default field values',
        src: `${HOSTED_APP_URL}/frontend`,
        locations: [{ location: 'app-config' }],
      }
    );
    console.log(`Created app definition. APP_ID is ${appDefinitionProps.sys.id}`);
    return appDefinitionProps.sys.id;
  } catch (err) {
    throw new Error(`App definition creation failed: ${err instanceof Error ? err.message : err}`);
  }
}

async function installApp(APP_ID: string, parameters: contentful.FreeFormParameters) {
  try {
    await client.appInstallation.upsert(
      {
        appDefinitionId: APP_ID,
      },
      {
        parameters,
      }
    );
    console.log(`Installed app!`);
  } catch (err) {
    throw new Error(`App installation failed: ${err instanceof Error ? err.message : err}`);
  }
}

async function createAppKey(APP_ID: string) {
  try {
    const { generated, jwk } = await client.appKey.create(
      {
        organizationId: ORG_ID,
        appDefinitionId: APP_ID,
      },
      { generate: true }
    );
    if (generated) {
      const filename = path.join(__dirname, '..', PRIVATE_APP_KEY as string);
      fs.mkdirSync(path.dirname(filename), { recursive: true });
      fs.writeFileSync(filename, generated.privateKey);
      console.log(`New key pair created for app ${APP_ID} and stored under "./keys"`);
    }
    return { jwk };
  } catch (err) {
    throw new Error(`Key creation failed: ${err instanceof Error ? err.message : err}`);
  }
}

async function createContentType() {
  const body = {
    name: 'ExampleWithDefaultTitle',
    displayField: 'title',
    fields: [
      {
        id: 'title',
        name: 'Title',
        required: true,
        localized: true,
        type: 'Symbol',
      },
    ],
  };

  try {
    const contentTypeProps = await client.contentType.create({}, body);
    console.log('Set up example content type!');
    try {
      await client.contentType.publish(
        {
          contentTypeId: contentTypeProps.sys.id,
        },
        contentTypeProps
      );
      return contentTypeProps.sys.id;
    } catch (err) {
      throw new Error(`Publish content type failed: ${err instanceof Error ? err.message : err}`);
    }
  } catch (err) {
    throw new Error(`Content type setup failed: ${err instanceof Error ? err.message : err}`);
  }
}

async function createAppEvent(APP_ID: string) {
  try {
    await client.appEventSubscription.upsert(
      {
        organizationId: ORG_ID,
        appDefinitionId: APP_ID,
      },
      {
        targetUrl: `${HOSTED_APP_URL}/event-handler`,
        topics: ['Entry.create'],
      }
    );
    console.log('Set up App Event!');
  } catch (err) {
    throw new Error(`App event setup failed: ${err instanceof Error ? err.message : err}`);
  }
}
