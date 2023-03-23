Contentful Marketplace App that displays page-based analytics from Google Analytics alongside Contentful content entries.

## Requirements

- [Google Analytics 4](https://developers.google.com/analytics/devguides/collection/ga4) (Note: Google's deprecated Universal Analytics is not supported with this verison of the Google Analytics App)

## Installation and Usage

- Link to Marketplace app listing when ready
- Link to Help Center documentation when ready
- Link to any extra documentation or overview

## Technical Overview

### General

- The Google Anlaytics App app is built on top of Contentful's [app framework](https://www.smartling.com/software/integrations/contentful/).
- The app itself is a React application that provides a Sidebar widget and App Config widget, used within Contentful's app framework.

### Authorization

> **IMPORTANT**: In the current development stage this app implementes insecure plaintext storage of access credentials. Before release credentials will be stored via a secure, encrypted solution. -- Dec 8, 2022

- This app uses [service accounts](https://cloud.google.com/iam/docs/understanding-service-accounts) to provision access to users' analytics data. These credentials are used to fetch data from the organization's analytics account on behalf of all users.

### Google Analytics Data

- For analytics data, the app uses Google's [Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1)
- For API access to Google, the app uses the [Google API Client Library for JavaScript](https://github.com/google/google-api-javascript-client)

### Lambda

- This app requires a backend to make secure API calls to the Goolge Analytics Data API.
- The backend runs as an AWS lambda

## Local Development

To develop this app locally, there are a few prerequisites you will want to have in place:

- An Google Analytics 4 property in an active Google Analytics account. You will also need to have Google Analytics gathering data on a public website somewhere in order to generate metrics you can use to display and test.
- A Contentful organization and space
- A development definition of the app itself

### Frontend

The frontend lives in the `frontend/` folder.

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

### Backend (Lambda)

The backend lives in the `lambda/` folder.

#### Secrets

You will need to create a dev secrets file by running:

```
cp lambda/config/serverless-env.dev.yml{.example,}
```

Once this git-ignored file is present, get the Google Analytics app signing secret key out of our Team Integration's 1password vault and replace `<APP_SIGNING_KEY_GOES_HERE>` with the secret.

### Available Scripts

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

### Docker

`DynamoDB` has been added as a resource, developing locally has been configured to use `Docker` & `Docker Compose`.

To get started, use the following command in the root of the `lambda` directory:

`make start-app`

This will launch a local `DynamoDB` instance, as well as a development instance of the `lambda` with mounted volumes for nodemon changes to be picked up on save.

To clean up resources after development, run:

`make clean`

Docker compose can also be used with a familiar command set:

`docker compose up --build` will start services with flowing logs output

`docker compose down` will stop all running instances of images

`docker system prune -a` will remove all allocated memory for docker resources (should be last option for trouble shooting)
