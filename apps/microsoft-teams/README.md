# Microsoft Teams app

An app that allows space admins to set up notifications to push messages to selected MS Teams channels whenever an app event occurs.

## Testing

### Testing backend actions

- Set the following environment variables in `app-actions/.env` using the `.env.example` file:
- `MSTEAMS_BOT_SERVICE_BASE_URL`: the ngrok URL
- `MSTEAMS_CLIENT_API_KEY`: MS Teams Bot service Client Id (from 1password)

1. Run `npm run build`
2. Deploy to sandbox: `npm run deploy:sandbox`
3. Call app action: `` ACCESS_TOKEN={access token here} npm run call-app-action -- -a {app action ID here} -s {space id here} -p `{ params list here}` ``
