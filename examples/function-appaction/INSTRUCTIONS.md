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

### Create an App Definition

You can create an app using CLI using `npm run create-app-definition`. This will prompt you to enter details for your new app and organization details. You can also create an app definition by [visiting the apps section](https://app.contentful.com/deeplink?link=app-definition-list) under your organization settings in the Contentful web app and clicking on the "Create App" button on the top right.

Your app should render in the page location.

### Build and Upload your Function

After you have created the app definition, you can then build and upload your app bundle containing your Contentful Function.

Build your app by running the following command: `npm run build`

Upload your app bundle to Contentful by running: `npm run upload`

### Create an App Action

You can create an app action by navigating to the app definition in the Contentful web UI and following [these instructions](https://www.contentful.com/developers/docs/extensibility/app-framework/app-actions/#create-an-app-action), ensuring that you select `function-invocation` for the type and choosing your uploaded function.

Otherwise, you can use the command provided in the example `package.json` to create an app action that will invoke your function: `npm run create-app-action`

### Install the app

Install the app to a space by navigating to the [Contentful web app](https://www.contentful.com/developers/docs/extensibility/app-framework/tutorial/#install-your-app-to-a-space) or by running the command: `npm run install-app`

Your example app is now configured and installed! You can navigate to the app page location to test your app action functions.
