# App Event Function Example: Comment Bot

This project is an example of a Contentful App Event Function that reacts to comments on entries and performs actions such as showing or hiding a publication widget in the entry's sidebar.

## Table of Contents

- [Getting Started](#getting-started)
  - [Building your Function](#building-your-function)
  - [Creating an App](#creating-an-app)
  - [Using Environment Variables](#using-environment-variables)
  - [Uploading the Code to Contentful](#uploading-the-code-to-contentful)
- [Utilizing App Event Handler Functions](#utilizing-app-event-handler-functions)
- [Usage of this App](#usage-of-this-app)
  - [Adding New Bot Actions](#adding-new-bot-actions)

## Getting Started

### Building your Function

Use the command below to install this template:
```shell
npx create-contentful-app@latest –function comment-bot
```

### Creating an App

You can create an app using CLI with `npm run create-app-definition`. This will prompt you to enter details for your new app and organization details. You can also create an app definition by [visiting the apps section](https://app.contentful.com/deeplink?link=app-definition-list) under your organization settings in the Contentful web UI and clicking on the "Create App" button on the top right.

### Using Environment Variables

You will need to set the following environment variables as listed below:

- `CONTENTFUL_ACCESS_TOKEN`: User management token used for authentication/authorization
- `CONTENTFUL_ORG_ID`: Organization id where the app lives under
- `CONTENTFUL_APP_DEF_ID`: App definition id for identifying the app

### Uploading the Code to Contentful

When using functions, you don't need to worry about hosting your own code. Contentful handles everything, and you just need to use the CLI command `npm run upload`, or, if you have configured the [environment variables](#using-environment-variables) for your project, `npm run upload-ci`. This will perform several actions: uploading the code, linking it to the app, and finally activating the code, making it ready for usage.

## Utilizing app event handler functions

When you create an app that utilizes [app events](https://www.contentful.com/developers/docs/extensibility/app-framework/app-events/), you can define the entities and topics for these events. However, you may also want to do some additional handling when these events occur. For example, you may want to send a copy of the event to an external service for logging or monitoring purposes.

Once you have built and uploaded your functions to Contentful, link them to your app event subscription using the [CMA](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/app-event-subscriptions/app-event-subscription/update-or-subscribe-to-events/console/js-plain) or the [Events](https://app.contentful.com/deeplink?link=app-definition&tab=events) tab on the App details page.

For this app, make sure you subscribe to the `Comment.create` topic.

## Usage of this App

This app contains a comment bot, a Contentful Function that is triggered by comments made on Contentful entries. The bot listens for specific commands in the comments and executes the corresponding actions.

Supported commands out of the box:

- `/show-publish`: Adds the publication widget to the entry’s sidebar.
-	`/hide-publish`: Removes the publication widget from the entry’s sidebar.

More commands can be added by introducing new actions to the project.

### Adding New Bot Actions

To add a new action:

1. Create a New Bot Action File: In the [bot-actions](./bot-actions/) directory, create a new file (e.g., yourAction.ts).
2. Implement the `BotAction` Interface: Ensure the new bot action implements the `BotAction` interface defined in the [types](types.ts). If you'd like you can also extend the `BotActionBase` class to gain access to common shared functionality. 
```typescript
import { BotActionBase } from "./bot-action-base";
import type { BotAction, BotActionParams } from "../types";

export class YourAction extends BotActionBase implements BotAction {
  async execute(params: BotActionParams): Promise<void> {
    // Your action logic here
  }
}
```

3. Register the Action: Add the new action to the [bot-action-registry.ts](./bot-actions/bot-action-registry.ts) file.
```typescript
import { YourAction } from "./yourAction";

const actionRegistry: { [key: string]: BotAction } = {
  "/your-command": new YourAction(),
  // Other actions...
};
```
4. Test Your Action: Make a comment on a Contentful entry with your new command, and observe the bot in action.
