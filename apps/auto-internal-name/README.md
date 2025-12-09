# Auto Internal Name

A Contentful app that automatically generates internal names for entries based on parent entry relationships and configured naming conventions. This app accelerates content creation workflows by eliminating manual naming tasks and ensuring consistent naming standards across your content model.

## Overview

The Auto Internal Name app automatically populates internal name fields for entries when they are created, using a configurable source field from parent entries. This is particularly useful for content models with nested relationships.

### Primary Function

- **Accelerate** the time needed to provide an internal name for an entry
- **Make it easy** to follow a standard naming convention
- **Assist** in understanding the relationship between entries
- **Really good** when lots of nested content is expected

### Target Audience

This app is designed for **Content Authors** who work with hierarchical content structures and need to maintain consistent internal naming conventions across their entries.

## Key Features

### Installation & Configuration

1. **Field Configuration**: Install and configure the app with:

   - Field name to source the name from (the field that contains the value to use for internal names)
   - CPA API key to assist with querying in the function

2. **Field Appearance Location**: Use the field appearance location on target fields that should be auto-populated using this logic

### Entry Creation

- Automatically uses a function behind the scenes to lookup the "parent" entry
- Leverages the app config field source name to retrieve the correct value
- Inserts the value into the target field automatically

### Entry Editing

- **No automatic changes** - Nothing happens unless there is user intervention
- **Refetch button** - Users can use a "refetch" button to rerun the logic and override any existing value
- **Clear value** - Users can clear the value if they want to provide their own custom name

## How to Run

### Prerequisites

- Node.js (version specified in package.json)
- npm or yarn
- A Contentful space with appropriate permissions

### Development

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run start
```

This command:

- Runs the app in development mode
- Display your app in the Contentful UI locations
- Automatically reloads when you make edits

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

#### `npm run test`

Runs the test suite using Vitest.

#### `npm run upload`

Uploads the `build` folder to Contentful and creates a bundle that is automatically activated.
The command guides you through the deployment process and asks for all required arguments.
Read [here](https://www.contentful.com/developers/docs/extensibility/app-framework/create-contentful-app/#deploy-with-contentful) for more information about the deployment process.

#### `npm run upload-ci`

Similar to `npm run upload` it will upload your app to Contentful and activate it. The only difference is  
that with this command all required arguments are read from the environment variables, for example when you add
the upload command to your CI pipeline.

For this command to work, the following environment variables must be set:

- `CONTENTFUL_ORG_ID` - The ID of your organization
- `CONTENTFUL_APP_DEF_ID` - The ID of the app to which to add the bundle
- `CONTENTFUL_ACCESS_TOKEN` - A personal [access token](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/personal-access-tokens)

## Intended Use Case

This app is ideal for content models where:

- **Hierarchical relationships** exist between entries (e.g., categories with subcategories, pages with sections)
- **Consistent naming conventions** are required across related entries
- **High volume of nested content** is expected, making manual naming time-consuming
- **Internal names** need to reflect relationships to parent entries for better organization and understanding

## Libraries to use

To make your app look and feel like Contentful use the following libraries:

- [Forma 36](https://f36.contentful.com/) – Contentful's design system
- [Contentful Field Editors](https://www.contentful.com/developers/docs/extensibility/field-editors/) – Contentful's field editor React components

## Using the `contentful-management` SDK

In the default create contentful app output, a contentful management client is
passed into each location. This can be used to interact with Contentful's
management API. For example

```js
// Use the client
cma.locale.getMany({}).then((locales) => console.log(locales));
```

Visit the [`contentful-management` documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/#using-the-contentful-management-library)
to find out more.

## Learn More

[Read more](https://www.contentful.com/developers/docs/extensibility/app-framework/create-contentful-app/) and check out the video on how to use the CLI.
