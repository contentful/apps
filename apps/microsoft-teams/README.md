# Microsoft Teams app

An app that allows space admins to set up notifications to push messages to selected MS Teams channels whenever an app event occurs.

## Testing

### Local development (frontend)

- Set the following environment variable in `frontend/.env.development` using the `.env.development.example` file:
- `VITE_MS_APP_CLIENT_ID`: Client Id for Contentful app (from 1password)

### Testing backend actions

- Set the following environment variables in `app-actions/.env.development` using the `.env.development.example` file:
- `MSTEAMS_BOT_SERVICE_BASE_URL`: The ngrok URL
- `MSTEAMS_CLIENT_API_KEY`: MS Teams Bot Service Client Id (from 1password)

1. Run `npm run build:dev` NOTE: you may need to pass the `VITE_MS_APP_CLIENT_ID` env var for it to build correctly, so `VITE_MS_APP_CLIENT_ID=<id> npm run build:dev`
2. Deploy to sandbox: `npm run deploy:sandbox` NOTE: you may need to pass the org and cma token, so `DEV_TESTING_ORG_ID=<org_id> TEST_CMA_TOKEN=<cma_token> npm run deploy:sandbox`
3. Call app action: `` ACCESS_TOKEN={access token here} npm run call-app-action -- -a {app action ID here} -s {space id here} -p `{ params list here}` ``
