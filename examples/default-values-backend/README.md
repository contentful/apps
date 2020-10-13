# Contentful Backend Demo APP

A demo App that will prefill certain values when an entry is created.

The purpose of this demo is to show how backend Apps can be setup and used.

## Prerequisites

This demo requires an up to date version of node.js and yarn.

In addition you will need a way to make the running app accessible over http, so
that it can receive events from Contentful. If you want to run the App locally,
we suggest using [ngrok](https://ngrok.com/) for this. It is a free tool that
allows you to easily create a url that allows access to applications served from localhost.

## Setup instructions

1. Run

```shell
ngrok http 3543
```

Take note of the url provided by NGROK. This step is only necessary when running
the app locally.

Although we are running the `http` command - ngrok will provide a https address.
We will need to use this secure URL for our app setup to work correctly.

2. Update `.env` with

```shell
CMA_TOKEN= # Obtained through the Contentful web app, see steps below
ORG_ID= # Your Contentful organisation id
SPACE_ID= # Your Contentful spaece id
ENVIRONMENT_ID= # Your contentul enviornment name
HOSTED_APP_URL= # The ngrok URL from step 1 - this must a https URL
```

The Content Management API (CMA) token can be obtained through the Contentful web app.
To do this, open the web app in your browser and navigate to the desired space,
then navigate to **Settings -> API Keys -> Content management tokens -> Generate personal token**.
This token has all the access rights as the account you create it for, but it is only used to set up the example App in your space. The actual backend code will not use it.

### Warning!

The setup for this demo will install an app, and create a content type in
the organization/space/environment you supplied in your `.env` file.
We highly recommend that you do not use your production environment for testing this App.

3. Run the app's setup script

```shell
yarn
yarn setup
# or
npm install
npm run setup
```

This step will
- Install dependencies
- Create an app definition in your Contentful organization
- Generate public and private keys for your app
- Install the app to the space and environment you specified
- Setup an event listener for new entries

This new private RSA key generated will be stored under `./keys`.

5. Run the backend App!

```shell
yarn start
```

6. Test it by going to the Contentful web app and creating a new entry of the
   `ExampleWithDefaultTitle` content type. You should see a prefilled title field!

## Concepts

The code for the example App is split into two parts.
- The **setup script**, which is provided for convenience.
- The **server code**, which contains all the application logic for the App.

Both files have comments explaining the individual steps.

All the steps that the setup script goes through can also be carried out in the Contentful web app.
This includes creating Apps in your organization,
generating a private/public RSA key pair via the App Key API,
setting up event listeners via the App events API
and installing the App into a space.

Once the App is installed, the application logic is quite simple.
When the previously defined event gets triggered,
the handler in the server code is executed with information about the event.
It then uses code from Contentfuls [node-apps-toolkit](https://github.com/contentful/node-apps-toolkit) to generate
a temporary AppToken by authenticating with the private key.
This can be used to freely access the API to make changes to the specified space and environment.
In this case, new Entries for a certain Content Type are pre-filled with data.
