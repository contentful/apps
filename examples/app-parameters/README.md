# App Parameters Example

## Introduction

App parameters allow you to achieve separation of the code and configuration that comprises your custom app. This way, the app can be shared, reused, and reconfigured without any code changes.

There are three different types of app parameters:

- Installation
- Instance
- Invocation

This example app uses all three types and explains how you as a developer can define these parameters and read the values, as well as how the user installing the app can set the values for your app installation.

## Getting Started

### Install the Example

Use this command below to install the example app and follow the provided prompts:

```
npx create-contentful-app@latest --example app-parameters
```

Once the process finishes, navigate to the directory that was created by running this command:

```
cd <name-of-your-app>
```

To complete the process, it is necessary to install all dependencies of the project by executing the following command:

```
npm i
```

### Setup the App programmatically

A script is provided in this example app code that allows you to:

- Create a new App
- Install the app to your Space
- Create an example Content Type
- Update the Editor Interface to include the app in the sidebar and update instance parameters
- Create an example entry

Before running the script, create a new `.env` file that contains the values noted in the `.env.example` file. Then run this script using the following command:

```
npm run setup
```

After the script is finished, run the local dev server for your app:

```
npm start
```

### Setup the App manually

If you chose to not use the setup script, you can follow the steps below to setup the app from the Contentful web app.

**NOTE:** Before getting started, it is helpful if you have an environment set up with at least one content type and one entry for that content type. In the Contentful web app, navigate to the `Content Model` tab to [create a content type](https://www.contentful.com/help/content-types/create-a-content-type/), and then to the `Content` tab to [create an entry](https://www.contentful.com/help/content-and-entries/adding-new-entry/).

#### Create an App Definition

You can create an app definition by [visiting the apps section](https://app.contentful.com/deeplink?link=app-definition-list) under your organization settings in the Contentful web app and clicking on the `Create App` button on the top right. Fill out the following fields on the `General` tab:

**Name**
Provide a name for your app.

**Frontend**
This app will be hosted locally, so you can input `http://localhost:3000`.

**Locations**
Be sure to select **App Configuration Screen** and **Entry Sidebar** for the locations. **NOTE:** the app also uses the **Dialog** location, but this is automatically available once at least one other location is selected.

**Instance parameter definitions**
Add one instance parameter definition that includes the following details:

- Display name: `Content Type Color`
- ID: `contentTypeColor`
- Description: `Assign a color to this content type that will display in the sidebar app. Use a valid hex code.`
- Type: `Short text`

**Installation parameter definitions**
Add two installation parameter definitions as outlined below:

First installation parameter:

- Display name: `Display Field Details`
- ID: `displayFieldDetails`
- Description: `Enables the Field Details button in the app sidebar`
- Type: `Boolean`
- Default value: `True`
- Custom labels: Leave the default

Second installation parameter:

- Display name: `Display Edit Link`
- ID: `displayEditLink`
- Description: `Enables the Edit Content Type Link in the app sidebar`
- Type: `Boolean`
- Default value: `True`
- Custom labels: Leave the default

Be sure to save the app and start your local dev server by running:

```
npm start
```

#### Install the App

Install your newly created app in an environment. Navigate to the [app definition list](https://app.contentful.com/deeplink?link=app-definition-list) to find your newly created app and to install it in your space. You will be a taken to the App configuration screen where you can follow the steps below to change the values for installation and instance parameters.

## Review your installed app and adjust parameter values

### Verify and change installation and instance parameters from the App configuration screen

Installation parameter values can be set from the App configuration screen.

**Update installation parameter values**
In the first section of the config page, you can change the values for the two installation parameters that you defined in the previous step if desired. The values that you select will determine whether or not two actions appear on the Sidebar location.

**Assign the app a content type and update instance parameter values**
In the next section, you will see all of the content types in your space. Select any content types where you want the app to render in the sidebar. Also, you can enter a hex code, and that color will appear in the sidebar app (choose a different hex code for each content type to which you assign the app so that they are color-coded).

Save the App configuration screen. To apply these changes, refresh the Contentful web app.

### Verify the Content Type assignment and instance parameters

Navigate to the `Content model` tab within the Contentful web app. Select a content type where you assigned the app on the configuration screen. Then select `Sidebar` and you will see that the app is assigned in the sidebar. You will also see `Change instance parameters`, select that and you will see the hex code value that you entered on the App configuration screen. You can edit the value directly here if desired.

### View the sidebar app on an entry

Navigate to an entry of the content type where you assigned the app. You will see the content type summary app in the sidebar. You should see a colored bar with the hex code that you entered as an instance parameter. Depending on the values you entered for the installation parameters, you may see a button to `View Field Details` and/or `Edit Content Type`.

### Open the Dialog location to utilize invocation parameters

When you click on the `View Field Details` button from the Sidebar, this opens the Dialog location. When data is passed from another app location to the Dialog location, this utilizes invocation parameters. Invocation parameters are defined, set, and read programmatically, so as an app user you cannot adjust these, but know that invocation parameters are what is powering the data displayed in the Dialog.

## Summary of App Parameters

### Installation parameters

Installation parameters are set during installation in a space environment and can be modified in subsequent configuration updates. These parameter values can be accessed from any app location in the environment. Installation parameters are useful to store "global" app state for an app installation, such as: identifiers for accessing data from external APIs, default values, or configuration state that impacts the app's features.

This example app uses installation parameters to allow the app installer to determine whether two buttons should appear in the Sidebar or not.

#### How to define

The App developer can define on the App Definition (optional). This can be done via the Contentful web app or programmatically via the CMA. If installation parameters are not defined on the App Definition, then the app developer will define them in the App configuration screen location code.

#### How to set the value

The App developer creates an App configuration screen location UI that allows an app user to set values. The values entered by the user are persisted by using the `onConfigure` hook. App installation parameters values can also be set using the CMA.

An App installer can set the value of installation parameters on the App configuration screen using the UI created by the app developer. App installation parameters are persisted when the user clicks `Save`.

#### How to read

The App developer can access the installation parameter values in other app locations using `sdk.parameters.installation` or the CMA.

### Instance parameters

Instance parameters are set when an app user assigns an app to a location (via the Content model editor). Values are only available in the specific location and content type where they were entered. The app developer must define instance parameters on the App Definition, and then app users must provide values for these parameters. Instance parameters can only be used on the Field, Entry Editor, and Sidebar locations.

This example app uses instance parameters to allow an app user to define a hex code for each content type where the app is installed, so that their content types are color-coded.

#### How to define

The app developer must define instance parameters on the App Definition (required). This can be done via the Contentful web app or programmatically via the CMA.

#### How to set the value

An App installer can set the value of an instance parameter via the Contentful web app when editing a content model and selecting the app for a Sidebar, Field, or Entry Editor. Instance parameter values can also be set via the App SDK or CMA using the Editor Interface entity. This example app leverages this by creating a section on the App configuration screen that updates instance parameters via the App SDK.

#### How to read

App developer can access the instance parameter values using `sdk.parameters.instance`.

### Invocation parameters

Invocation parameters are assigned in the app code when a user performs an action. They are used to pass data from an app location to the Dialog location. A common use case for invocation parameters is to pass context from the initiating location to the Dialog.

This example app uses invocation parameters to pass in content type field information from the Sidebar location to the Dialog location.

#### How to define

The App developer defines invocation parameters in the app code.

#### How to set the value

The App developer set the value for invocation parameters using `sdk.dialogs.openCurrentApp` and passing in the `parameters` option. [See documentation here](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/).

#### How to read

The App developer can access the instance parameter values using `sdk.parameters.invocation` from the dialog location.
