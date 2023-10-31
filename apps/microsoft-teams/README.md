# Microsoft Teams app

An app that allows space admins to set up notifications to push messages to selected MS Teams channels whenever an app event occurs.

## Testing

### Testing backend actions

1. Deploy to sandbox: `npm run deploy:sandbox`
2. Call app action: `` ACCESS_TOKEN={access token here} npm run call-app-action -- -a {app action ID here} -s {space id here} -p `{ params list here}` ``
