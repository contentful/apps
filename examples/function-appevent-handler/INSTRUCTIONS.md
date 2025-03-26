# App Event Handler Function Example

App event handler functions enable you to react to events in your Contentful space by executing custom code when specific events occur. This template provides a starting point with skeleton code—you must add your custom handling logic to meet your specific use case.

## What is an App Event Handler Function?

Unlike filter functions that determine whether to process events, handlers actually perform actions in response to events.

Common use cases for handling events include:

- Sending notifications to external systems
- Synchronizing content with third-party services
- Creating audit logs or analytics
- Triggering external workflows

## Getting Started

This example app demonstrates a scenario where a developer wants to subscribe to all events on entry entities and send those events to both an external audit log service and an external analytics service. Previously, a developer would have needed to create, build, and maintain their own backend service to do this logic. App functions now allow developers to upload serverless functions that run on Contentful's infrastructure to respond to events. The logic in the function accepts incoming entry events, creates a payload for the audit log and analytics services, and sends these events to those external services.

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
  6. Proceed to [Examine the Handler Function Code](#4-examine-the-handler-function-code)

### 3. Set Up Your Environment

If you created your app definition manually through the web UI, or the CLI did not create one for you, create a `.env` file in the root of your application with your Contentful credentials:

```env
CONTENTFUL_ORG_ID=your-organization-id
CONTENTFUL_APP_DEF_ID=your-app-definition-id
CONTENTFUL_ACCESS_TOKEN=your-access-token
```

These variables authenticate your function with Contentful and link it to your app definition.

> **Note**: You can generate an access token from your Space Settings menu. For the other values, you can find them in your Contentful organization and app settings.

### 4. Examine the Handler Function Code

Open `functions/appevent-handler-example.ts` to see how this function will handle events. The function accepts incoming entry events, creates a payload for the audit log and analytics services, and sends these events to those external services.

**NOTE:** At the top of the function, you will see two variables `auditLogUrl` and `analyticsUrl` that will need to be updated with actual URLs in order for this example to work. We recommend to use [webhook.site](https://webhook.site/) to create these URLs and then be able to inspect the sent events. Update the file with your URLs and save the file before continuing.

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

To activate your function, you need to subscribe it to specific events. There are a few ways to do this:

#### Run the Provided Script

This example app comes with a script that creates an app event subscription using the CMA JavaScript SDK. Before using the script, ensure that you have created a `.env` file with all of the environment variables listed in the `.env.example` file. Then run:

```bash
npm run create-app-event
```

This will create an app event subscription with your handler function as the target and a subscription to all entry topics.

#### Via the Contentful Web App

1. Open your app definition in the Contentful web app
2. Navigate to the "Events" tab
3. Select the option to "Enable events"
4. Create an event subscription

- For the "Target", select "Target a function" and select your uploaded function.
- For the "Topics", select all Entry topics.

### 7. Install the App

Next, you will need to install the app into a space. Run this script `npm run install-app` and then select a space and environment for where you would like to install the app.

### 8. Create a Content Type and Publish an Entry

The final step is to trigger entry events that will be sent to the app event handler function. This example app includes a script to do this. Before using the script, ensure that you have created a `.env` file with all of the environment variables listed in the `.env.example` file. Ensure that the space and environment you add to your environment variables match where you have installed the app. The script will use a content type from your `.env` if provided, or will create a new one. Then it will create an entry for that content type and will publish this entry.

Then run:

```bash
npm run create-content-type-publish-entries
```

This script uses the CMA JavaScript SDK to create a content type (if no content type id is provided) and create an entry. This will trigger two events that your app is subscribed to: `Entry.create` and `Entry.publish`. After running the script, you should see that two events were sent to both your audit log URL and your analytics URL, each with their appropriate payload.

You can also trigger entry events from the Contentful web app.

### 9. Inspect the sent events and function logs

After running the script, you can inspect the sent events and function logs to see that the handler function worked correctly. If you ran the script, you should see two events were sent to both your audit log URL and your analytics URL. Navigate to your app definition (run `npm run open-settings`), click on the "Functions" tab, then the menu next to your function, and click "View Logs". Select your space and environment to see the logs for your function. You should see two logs, one for `Entry.create` and one for `Entry.publish`. Clicking on each log will show the the logs from the function.

## Additional Resources

- [Contentful App Functions Documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/functions/)
- [Working with Functions](https://www.contentful.com/developers/docs/extensibility/app-framework/working-with-functions/)
- [App Event Subscriptions API Reference](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/app-event-subscriptions)
- [App Events Overview](https://www.contentful.com/developers/docs/extensibility/app-framework/app-events/)
