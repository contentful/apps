# Klaviyo Entry Sync Function

This Contentful App Function automatically syncs Contentful entries to Klaviyo when they are published or updated.

## How it works

1. The function listens for `Entry.publish` and `Entry.update` events from Contentful
2. When an event is received, it:
   - Gets the entry data
   - Retrieves field mappings from the app installation parameters
   - Filters the mappings to those matching the entry's content type
   - Extracts field values from the entry
   - Syncs the content to Klaviyo via the Klaviyo API
   - Updates the sync status in the app installation parameters

## Deployment

To deploy this function:

1. Build the TypeScript files:
   ```bash
   cd apps/klaviyo/functions
   npm install
   npm run build
   ```

2. Upload the function to Contentful using the Contentful CLI:
   ```bash
   contentful function create --space-id <SPACE_ID> --environment-id <ENV_ID> --name "Klaviyo Entry Sync" --bundle ./dist
   ```

3. Connect the function to your app in the Contentful web interface:
   - Go to App Settings
   - Select the Klaviyo app
   - Under Functions, select the newly created function
   - Enable event subscription for Entry.publish and Entry.update events

## Configuration

The function requires the following parameters to be set in the app installation:

- `clientId`: Klaviyo OAuth Client ID
- `clientSecret`: Klaviyo OAuth Client Secret
- `fieldMappings`: Array of mappings between Contentful fields and Klaviyo fields

## Troubleshooting

Check the function logs in the Contentful web interface:
- Go to Settings > Functions
- Select the Klaviyo Entry Sync function
- View the Logs tab