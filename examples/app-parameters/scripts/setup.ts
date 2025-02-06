/*
 * This file is a setup script that uses your Content Management API (CMA) token
 * and the variables you specify in the ".env" file to:
 * + Create a new app definition
 * + Install the app to your space and set values for installation parameters
 * + Create an example content type
 * + Update the editor interface to include the app in the sidebar and update instance parameters
 * + Create an example entry where the app can be viewed in the sidebar and dialog locations
 */

import * as contentful from 'contentful-management';
import 'dotenv/config';
const { ORG_ID, SPACE_ID, ENVIRONMENT_ID, CMA_TOKEN } = process.env;

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
  const appId = await createAppDefinition();

  // Install App into space/environment
  await installApp(appId, {
    // Here you are able to pass installation-specific configuration variables
    displayFieldDetails: true,
    displayEditLink: true,
  });

  // Create an example Content Type
  const contentTypeId = await createContentType();

  // Update Editor Interface to include the app in the sidebar and set instance parameters
  await updateEditorInterface(contentTypeId, appId);

  // Create an example entry
  await createEntry(contentTypeId);

  console.log(`Setup complete`);
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
        name: 'Content type summary example app',
        // This app will be hosted locally
        src: `http://localhost:3000`,
        // This app uses these 3 locations
        locations: [
          { location: 'app-config' },
          { location: 'entry-sidebar' },
          { location: 'dialog' },
        ],
        // Here is were we are defining the instance and invocation parameters that the app will use
        parameters: {
          instance: [
            {
              name: 'Content Type Color',
              description:
                'Assign a color to this content type that will display in the sidebar app. Use a valid hex code.',
              id: 'contentTypeColor',
              type: 'Symbol',
            },
          ],
          installation: [
            {
              default: true,
              name: 'Display Field Details',
              description: 'Enables the Field Details button in the app sidebar',
              id: 'displayFieldDetails',
              type: 'Boolean',
              required: true,
              labels: {},
            },
            {
              name: 'Display Edit Link',
              description: 'Enables the Edit Content Type Link in the app sidebar',
              default: true,
              id: 'displayEditLink',
              type: 'Boolean',
              labels: {},
            },
          ],
        },
      }
    );
    console.log(`Created app definition: App id is ${appDefinitionProps.sys.id}`);
    return appDefinitionProps.sys.id;
  } catch (err) {
    throw new Error(`App definition creation failed: ${err instanceof Error ? err.message : err}`);
  }
}

async function installApp(appId: string, parameters: contentful.FreeFormParameters) {
  try {
    await client.appInstallation.upsert(
      {
        appDefinitionId: appId,
      },
      {
        parameters,
      }
    );
    console.log(`Installed app`);
  } catch (err) {
    throw new Error(`App installation failed: ${err instanceof Error ? err.message : err}`);
  }
}

async function createContentType() {
  const body = {
    name: 'Example content type with sidebar app',
    displayField: 'title',
    description: 'This is an example content type with a sidebar app assigned',
    // Adding a variety of fields types to demonstrate the app's functionality
    fields: [
      {
        id: 'title',
        name: 'Title',
        required: true,
        localized: false,
        type: 'Symbol',
      },
      {
        id: 'slug',
        name: 'Slug',
        required: false,
        localized: false,
        type: 'Symbol',
      },
      {
        id: 'body',
        name: 'Body',
        required: false,
        localized: true,
        type: 'Text',
      },
      {
        id: 'numberField',
        name: 'Number field',
        required: false,
        localized: false,
        type: 'Number',
        validations: [
          {
            range: {
              min: 0,
              max: 10,
            },
          },
        ],
      },
    ],
  };

  try {
    const contentTypeProps = await client.contentType.create({}, body);
    console.log('Set up example content type');
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

async function updateEditorInterface(contentTypeId: string, appId: string) {
  // This is the configuration for the app in the sidebar, as well as the instance parameter value
  const updatedAppAssignment = {
    widgetNamespace: 'app',
    widgetId: appId,
    settings: { contentTypeColor: '#98CBFF', position: 1 },
  };

  try {
    const editorInterface = await client.editorInterface.get({ contentTypeId: contentTypeId });
    // Add the app to the sidebar in the second position
    // Add the default sidebar widgets if none are present
    // see more details here: https://www.contentful.com/developers/docs/extensibility/app-framework/editor-interfaces/
    const updatedSidebar = [
      ...(editorInterface.sidebar?.length
        ? editorInterface.sidebar.splice(1, 0, updatedAppAssignment)
        : [
            {
              widgetId: 'publication-widget',
              widgetNamespace: 'sidebar-builtin',
            },
            updatedAppAssignment,
            {
              widgetId: 'content-preview-widget',
              widgetNamespace: 'sidebar-builtin',
            },
            {
              widgetId: 'incoming-links-widget',
              widgetNamespace: 'sidebar-builtin',
            },
            {
              widgetId: 'translation-widget',
              widgetNamespace: 'sidebar-builtin',
            },
            {
              widgetId: 'versions-widget',
              widgetNamespace: 'sidebar-builtin',
            },
          ]),
    ];

    await client.editorInterface.update(
      { contentTypeId: contentTypeId },
      {
        ...editorInterface,
        sidebar: updatedSidebar,
      }
    );
    console.log(`App added to sidebar for content type`);
  } catch (err) {
    throw new Error(`Editor Interface update failed: ${err instanceof Error ? err.message : err}`);
  }
}

async function createEntry(contentTypeId: string) {
  const body = {
    fields: {
      title: {
        'en-US': 'Example entry',
      },
      slug: {
        'en-US': 'example-entry',
      },
      body: {
        'en-US': 'This is an example entry',
      },
      numberField: {
        'en-US': 5,
      },
    },
  };

  try {
    const entryResult = await client.entry.create({ contentTypeId: contentTypeId }, body);
    console.log(`Created example entry: Entry id is ${entryResult.sys.id}`);
  } catch (err) {
    throw new Error(`Entry creation failed: ${err instanceof Error ? err.message : err}`);
  }
}
