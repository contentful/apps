# App Event Transformation Function Example

App event transformation functions enable you to modify event payloads before they reach their destination by adding, removing, or changing data in the event.

## What is an App Event Transformation Function?

Unlike filter functions that determine whether to process events or handler functions that react to events, transformation functions alter the event payload itself.

Common use cases for transforming events include:

- Adding computed fields or metadata to events
- Resolving references to include related content
- Converting data formats
- Enriching content with data from external services (e.g., geocoding)
- Normalizing or standardizing field values

## Getting Started

An app event transformation function allows you to transform the payload of events before they are sent off. This example demonstrates how to use the app event transformation function to transform the payload of the `entry.publish` event, by geocoding a latitude and longitude field to a human-readable address.

### 1. Install the Example App

Use this command below to install the example:

```bash
npx create-contentful-app@latest --example function-appevent-handler
```

### 2. Connect to an App Definition

If you haven't already created an app definition in Contentful, choose one of the options below.

#### Manually via the Web UI

- [Navigate to the Apps section in your organization](https://app.contentful.com/deeplink?link=app-definition-list)

- Click the "Create App" button

- Fill in the required fields. **Note:** This app is **frontendless**, so an app location does not need to be selected.

- Proceed to the [Set Up Your Environment](#3-set-up-your-environment) step.

> **Note**: If you are unfamiliar with how to create a custom app definition in Contentful, please review the documentation here: [Create a Custom App - Tutorial](https://www.contentful.com/developers/docs/extensibility/app-framework/tutorial/?utm_source=webapp&utm_medium=app-listing&utm_campaign=in-app-help)

#### Via CLI

- Run: `npm run create-app-definition`
- Answer the prompted questions. Feel free to proceed with the default options provided.

  1. **Name of your application**.
     - This is how your app will be named and it will be displayed in a few places throughout the UI. The default is the name of the folder you created.
  2. This app is **frontendless**, so an app location does not need to be selected.
  3. **Contentful CMA endpoint URL**.
     - This refers to the URL used to interact with Contentful's Management APIs.
  4. No **app parameters** are needed for this app.
  5. The next steps will lead you through the process of providing a Contentful access token to the application and specifying the organization to which the application should be assigned.
     - This will automatically create a `.env` file with these fields for you
  6. Proceed to [Examine the Transformation Function Code](#4-examine-the-transformation-function-code)

### 3. Set Up Your Environment

If you created your app definition manually through the web UI, or the CLI did not create one for you, create a `.env` file in the root of your application with your Contentful credentials:

```env
CONTENTFUL_ORG_ID=your-organization-id
CONTENTFUL_APP_DEF_ID=your-app-definition-id
CONTENTFUL_ACCESS_TOKEN=your-access-token
```

These variables authenticate your function with Contentful and link it to your app definition.

> **Note**: You can generate an access token from your Space Settings menu. For the other values, you can find them in your Contentful organization and app settings.

### 4. Examine the Transformation Function Code

Open `functions/appevent-transformation-example.ts` to see how this function will transform events.

The function accepts incoming entry publish events with a location field that has latitude and longitude coordinates as its field value. The function calls an external API ([Nominatim](https://nominatim.org/)) to get a human-readable address using those coordinates, and then adjusts the payload to include this information before sending it on to the target.

### 5. Build and Upload Your Function

Currently, the only way to deploy a function is through the CLI. To do so, run the following commands:

```bash
# Build your function
npm run build

# Upload your function to Contentful
npm run upload
```

The build step is essential since the upload process relies on the compiled code. The CLI may prompt for additional details (e.g., the CMA endpoint URL) and offer to activate the bundle post-upload.

> **Note**: For more information on the differences between `upload` and `upload-ci`, see the [Create Contentful App Documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/create-contentful-app/)

### 6. Link Your Function to an Event Subscription

To activate your function, you need to subscribe it to specific events. Before setting up your app event subscription, you will need a URL endpoint for the event target. For local testing, we recommend to use [webhook.site](https://webhook.site/) to inspect the sent events.

#### Run the Provided Script

This example app comes with a script that creates an app event subscription using the CMA JavaScript SDK. Before using the script, ensure that you have created a `.env` file with all of the environment variables listed in the `.env.example` file. Then run:

```bash
npm run create-app-event
```

This will create an app event subscription with the target URL you specified, the transformation function you uploaded to your app, and a subscription to the entry publish event.

#### Via the Contentful Web App

1. Open your app definition in the Contentful web app
2. Navigate to the "Events" tab
3. Select the option to "Enable events"
4. Create an event subscription

- For the "Target", select "Target a URL" and paste the generated URL from `webhook.site` into the "Target a URL" input field.
- In the "Transformation Function" section, this is where you select your uploaded transformation function. When this is selected, all events will be processed by this transformation function.
- For the "Topics", select the Entry Publish event

### 7. Install the App

Next, you will need to install the app into a space. Run this script `npm run install-app` and then select a space and environment for where you would like to install the app.

### 8. Create a Content Type and Publish an Entry

The final step is to create a content type that has a location field for the transformation function to run the geocoding on, and to create and publish entries. The easiest way to do this is to use the provided script. Before using the script, ensure that you have created a `.env` file with all of the environment variables listed in the `.env.example` file. Ensure that the space and environment you add to your environment variables match where you have installed the app.

Then run:

```bash
npm run create-content-type-publish-entries
```

This script uses the CMA JavaScript SDK to create a content type, publish the content type, create an entry, and publish the entry.

### 9. Inspect the sent events and function logs

After running the script, you can inspect the sent events and function logs to see that the transformation function worked correctly. You should have only received one event to your URL endpoint for when the entry was published. In the event payload, you should see the added address information and `X-Is-Geocoded` header. Navigate to your app definition (run `npm run open-settings`), click on the "Functions" tab, then the menu next to your function, and click "View Logs". Select your space and environment to see the logs for your function. You should see one log, processing the event and transforming the event payload.

## Additional Resources

- [Contentful App Functions Documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/functions/)
- [Working with Functions](https://www.contentful.com/developers/docs/extensibility/app-framework/working-with-functions/)
- [App Event Subscriptions API Reference](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/app-event-subscriptions)
- [App Events Overview](https://www.contentful.com/developers/docs/extensibility/app-framework/app-events/)
