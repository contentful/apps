## Building your Function

Ensure your `package.json` has the following script:

```
"build:functions": "contentful-app-scripts build-functions --ci"
```

### Creating an app

Use this command below to install the template or example.

```
npx create-app-function@latest <name> --javascript
```

### Using environment variables

You will need to set the following environment variables as listed below:

- `CONTENTFUL_ACCESS_TOKEN`: User management token used for authentication/authorization
- `CONTENTFUL_ORG_ID`: Organization id where the app lives under
- `CONTENTFUL_APP_DEF_ID`: App definition id for identifying the app

### Uploading the code to Contentful

It as simple using the CLI command `npm run upload-ci`. This will perform two actions: upload the code, linking it to the app, and then finally activating the code ready for usage in both
