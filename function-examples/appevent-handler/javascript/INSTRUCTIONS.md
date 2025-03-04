## Building your Function

Use this command below to install the template.

```
npx create-contentful-app@latest --function appevent-handler --javascript
```

### Creating an app

You can create an app using CLI using `npm run create-app-definition`. This will prompt you to enter details for your new app and organization details. You can also create an app definition by [visiting the apps section](https://app.contentful.com/deeplink?link=app-definition-list) under your organization settings in the Contentful web UI and clicking on the "Create App" button on the top right.

### Using environment variables

You will need to set the following environment variables as listed below:

- `CONTENTFUL_ACCESS_TOKEN`: User management token used for authentication/authorization
- `CONTENTFUL_ORG_ID`: Organization id where the app lives under
- `CONTENTFUL_APP_DEF_ID`: App definition id for identifying the app

### Uploading the code to Contentful

It as simple using the CLI command `npm run upload-ci`. This will perform two actions: upload the code, linking it to the app, and then finally activating the code ready for usage in both

## Utilizing app event handler functions

When you create an app that utilizes [app events](https://www.contentful.com/developers/docs/extensibility/app-framework/app-events/), you can define the entities and topics for these events. However, you may also want to do some additional handling when these events occur. For example, you may want to send a copy of the event to an external service for logging or monitoring purposes.

Once you have built and uploaded your functions to Contentful, link them to your app event subscription using the [CMA](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/app-event-subscriptions/app-event-subscription/update-or-subscribe-to-events/console/js-plain) or the [Events](https://app.contentful.com/deeplink?link=app-definition&tab=events) tab on the App details page.  
