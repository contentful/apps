# App Event Transformation Function Template

App event transformation functions enable you to modify event payloads before they reach their destination by adding, removing, or changing data in the event. This template provides a starting point with skeleton code—you must add your custom transformation logic to meet your specific use case.

## What is an App Event Transformation Function?

Unlike filter functions that determine whether to process events or handler functions that react to events, transformation functions alter the event payload itself.

Common use cases for transforming events include:

- Adding computed fields or metadata to events
- Resolving references to include related content
- Converting data formats 
- Enriching content with data from external services (e.g., geocoding)
- Normalizing or standardizing field values

## Getting Started

### 1. Adding the Function to a Contentful App

#### Creating a New App with the Function

If you want to create a new app that includes the function template, run:

```bash
npx create-contentful-app@latest --function appevent-transformation
```

This command will generate a basic app template that includes: 

- A `functions` folder that contains the template, instructions, and relevant config files.
- All necessary scripts for building and deploying your function
- App manifest file
  - This file ensures that Contentful can properly identify, configure, and run your function.
  - For more information see: [Working with Functions](https://www.contentful.com/developers/docs/extensibility/app-framework/working-with-functions/)

#### Adding the Function to an Existing App

If you prefer to add the function to an existing app, you can run the following CLI commands from inside your app directory:

**Interactive Mode**

Run the CLI in interactive mode, which will prompt you for the necessary options:

```bash
npx --no-install @contentful/app-scripts generate-function
```

The interactive process will guide you through:
1. Selecting a function name
2. Choosing from available function examples
3. Selecting your preferred language (JavaScript or TypeScript)

**Non-interactive Mode**

For automated workflows or CI/CD pipelines, use the `--ci` flag with required parameters:

```bash
npx --no-install @contentful/app-scripts generate-function --ci --name <name> --example appevent-transformation --language typescript
```

**Available Parameters:**
- `--name <name>`: Your function name (any value except 'example')
- `--example <example>`: Template to use (e.g., 'appevent-transformation', 'external-references')
- `--language <language>`: 'javascript' or 'typescript' (defaults to typescript if invalid)
- `--ci`: Enables non-interactive mode

**Example:**
```bash
npx --no-install @contentful/app-scripts generate-function --ci --name content-enricher --example appevent-transformation --language typescript
```

When executed, this command:
- Creates a `functions` directory if one doesn't exist
- Adds the selected function template with your specified name
- Creates or updates the `contentful-app-manifest.json` file
- Updates your `package.json` to include function build commands

> **Note**: All function examples are sourced from the `contentful/apps/function-examples` repository.

### 2. Connect to an App Definition

If you haven't already created an app definition in Contentful, choose one of the options below.

#### Manually via the Web UI

- [Navigate to the Apps section in your organization](https://app.contentful.com/deeplink?link=app-definition-list)

- Click the "Create App" button

- Fill in the required fields.

- Proceed to the [Set Up Your Environment](#3-set-up-your-environment) step.

> **Note**: If you are unfamiliar with how to create a custom app definition in Contentful, please review the documentation here: [Create a Custom App - Tutorial](https://www.contentful.com/developers/docs/extensibility/app-framework/tutorial/?utm_source=webapp&utm_medium=app-listing&utm_campaign=in-app-help)

#### Via CLI

- Run: `npm run create-app-definition`
- Answer the prompted questions. Feel free to proceed with the default options provided.

  1. **Name of your application**.
     - This is how your app will be named and it will be displayed in a few places throughout the UI. The default is the name of the folder you created.
  2. **Select where your app can be rendered**.
     - This shows potential [app locations](https://www.contentful.com/developers/docs/extensibility/app-framework/locations/) where an app can be rendered within the Contentful Web app.
     - If your app is **frontendless** you do not need to select a location.
  3. **Contentful CMA endpoint URL**.
     - This refers to the URL used to interact with Contentful's Management APIs.
  4. **App Parameters**.
     - These are configurable values that can be used to set default values or define custom validation rules.
  5. The next steps will lead you through the process of providing a Contentful access token to the application and specifying the organization to which the application should be assigned.
     - This will automatically create a `.env` file with these fields for you
  6. Proceed to [Customize the Transformation Function](#4-customize-the-transformation-function)

### 3. Set Up Your Environment

If you created your app definition manually through the web UI, or the CLI did not create one for you, create a `.env` file in the root of your application with your Contentful credentials:

```env
CONTENTFUL_ORG_ID=your-organization-id
CONTENTFUL_APP_DEF_ID=your-app-definition-id
CONTENTFUL_ACCESS_TOKEN=your-access-token
```

These variables authenticate your function with Contentful and link it to your app definition.

> **Note**: You can generate an access token from your Space Settings menu. For the other values, you can find them in your Contentful organization and app settings.

### 4. Customize the Transformation Function

Open `functions/appevent-transformation-template.ts` and add your custom transformation logic based on your specific requirements.

#### App Event Transformation Function Example

To enhance entry events with geocoding data:

```ts
export const handler: FunctionEventHandler<FunctionTypeEnum.AppEventTransformation> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  // Check if this is an Entry event with location data
  if (event.headers['X-Contentful-Topic'].includes('Entry')) {
    const entryEvent = event.body;
    
    // Check if entry has location coordinates
    const latitude = entryEvent.body.fields?.latitude?.['en-US'];
    const longitude = entryEvent.body.fields?.longitude?.['en-US'];
    
    if (latitude && longitude) {
      try {
        // Example: Call a geocoding API to get address from coordinates
        const apiKey = context.params.GEOCODE_API_KEY;
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
        );
        
        const data = await response.json();
        
        // Add the geocoded address to the event payload
        return {
          body: {
            ...entryEvent.body,
            // Add transformed data to the payload
            geocodedAddress: data.results[0]?.formatted_address || 'Address not found'
          },
          headers: entryEvent.headers
        };
      } catch (error) {
        console.error('Geocoding failed:', error);
      }
    }
  }
  
  // Return the original event if no transformation was applied
  return {
    body: event.body,
    headers: event.headers
  };
};
```

> **Tip**: Consult the official documentation for detailed guidance on event structure and best practices.

### 5. Build and Upload Your Function

Currently, the only way to deploy a function is through the CLI. To do so, run the following commands:

```bash
# Build your function
npm run build

# Upload your function to Contentful
npm run upload
```

The build step is essential since the upload process relies on the compiled code. The CLI may prompt for additional details (e.g., the CMA endpoint URL) and offer to activate the bundle post-upload.

> **Note**: For more information on the differences between `upload` and `upload-ci`, see the [Create Contentful App Documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/create-contentful-app/)

### 6. Link Your Function to an Event Subscription

To activate your function, you need to subscribe it to specific events. There are two ways to do this:

#### Via the Contentful Web App

1. Open your app definition in the Contentful web app
2. Navigate to the "Event Subscriptions" tab
3. Create an event subscription for the events you want to transform
4. In the subscription settings, select your transformation function as the "Transformation Function"

#### Via the Content Management API (CMA)

Use the CMA to programmatically subscribe your function to events. This approach is ideal for automating the subscription process in your deployment scripts.

**Example**:

- The following example uses the Contentful Management client to create an event subscription that uses your transformation function:

    ```ts
    import { createClient } from 'contentful-management';

    const createSubscription = async () => {
      const client = createClient({
        accessToken: '<CMA_access_token>',
      });

      try {
        const space = await client.getSpace('<space_id>');
        const environment = await space.getEnvironment('<environment_id>');
        
        const subscription = await environment.createAppEventSubscription({
          fields: {
            name: { 'en-US': 'My Entry Transformer' },
            topics: { 'en-US': 'Entry.publish' },
            transformation: {
              'en-US': {
                functionId: '<your_transformation_function_id>',
              },
            },
            destination: {
              'en-US': {
                type: 'Webhook',
                url: 'https://your-destination-url.example.com',
              },
            }
          }
        });
        
        console.log('Subscription created:', subscription);
      } catch (error) {
        console.error(error);
      }
    };

    createSubscription();
    ```

- Be sure to replace `<CMA_access_token>`, `<space_id>`, `<environment_id>`, and `<your_transformation_function_id>` with your actual values.

- For full details and options, refer to the [official CMA API documentation.](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/app-event-subscriptions)

## Additional Resources

- [Contentful App Functions Documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/functions/)
- [Working with Functions](https://www.contentful.com/developers/docs/extensibility/app-framework/working-with-functions/)
- [App Event Subscriptions API Reference](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/app-event-subscriptions)
- [App Events Overview](https://www.contentful.com/developers/docs/extensibility/app-framework/app-events/)