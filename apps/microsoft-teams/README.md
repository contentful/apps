# Microsoft Teams app

An app that allows space admins to set up notifications to push messages to selected MS Teams channels whenever an app event occurs.

## System Architecture
### Front end

Located in `./frontend`, `create-contentful-app` app to allow users to configure how they'd like to integrate contentful into Microsoft teams.  Examples: what Entry Types/App Events to subscribe to, where to send channel notifications, log into their microsoft account etc.

### Back end - Hosted App Actions

Located in `./app-actions`

1. List teams with channel
2. Send card message to team/channel
3. Send card to appropriate channels per notification configurations

### Back end - MS Teams Bot Service
A "bot" service that interfaces with MS Teams, to support Contentful's MS Teams App.  Basically a container for handling Contentful and Microsoft authentication, as well as proxying some requests from hosted app actions to Microsoft, or Dynamo DB. [Read more](https://github.com/contentful/msteams-bot-service) in msteams-bot-service repo.

## Testing
### Mocking Data for Frontend development.
It is possible to run the Frontend app in isolation, but will likely require passing mocked data.

**Mocking MS-Teams Channels for Frontend**
```js
// apps/microsoft-teams/frontend/src/hooks/useGetTeamsChannels.ts
+ import { mockChannels } from '@test/mocks/mockChannels';

+  return import.meta.env.DEV ? mockChannels : channels;
-  return channels;
```

// Todo: Other mocking use cases?

### Local development (frontend)

- Set the following environment variable in `frontend/.env.development` using the `.env.development.example` file:
- `VITE_MS_APP_CLIENT_ID`: Client Id for Contentful app (from 1password)

### Testing backend actions

- Set the following environment variables in `app-actions/.env.development` using the `.env.development.example` file:
- `MSTEAMS_BOT_SERVICE_BASE_URL`: The ngrok URL
- `MSTEAMS_CLIENT_API_KEY`: MS Teams Bot Service Client Id (from 1password)

1. Run `npm run build:dev`
2. Deploy to sandbox: `npm run deploy:sandbox`
3. Call app action: `` ACCESS_TOKEN={access token here} npm run call-app-action -- -a {app action ID here} -s {space id here} -p `{ params list here}` ``
