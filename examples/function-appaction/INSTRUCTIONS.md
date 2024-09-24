## Building your Function

Use this command below to install the template.

```
npx create-contentful-app@latest --example function-appaction
```

- After installing the template, create a new app defintion in Contentful, and build + upload your app bundle (using the UI or included 'upload' script in package.json)
- Navigate to the app action tab on the app defintion and create a new app action. Choose 'function-invocation' as the type and select the function you just uploaded. Hit save, and you're ready to see the function invoked by the app action on the Page location.

### Creating an app

You can create an app using CLI using `npm run create-app-definition`. This will prompt you to enter details for your new app and organization details. You can also create an app definition by [visiting the apps section](https://app.contentful.com/deeplink?link=app-definition-list) under your organization settings in the Contentful web UI and clicking on the "Create App" button on the top right.

### Using environment variables

You will need to set the following environment variables as listed below:

- `CONTENTFUL_ACCESS_TOKEN`: User management token used for authentication/authorization
- `CONTENTFUL_ORG_ID`: Organization id where the app lives under
- `CONTENTFUL_APP_DEF_ID`: App definition id for identifying the app

### Uploading the code to Contentful

It as simple using the CLI command `npm run upload-ci`. This will perform two actions: upload the code, linking it to the app, and then finally activating the code ready for usage in both

Note: Node.js version 18 is the minimal required version for this upload command.
