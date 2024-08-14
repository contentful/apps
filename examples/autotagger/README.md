## AI Autotagger Example Function

This project includes an example of using the Contentful Management API (CMA) within an App Event Handler Function to automatically tag entries based on their content using OpenAI's GPT-4 model.

### Files Associated with the Example

- **autotagger.ts**: Defines the event handler that automatically tags entries.
- **selected-content-types-filter.ts**: Ensures only entries of selected content types are autotagged.
- **ConfigScreen.tsx**: Provides the configuration screen for setting up the app.
- **contentful-app-manifest.json**: Defines the functions and their configurations.

### autotagger.ts

Handles the `appevent.handler` event to automatically tag entries using OpenAI's GPT-4.

### selected-content-types-filter.ts

Filters entries to ensure only selected content types are processed by the autotagger.

### ConfigScreen.tsx

Provides a user interface for configuring the app, including setting the OpenAI API key and selecting content types to be autotagged.

### contentful-app-manifest.json

Defines the functions, their paths, and configurations used in the app:

- **autotagger**: Automatically tags entries using AI.
- **filter**: Ensures only selected content types are autotagged.

## Utilizing App Event handler Functions

This app utilizes [app events](https://www.contentful.com/developers/docs/extensibility/app-framework/app-events/) to subscribe to the `Entry.auto_save` event. Once you have built and uploaded your app to Contentful, link the autotagger and filter functions to your app event subscription and subscribe to the `Entry.auto_save` event using the [CMA](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/app-event-subscriptions/app-event-subscription/update-or-subscribe-to-events/console/js-plain) or the [Events](https://app.contentful.com/deeplink?link=app-definition&tab=events) tab on the App details page.

## Libraries to use

To make your app look and feel like Contentful, use the following libraries:

- [Forma 36](https://f36.contentful.com/) – Contentful's design system
- [Contentful Field Editors](https://www.contentful.com/developers/docs/extensibility/field-editors/) – Contentful's field editor React components

## Using the `contentful-management` SDK

In the default create contentful app output, a Contentful management client is passed into each location. This can be used to interact with Contentful's management API. For example:

```js
// Use the client
cma.locale.getMany({}).then((locales) => console.log(locales));
```

Visit the [`contentful-management` documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/#using-the-contentful-management-library) to find out more.

## Learn More

[Read more](https://www.contentful.com/developers/docs/extensibility/app-framework/create-contentful-app/) and check out the video on how to use the CLI.

Create Contentful App uses [Create React App](https://create-react-app.dev/). You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started) and how to further customize your app.

his project was bootstrapped with [Create Contentful App](https://github.com/contentful/create-contentful-app).

## How to use

Execute create-contentful-app with npm, npx, or yarn to bootstrap the example:

```bash
# npx
npx create-contentful-app --example autotagger

# npm
npm init contentful-app -- --example autotagger

# Yarn
yarn create contentful-app --example autotagger
```

## Available Scripts

In the project directory, you can run:

#### `npm start`

Creates or updates your app definition in Contentful, and runs the app in development mode.
Open your app to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

#### `npm run build`

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
Your app is ready to be deployed!

#### `npm run upload`

Uploads the build folder to Contentful and creates a bundle that is automatically activated.
The command guides you through the deployment process and asks for all required arguments.
Read [here](https://www.contentful.com/developers/docs/extensibility/app-framework/create-contentful-app/#deploy-with-contentful) for more information about the deployment process.

#### `npm run upload-ci`

Similar to `npm run upload`, it will upload your app to Contentful and activate it. The only difference is that with this command all required arguments are read from the environment variables, for example when you add the upload command to your CI pipeline.

For this command to work, the following environment variables must be set:

- `CONTENTFUL_ORG_ID` - The ID of your organization
- `CONTENTFUL_APP_DEF_ID` - The ID of the app to which to add the bundle
- `CONTENTFUL_ACCESS_TOKEN` - A personal [access token](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/personal-access-tokens)
