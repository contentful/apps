# App Event Function Example: Comment Bot

This project is an example of a Contentful App Event Function that reacts to comments on entries and performs actions such as showing or hiding a publication widget in the entry's sidebar.

## Table of Contents

- [App Event Function Example: Comment Bot](#app-event-function-example-comment-bot)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
    - [1. Install the Example App](#1-install-the-example-app)
    - [2. Connect to an App Definition](#2-connect-to-an-app-definition)
    - [3. Set Up Your Environment](#3-set-up-your-environment)
    - [4. Examine the Handler Function Code](#4-examine-the-handler-function-code)
    - [5. Build and Upload Your Function](#5-build-and-upload-your-function)
    - [6. Link Your Function to an Event Subscription](#6-link-your-function-to-an-event-subscription)
    - [7. Install the App](#7-install-the-app)
    - [8. Add Comments to an Entry](#8-add-comments-to-an-entry)
    - [9. Inspect the Sent Events and Function Logs](#9-inspect-the-sent-events-and-function-logs)
  - [Adding New Bot Actions](#adding-new-bot-actions)

## Getting Started

### 1. Install the Example App

Use the command below to install this example:

```shell
npx create-contentful-app@latest --example function-comment-bot
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

Open `functions/comment-bot.ts` to see how this function will handle events. This app contains a comment bot, a Contentful Function that is triggered by comments made on Contentful entries. The bot listens for specific commands in the comments and executes the corresponding actions.

Supported commands out of the box:

- `/show-publish`: Adds the publication widget to the entry’s sidebar.
- `/hide-publish`: Removes the publication widget from the entry’s sidebar.

More commands can be added by [introducing new actions](#adding-new-bot-actions) to the project

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

### 8. Add Comments to an Entry

The final step is to add comments to entries using the bot actions. This example app includes a script to do this. Before using the script, ensure that you have created a `.env` file with all of the environment variables listed in the `.env.example` file. Ensure that the space and environment you add to your environment variables match where you have installed the app. The script will use a content type from your `.env` if provided, or will create a new one. Then it will create an entry for that content type. There are two other scripts that will add a comment for `hide-publish` and one for `show-publish`.

To run the scripts:

```bash
npm run create-content-type-and-entry
npm run hide-publish
npm run show-publish
```

Since the publish button by default is added to the sidebar, run `npm run hide-publish` first. Then check the Contentful web app to see that the publish button is no longer visible in the web app. The run `npm run show-publish` to make it visible again.

You can also trigger events from the Contentful web app by adding comments to an entry.

### 9. Inspect the Sent Events and Function Logs

After running the scripts, you can inspect the sent events and function logs to see that the handler function worked correctly. If you ran the scripts, you should see two events were sent to your target URL, one for `hide-publish` and one for `show-publish`. Navigate to your app definition (run `npm run open-settings`), click on the "Functions" tab, then the menu next to your function, and click "View Logs". Select your space and environment to see the logs for your function. You should see two logs, one for each comment created. Clicking on each log will show the the logs from the function.

## Adding New Bot Actions

To add a new action:

1. Create a New Bot Action File: In the [bot-actions](./bot-actions/) directory, create a new file (e.g., yourAction.ts).
2. Implement the `BotAction` Interface: Ensure the new bot action implements the `BotAction` interface defined in the [types](types.ts). If you'd like you can also extend the `BotActionBase` class to gain access to common shared functionality.

```typescript
import { BotActionBase } from './bot-action-base';
import type { BotAction, BotActionParams } from '../types';

export class YourAction extends BotActionBase implements BotAction {
  async execute(params: BotActionParams): Promise<void> {
    // Your action logic here
  }
}
```

3. Register the Action: Add the new action to the [bot-action-registry.ts](./bot-actions/bot-action-registry.ts) file.

```typescript
import { YourAction } from './yourAction';

const actionRegistry: { [key: string]: BotAction } = {
  '/your-command': new YourAction(),
  // Other actions...
};
```

4. Test Your Action: Make a comment on a Contentful entry with your new command, and observe the bot in action.

## Additional Resources

- [Contentful App Functions Documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/functions/)
- [Working with Functions](https://www.contentful.com/developers/docs/extensibility/app-framework/working-with-functions/)
- [App Event Subscriptions API Reference](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/app-event-subscriptions)
- [App Events Overview](https://www.contentful.com/developers/docs/extensibility/app-framework/app-events/)
