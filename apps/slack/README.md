[![Install to Contentful](https://www.ctfstatic.com/button/install-small.svg)](https://app.contentful.com/deeplink?link=apps&id=7ir40h24qLGSQWJ6JCS3sk)

# Contentful Slack App

The Contentful Slack App Repository contains the code responsible for the official Slack App in the Contentful Marketplace.

## Installing an app

Click [here](https://app.contentful.com/deeplink?link=apps&id=7ir40h24qLGSQWJ6JCS3sk) or head over to the [marketplace](https://www.contentful.com/marketplace/app/slack/) and follow the intructions how to install the app in your Contentful space.

## Send messages from my private app

You can send Slack messages from your own App Framework backend app. For this to work, the Slack app has to be installed to your space environment and setup for the target Slack workspace and channel.

```javascript
import { getManagementToken } from "@contentful/node-apps-toolkit";
import { readFileSync } from 'fs';

const APP_DEF_ID = 'app-def-id';
const SPACE_ID = 'space-id';
const ENV_ID = 'env-id';

// see https://www.contentful.com/developers/docs/extensibility/app-framework/app-keys/
const privateKey = readFileSync("key.pem", { encoding: "utf8", });
const token = await getManagementToken(privateKey, {
  appInstallationId: APP_DEF_ID,
  spaceId: SPACE_ID,
  environmentId: ENV_ID,
});

const cma = createClient({ accessToken: token, },
  {
    type: "plain",
    defaults: { spaceId: SPACE_ID, environmentId: ENV_ID, },
  }
);
await cma.appAction.call({
  actionId: 'TODO',
  body: {
    workspaceId: 'slack-workspace-id',
    channelId: 'channel-id',
    message: 'This message was sent from my custom Contentful app'
  }
})
```

## Support and feature requests

If you require support, or want to request a new feature then please use the [Github issues](https://github.com/contentful/slack-app/issues) or the [Contentful Comunity Slack](https://contentful.com/slack).

## Architecture

### Technologies

- The frontend is a regular react app scaffolded by [`create-react-app`](https://www.npmjs.com/package/create-contentful-app). We use [Contentful's Forma 36 Design System](https://f36.contentful.com/). The frontend is hosted on [AWS S3](https://aws.amazon.com/s3/).
- The backend is hosted using [AWS Lambda](https://aws.amazon.com/lambda/) with [Serverless](http://serverless.com/).
- Access tokens are stored in [AWS DynamoDB](https://aws.amazon.com/dynamodb)

### OAuth

- Clicking "Add to Slack" opens a new Slack window where the user has to approve the installation of the Slack app to their workspace
- Once approved, the window redirects to our backend
- The backend requests an access token from the Slack API
- The backend renders an empty html page which uses `window.postMessage` to send the access token to the Contentful config page
- When the user installs the app, the token is sent backend and persisted
- The workspace id (not the access token) is stored in the app's installation parameters

### Security

An organization's Slack workspace is the most sensitive part of a Company's internal communication. We therefore use all available feature by the used services to maximize security.

- We are using [request verification for App Events from Contentful](https://www.contentful.com/developers/docs/extensibility/app-framework/request-verification/)
- We are using [request verification for webhook requests from Slack](https://api.slack.com/authentication/verifying-requests-from-slack)
- Slack access tokens are persisted serverside and not exposed to the frontend after first installation
- Slack [token rotation](https://api.slack.com/authentication/rotation) is enabled which makes access tokens only valid 12 hours
- Secrets are stored in [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) and automatically rotated

## Local Development ⚙️

This sections explains how to run the Slack app locally.

### Requirements

- Slack account
- Contentful account
- Docker
- Node 16+

### General

- Start ngrok with `ngrok https 3000`
- Create a new Slack app [here](https://api.slack.com/apps)
  - Add the ngrok URL as redirect URL (Features -> OAuth & Permissions -> Redirect URLs)
  - Enable token rotation (Features -> OAuth & Permissions)

### Lambda

- Copy `lambda/config/serverless.dev.yml.example` to `lambda/config/serverless.dev.yml`
- Create a new Contentful app
  - Set frontend URL to `http://localhost:1234`
  - Enable config location
  - Eneable request verification and store the secret in `lambda/config/serverless.dev.yml` (`signingSecret` -> `signing_secret`)
  - Create a key pair. Save the private key at `lamba/private-key.pem`
- Configure Slack
  - Store Client ID and Client Secret (Basic Information -> App Credentials) in `lambda/config/serverless.dev.yml` (`oauthCredentials` -> `client_id` / `client_secret`)
  - Store Signing Secret (Basic Information -> App Credentials) in `lambda/config/serverless.dev.yml` (`slackSigningSecret` -> `signing_secret`)
- Add the ngrok URL to in the `lambda/config/serverless.dev.yml` (`customDomain` -> `domainName`). Remove the `https://` from the URL. Add a trailing `/dev` to the URL (e.g.: `domainName: be25-95-91-246-99.ngrok.io/dev`)
- Start a docker container with a local DynamoDB instance using `make start-backend`
- If you start the project for the first time, run `yarn create_table` in the container
- Run `yarn start:lambda` in the container

### Frontend

- Set the following variables in `frontend/.env.development`:
  - `REACT_APP_SLACK_CLIENT_ID`: The Slack app Client ID (Basic Information -> App Credentials -> Client ID)
  - `REACT_APP_BACKEND_BASE_URL`: The ngrok URL
- Run the frontend with `yarn run start:frontend`