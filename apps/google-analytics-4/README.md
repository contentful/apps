
Contentful Marketplace App that displays page-based analytics from Google Analytics alongside Contentful content entries.

## Requirements

* [Google Analytics 4](https://developers.google.com/analytics/devguides/collection/ga4) (Note: Google's deprecated Universal Analytics is not supported with this verison of the Google Analytics App)

## Installation and Usage

* Link to Marketplace app listing when ready
* Link to Help Center documentation when ready
* Link to any extra documentation or overview


## Technical Overview

### General

* The Smartling app is built on top of Contentful's [app framework](https://www.smartling.com/software/integrations/contentful/).
* The app itself is a React application that provides a Sidebar widget and App Config widget, used within Contentful's app framework.

### Google Analytics Data

* For analytics data, the app uses Google's [Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1)
* For API access to Google, the app uses the [Google API Client Library for JavaScript](https://github.com/google/google-api-javascript-client)


## Local Development

To develop this app local, there are a few prerequisites you will want to have in place:

* An Google Analytics 4 property in an active Google Analytics account. You will also need to have Google Analytics gathering data on a public website somewhere in order to generate metrics you can use to display and test.
* A Contentful organization and space
* A development definition of the app itself

To install or update the app locally:

```sh
npm i
```

To run the tests (in watch mode):

```sh
npm test
```

To run the test in CI (no watch):

```sh
npm run test-ci
```

## Available Scripts

Note: This project was bootstrapped with [Create Contentful App](https://github.com/contentful/create-contentful-app).

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

Uploads the build folder to contentful and creates a bundle that is automatically activated.
The command guides you through the deployment process and asks for all required arguments.
Read [here](https://www.contentful.com/developers/docs/extensibility/app-framework/create-contentful-app/#deploy-with-contentful) for more information about the deployment process.

#### `npm run upload-ci`

Similar to `npm run upload` it will upload your app to contentful and activate it. The only difference is   
that with this command all required arguments are read from the environment variables, for example when you add
the upload command to your CI pipeline.

For this command to work, the following environment variables must be set: 

- `CONTENTFUL_ORG_ID` - The ID of your organization
- `CONTENTFUL_APP_DEF_ID` - The ID of the app to which to add the bundle
- `CONTENTFUL_ACCESS_TOKEN` - A personal [access token](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/personal-access-tokens)
