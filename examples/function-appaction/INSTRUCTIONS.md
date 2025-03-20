# App Action Function Example

## Introduction

App Action is an entity that allows communication between apps. Functions are serverless workloads that run on Contentful’s infrastructure to provide enhanced flexibility and customization. Functions can be linked to and then invoked via an App Action, which provides apps an easy way to expose generic capabilities to their own frontend as well as to other apps.

## About this Example

This example app demonstrates how to set up an app to trigger an app action function. It also provides a frontend app page to test App Actions that trigger a function invocation in your app.

### Install the Example and Create an App Definition

Use this command below to install the example app.

```
npx create-contentful-app@latest --example function-appaction
```

Once the process finishes, navigate to the directory that was created by running this command:

```
cd <name-of-your-app>
```

To complete the process, it is necessary to install all dependencies of the project by executing the following command:

```
npm i
```

### Create an App Definition

You can create an app definition by [visiting the apps section](https://app.contentful.com/deeplink?link=app-definition-list) under your organization settings in the Contentful web app and clicking on the "Create App" button on the top right. Be sure to select **Page Location** and select the toggle for `Show app in main navigation` under the `Page` location.

Alternatively, you can create an app using the the command `npm run create-app-definition`. You will need to answer the following questions on the terminal. Feel free to proceed with the default options provided.

1. **Name of your application**. This is how your app will be named and it will be displayed in a few places throughout the UI. The default is the name of the folder you created.
2. **Select where your app can be rendered**. This shows potential [app locations](https://www.contentful.com/developers/docs/extensibility/app-framework/locations/) where an app can be rendered within the Contentful Web app. Select **Page Location**, as this is where you will be able to test your app actions. Select `y` for showing your app in the main navigation, and then provide a name for the link (e.g. `App Action Demo Console`) and a path (you can leave it as the default `/`).
3. **Contentful CMA endpoint URL**. This refers to the URL used to interact with Contentful's Management APIs.
4. **App Parameters**. These are configurable values that can be used to set default values or define custom validation rules; we do not need this to run the app so you can select `No`.
5. The next steps will lead you through the process of providing a Contentful access token to the application and specifying the organization to which the application should be assigned.

### Build and Upload your Function

After you have created the app definition, you can then build and upload your app bundle containing your Contentful Function.

```
npm run build
npm run upload
```

The interactive CLI will prompt you to provide additional details, such as a CMA endpoint URL. Select **Yes** when prompted if you’d like to activate the bundle after upload.

### Adding locations to an app

You can add locations to an existing app using the CLI command `npm run add-locations`. This will launch an interactive prompt, allowing you to select locations to add to your app.
You can also add locations to an app definition by [visiting the apps section](https://app.contentful.com/deeplink?link=app-definition-list) under your organization settings in the Contentful web UI and clicking on the **"Edit"** flyout button for your app and selecting locations on the **"General"** tab.

### Create an App Action

You can create an app action by navigating to the app definition in the Contentful web UI and following [these instructions](https://www.contentful.com/developers/docs/extensibility/app-framework/app-actions/#create-an-app-action), ensuring that you select `function-invocation` for the type and choosing your uploaded function.

Otherwise, you can use the command provided in the example `package.json` to create an app action that will invoke your function: `npm run create-app-action`. For this command to work, the following environment variables must be set:

- `CONTENTFUL_ORG_ID` - The ID of your organization
- `CONTENTFUL_APP_DEF_ID` - The ID of the app to which to add the bundle
- `CONTENTFUL_ACCESS_TOKEN` - A personal [access token](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/personal-access-tokens)

Alternatively, you can set these while running the command: `npm run create-app-action -- --appDefinitionId=<your_app_id> --accessToken=<your_token> --organizationId=<your_org_id>`

### Install the app

Install the app to a space by navigating to the [Contentful web app](https://www.contentful.com/developers/docs/extensibility/app-framework/tutorial/#install-your-app-to-a-space) or by running the command: `npm run install-app`. Select the space and environment in which you would prefer to install the example app from the dialog that appears. You will have to grant access to the space the app will be installed in.

Your example app is now configured and installed! You can navigate to the app page location to test your app action functions.

### Running the app locally

The steps above will upload the app to Contentful's infrastructure. However, you can also run the app locally to be able to easier debug the code. To do this:

- Run `npm run open-settings`, which will open the web page with the App details.
- Deselect the **Hosted by Contentful** option and fill the text field below with `http://localhost:3000`.
- Save the changes.
- Run `npm start` in your app and navigate to the page location in the Contentful web app.

This process is reversible and at any point you can go back to the setup that uses the bundle uploaded to Contentful's infrastructure.
