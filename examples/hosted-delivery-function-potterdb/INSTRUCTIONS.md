## Building your Delivery Function

### Creating an app
You can create an app using CLI using `npm run create-app-definition`. This will prompt you to enter details for your new app and organization details.

Alternatively, you can set your app and organization details by setting them as environment variables.

### Using environment variables
You can also set the following environment variables as listed below:
- `CONTENTFUL_ACCESS_TOKEN`: User management token used for authentication/authorization
- `CONTENTFUL_ORG_ID`: Organization id where the app lives under
- `CONTENTFUL_APP_DEF_ID`: App definition id for identifying the app

### Uploading the code to Contentful
It as simple using the CLI command `npm run upload-ci`. This will perform two actions: upload the code, linking it to the app, and then finally activating the code ready for usage in both 

### Assigning an app to a field
Delivery functions are meant to help with resolving field data, meaning the app has to be assigned to a field location. You can read more about different app locations [here](https://www.contentful.com/developers/docs/extensibility/app-framework/locations/). The field is also required to be of the supported types for delivery function: Short text (`Symbol`) or JSON fields (`Object`). If these requirements are met, the UI has an option to enable resolution for the content type's fields during delivery when using GraphQL.

To enable both options you can also use the [web UI](https://app.contentful.com/deeplink?link=app-definition-list) by going under the "Locations" section in the app details UI, then selecting the appropriate supported locations. After [installing an app to your space environment](https://www.contentful.com/developers/docs/extensibility/app-framework/tutorial/#install-your-app-to-a-space), you can go under the [respective content type](https://app.contentful.com/deeplink?link=content-model) you want to assign the app and visit the appearance section for supported field and selecting the app which will reveal a checkbox to resolve the field when using Contentful's GraphQL API. 

### Using GraphQL app to see your app in action
The simplest way test whether your app is resolving data correctly is to install the [GraphQL Playground app](https://app.contentful.com/deeplink?link=apps&id=graphql-playground). You should see a new field with a suffix `_data` which should contain data resolved from your app.
