This project was bootstrapped with [Create Contentful App](https://github.com/contentful/create-contentful-app).

## How to use

Execute create-contentful-app with npm, npx or yarn to bootstrap the example:

```bash
# npx
npx create-contentful-app --typescript

# npm
npm init contentful-app -- --typescript

# Yarn
yarn create contentful-app --typescript
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

#### `npm run generate-content-type`

Generates a comprehensive content type with all possible field types for testing the Iterable app integration.
This script creates a content type called "All Field Types" that includes every possible Contentful field type.

For this command to work, you need to set up environment variables. Copy `env.example` to `.env` and fill in your values:

- `CMA_TOKEN` - Your Content Management API token
- `SPACE_ID` - Your Contentful Space ID
- `ENVIRONMENT_ID` - Your Contentful Environment ID (usually 'master')
- `ORG_ID` - Your Contentful Organization ID

**What the Script Does:**
1. **Creates a Content Type**: Generates a content type with ID `all-field-types`
2. **Includes All Field Types**: Adds 13 different field types including:
   - Basic types: Symbol, Text, RichText, Integer, Number, Date, Boolean, Object, Location
   - Link types: Asset Link, Entry Link
   - Array types: Symbol Array, Asset Array, Entry Array
3. **Creates Sample Data**: Generates a sample entry with realistic data for each field
4. **Publishes Everything**: Automatically publishes both the content type and the sample entry

**Field Types Included:**
- **Basic Types**: Symbol, Text, RichText, Integer, Number, Date, Boolean, Object, Location
- **Link Types**: Asset Link, Entry Link
- **Array Types**: Symbol Array, Asset Array, Entry Array

**Integration with Iterable App:**
After running this script:
1. The content type will be available in your Contentful space
2. You can assign the Iterable app to this content type in the app configuration
3. The sidebar widget will be available when editing entries of this content type
4. You can test how the Iterable integration handles different field types

**Troubleshooting:**
- **Missing Environment Variables**: Ensure all required environment variables are set in your `.env` file
- **Permission Errors**: Make sure your CMA token has sufficient permissions to create content types
- **Content Type Already Exists**: The script will update an existing content type if it has the same ID

**Cleanup:** To remove the generated content type and entries, go to your Contentful space → Content Model → Find "All Field Types" → Delete the content type.

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
