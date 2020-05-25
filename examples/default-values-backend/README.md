# Contentful Backend Demo APP

A demo App that will prefill certain values when an entry is created.

The purpose of this demo is to show how backend Apps can be setup and used.


## Prerequisites
This demo requires an up to date version of node.js and yarn.

In addition you will need a way to make the running app accessible over http, so
that it can receive events from contentful. If you want to run the App locally, 
we suggest using [ngrok](https://ngrok.com/) for this. It is a tool that allows 
you to easily create a url that allows access to applications served from
localhost.

## Setup instructions

1. Run
shell```
ngrok http 3543
```
Take note of the url provided by NGROK. This step is only necessary when running
the app locally.

Although we are running the `http` command - ngrok will provide a https address.
We will need to use this secure URL for our app setup to work correctly.

2. Update `.env` with
shell```
CMA_TOKEN= # You can obtain this token from the contentful web app
ORG_ID= # Your contentful organisation id
SPACE_ID= # Your contentful spaece id
ENVIRONMENT_ID= # Your contentul enviornment name
HOSTED_APP_URL= # The ngrok URL from step 1 - this must a https URL
```

### Warning!
The setup for this demo will make install an app, and create a content type in
whatever orgnization/space/environment you use. We highly recommend that you do
not use your production environment for testing this App.


3. Run the app's setup script

```shell
make setup
```
This step will
* Install dependencies
* Generate public and private keys for your app
* Create an app definition in your contentful organization
* Install the app to the space and enviornment you specified
* Setup a webhook that listens for new entries

4. Run the backend App!
```shell
make start
```

5. Test it by going to the contentful web app and creating a new entry of the
   `Example` content type. You should see a prefilled title field!


