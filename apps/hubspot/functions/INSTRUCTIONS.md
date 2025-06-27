# App Action Function Template

App Action functions enable communication between apps by providing serverless endpoints that can be invoked through app actions. This template provides a starting point with skeleton code—you must add your custom action logic to meet your specific use case.

## What is an App Action Function?

App Action functions are serverless workloads that run on Contentful's infrastructure to provide enhanced flexibility and customization. Unlike event-based functions that respond to system events, App Actions are explicitly invoked by an app or external system with specific parameters to perform an operation.

Common use cases for App Action functions include:

- Bulk content operations
- Data synchronization between environments or spaces
- Integration with external services and APIs
- Content transformation and migration
- Custom content validation or enrichment

## Getting Started

### 1. Adding the Function to a Contentful App

#### Creating a New App with the Function

If you want to create a new app that includes the function template, run:

```bash
npx create-contentful-app@latest --function appaction-call
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
npx --no-install @contentful/app-scripts generate-function --ci --name <name> --example appaction-call --language typescript
```

**Available Parameters:**

- `--name <name>`: Your function name (any value except 'example')
- `--example <example>`: Template to use (e.g., 'appaction-call', 'external-references')
- `--language <language>`: 'javascript' or 'typescript' (defaults to typescript if invalid)
- `--ci`: Enables non-interactive mode

**Example:**

```bash
npx --no-install @contentful/app-scripts generate-function --ci --name content-processor --example appaction-call --language typescript
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

- Fill in the required fields. If you want to test your App Action function using a UI, be sure to select **Page Location** and check the toggle for `Show app in main navigation`.

- Proceed to the [Set Up Your Environment](#3-set-up-your-environment) step.

> **Note**: If you are unfamiliar with how to create a custom app definition in Contentful, please review the documentation here: [Create a Custom App - Tutorial](https://www.contentful.com/developers/docs/extensibility/app-framework/tutorial/?utm_source=webapp&utm_medium=app-listing&utm_campaign=in-app-help)

#### Via CLI

- Run: `npm run create-app-definition`
- Answer the prompted questions. Feel free to proceed with the default options provided.

  1. **Name of your application**.
     - This is how your app will be named and it will be displayed in a few places throughout the UI. The default is the name of the folder you created.
  2. **Select where your app can be rendered**.
     - For testing App Actions, select **Page Location**, as this is where you will be able to test your app actions. Select `y` for showing your app in the main navigation, and then provide a name for the link.
     - If your app is **frontendless** you can skip selecting a location.
  3. **Contentful CMA endpoint URL**.
     - This refers to the URL used to interact with Contentful's Management APIs.
  4. **App Parameters**.
     - These are configurable values that can be used to set default values or define custom validation rules.
  5. The next steps will lead you through the process of providing a Contentful access token to the application and specifying the organization to which the application should be assigned.
     - This will automatically create a `.env` file with these fields for you
  6. Proceed to [Customize the App Action Function](#4-customize-the-app-action-function)

### 3. Set Up Your Environment

If you created your app definition manually through the web UI, or the CLI did not create one for you, create a `.env` file in the root of your application with your Contentful credentials:

```env
CONTENTFUL_ORG_ID=your-organization-id
CONTENTFUL_APP_DEF_ID=your-app-definition-id
CONTENTFUL_ACCESS_TOKEN=your-access-token
```

These variables authenticate your function with Contentful and link it to your app definition.

> **Note**: You can generate an access token from your Space Settings menu. For the other values, you can find them in your Contentful organization and app settings.

### 4. Customize the App Action Function

Open `functions/appaction-call-template.ts` and add your custom logic based on your specific requirements.

#### App Action Function Example

Here's an example that creates a new entry of a specific content type:

```ts
// Define your App Action parameters
type CreateEntryParams = {
  contentTypeId: string;
  fields: Record<string, any>;
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', CreateEntryParams>,
  context: FunctionEventContext
) => {
  // Access the CMA client
  const cma = context.cma!;

  try {
    // Extract parameters from the request
    const { contentTypeId, fields } = event.body;

    // Get the space and environment from the context
    const spaceId = context.spaceId;
    const environmentId = context.environmentId;

    if (!contentTypeId || !fields) {
      return {
        error: 'Missing required parameters: contentTypeId and fields are required',
      };
    }

    // Create an entry using the CMA client
    const entry = await cma.entry.create({
      spaceId,
      environmentId,
      contentTypeId,
      fields: Object.entries(fields).reduce((acc, [key, value]) => {
        acc[key] = { 'en-US': value };
        return acc;
      }, {}),
    });

    return {
      success: true,
      entry: {
        id: entry.sys.id,
        contentType: entry.sys.contentType.sys.id,
        createdAt: entry.sys.createdAt,
      },
    };
  } catch (error) {
    console.error('Error executing App Action:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while processing your request',
    };
  }
};
```

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

### 6. Create an App Action

To make your function accessible, you need to create an App Action that links to it. There are two ways to do this:

#### Via the Contentful Web App

1. Open your app definition in the Contentful web app
2. Navigate to the "App Actions" tab
3. Click "Create App Action" and fill in the required information:
   - Name: A descriptive name for your action
   - App Action ID: A unique identifier for this action
   - Type: Select "Function Invocation"
   - Function: Select your uploaded function
4. Click "Create"

#### Via the Command Line

You can programmatically create an App Action using the following command:

```bash
npm run upsert-actions
```

You will need to have set the environment variables described in the [Set Up Your Environment](#3-set-up-your-environment) step.

Alternatively, you can pass them as arguments:

```bash
npm run upsert-actions -- --organizationId=<your_org_id> --definitionId=<your_app_id> --token=<your_token>
```

The `upsert-actions` command will create the App Action if it doesn't exist, or update it if it does, linking it to your function.

If you're adding actions programmatically, you must update the `actions` array in your `contentful-app-manifest.json` file:

```json
"actions": [
  {
    "id": "yourCustomActionId",           // Unique identifier for your action, No Hyphens Allowed
    "name": "Your Custom Action Name",    // Display name shown in the UI
    "type": "function-invocation",        // Keep this as is for function-based actions
    "functionId": "appactionCall",            // Must match the function ID in the functions array
    "category": "Custom",                 // Action category
    "parameters": []                      // Parameters needed by the action
  }
]
```

## Additional Resources

- [Contentful App Functions Documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/functions/)
- [Working with Functions](https://www.contentful.com/developers/docs/extensibility/app-framework/working-with-functions/)
- [App Actions Overview](https://www.contentful.com/developers/docs/extensibility/app-framework/app-actions/)
