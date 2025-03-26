# Kitchen Sink Function Template

This unified template provides a single function that can handle all Contentful Management function types: App Action, App Event Handler, App Event Filter, and App Event Transformation. This approach allows you to manage multiple function types in a single codebase with shared logic.

## What is the Kitchen Sink Function Template?

This template helps you create a unified Contentful function that can respond to different event types based on the incoming request. The main handler routes the request to specific sub-handlers depending on the event type:

- **App Action**: Functions invoked directly by apps to perform operations
- **App Event Handler**: Functions that react to Contentful events like entry publishing
- **App Event Filter**: Functions that determine which events should be processed
- **App Event Transformation**: Functions that modify event payloads before delivery

Use this template when you want to:
- Implement multiple function types with shared logic
- Create a unified codebase for handling various Contentful events
- Simplify deployment by maintaining a single function bundle

## Getting Started

### 1. Adding the Function to a Contentful App

#### Creating a New App with the Function

To create a new app that includes this unified function template, run:

```bash
npx create-contentful-app@latest --function kitchen-sink
```

This command will generate a basic app template that includes:

- A `functions` folder that contains the unified template
- All necessary scripts for building and deploying your function
- App manifest file

#### Adding the Function to an Existing App

If you prefer to add the function to an existing app, you can run the following CLI commands:

**Interactive Mode**

```bash
npx --no-install @contentful/app-scripts generate-function
```

The interactive process will guide you through selecting options for your function.

**Non-interactive Mode**

```bash
npx --no-install @contentful/app-scripts generate-function --ci --name <name> --example kitchen-sink --language typescript
```

**Available Parameters:**
- `--name <name>`: Your function name (any value except 'example')
- `--example <example>`: Use 'kitchen-sink' for this template
- `--language <language>`: 'javascript' or 'typescript'
- `--ci`: Enables non-interactive mode

### 2. Connect to an App Definition

If you haven't already created an app definition in Contentful, choose one of the options below.

#### Manually via the Web UI

- Navigate to the Apps section in your organization
- Click the "Create App" button
- Fill in the required fields. For testing App Actions interactively, select **Page Location** and check the toggle for `Show app in main navigation`.

#### Via CLI

- Run: `npm run create-app-definition`
- Follow the prompts to configure your app

### 3. Set Up Your Environment

Create a `.env` file in the root of your application with your Contentful credentials:

```env
CONTENTFUL_ORG_ID=your-organization-id
CONTENTFUL_APP_DEF_ID=your-app-definition-id
CONTENTFUL_ACCESS_TOKEN=your-access-token
```

### 4. Customize the Function

Open `functions/kitchen-sink-template.ts` and customize each handler based on your requirements. The file includes separate handlers for each function type:

```ts
// App Action handler
const appActionHandler = async (event: AppActionRequest, context: FunctionEventContext) => {
  // Your App Action logic here
};

// App Event handler
const appEventHandler = async (event: AppEventRequest, context: FunctionEventContext) => {
  // Your App Event Handler logic here
};

// App Event Filter
const appEventFilter = (event: AppEventRequest, context: FunctionEventContext) => {
  // Your App Event Filter logic here
};

// App Event Transformation
const appEventTransformation = async (event: AppEventRequest, context: FunctionEventContext) => {
  // Your App Event Transformation logic here
};

// Main handler that routes to the appropriate function
export const handler: FunctionEventHandler = async (event, context) => {
  // Routes events to the correct handler based on event type
  switch (event.type) {
    case 'appaction.call':
      return appActionHandler(event as AppActionRequest, context);
    case 'appevent.handler':
      return appEventHandler(event as AppEventRequest, context);
    case 'appevent.filter':
      return appEventFilter(event as AppEventRequest, context);
    case 'appevent.transformation':
      return appEventTransformation(event as AppEventRequest, context);
    default:
      throw new Error(`Unsupported event type: ${event.type}`);
  }
};
```

You can customize each handler independently or share logic between them. For function-specific examples and guidance, refer to the individual function templates.

### 5. Build and Upload Your Function

Build and upload your function using the provided scripts:

```bash
# Build your function
npm run build

# Upload your function to Contentful
npm run upload
```

### 6. Connect Your Function to App Actions and Event Subscriptions

After uploading the function, you need to connect it to App Actions and/or Event Subscriptions:

#### For App Actions

Create an App Action via the Web UI or using the command line:

```bash
npm run upsert-actions
```

For this command to work, set the environment variables described in section 3 or pass them as arguments:

```bash
npm run upsert-actions -- --organizationId=<your_org_id> --definitionId=<your_app_id> --token=<your_token>
```

If you're adding actions programmatically, you must update the `actions` array in your `contentful-app-manifest.json` file:

```json
"actions": [
  {
    "id": "yourCustomActionId",           // Unique identifier for your action, No Hyphens Allowed
    "name": "Your Custom Action Name",    // Display name shown in the UI
    "type": "function-invocation",        // Keep this as is for function-based actions
    "functionId": "kitchenSink",          // Must match the function ID in the functions array
    "category": "Custom",                 // Action category 
    "parameters": []                      // Parameters needed by the action                      
  }
]
```

#### For App Event Handlers, Filters, and Transformations

Create Event Subscriptions via the Web UI or using the Content Management API. When creating subscriptions:

- For an event handler, set your function as the "Destination"
- For an event filter, set your function as the "Filter Function"
- For an event transformation, set your function as the "Transformation Function"

## Additional Resources

- [Contentful App Functions Documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/functions/)
- [Working with Functions](https://www.contentful.com/developers/docs/extensibility/app-framework/working-with-functions/)
- [App Actions Overview](https://www.contentful.com/developers/docs/extensibility/app-framework/app-actions/)
- [App Events Overview](https://www.contentful.com/developers/docs/extensibility/app-framework/app-events/)
