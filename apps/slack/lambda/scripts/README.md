# Slack App Scripts

## `upsertAppAction.ts`

Upserts (creates or updates) a specific Slack app action using environment variables. It reads configuration from `contentful-app-manifest.json`

### Usage
```bash
npm run upsert-app-action
```

### Environment Variables
Create a `.env` file with:
```env
CONTENTFUL_ACCESS_TOKEN=your_cma_token_here
CONTENTFUL_ORG_ID=your_organization_id_here
CONTENTFUL_APP_DEF_ID=your_app_definition_id_here
APP_ACTION_ID=sendSlackMessage
REACT_APP_BACKEND_BASE_URL=https://your-backend-url.com
```

### Troubleshooting
- **Missing environment variables**: Check all required variables are set
- **Action not found**: Verify `APP_ACTION_ID` matches an action in the manifest
- **Backend URL not found**: Set `REACT_APP_BACKEND_BASE_URL` environment variable
- **Invalid CMA token**: Verify `CONTENTFUL_ACCESS_TOKEN` is valid and has permissions