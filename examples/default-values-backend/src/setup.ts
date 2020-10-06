/*
 * This file is a setup script that uses your Content Management API (CMA) token
 * and the variables you specify in the ".env" file to:
 * + Create a new App
 * + Add the app to your Space
 * + Create a RSA key pair and use it to authenticate your app
 * + Create an example Content Type
 * + Set up a webhook that reacts to new Entries
 */

import nodeFetch from "node-fetch";
import fs from "fs";
import path from "path";
require("dotenv").config();
const {
  ORG_ID,
  SPACE_ID,
  ENVIRONMENT_ID,
  HOSTED_APP_URL,
  BASE_URL,
  CMA_TOKEN,
  PRIVATE_APP_KEY,
} = process.env;

// ---------------------------------------
// Main setup flow
// ---------------------------------------

async function main() {
  // Create App
  let APP_ID;
  if (process.env.APP_ID) {
    APP_ID = process.env.APP_ID;
    console.log(
      "Found an existing APP_ID in .env, re-using it. If you want to set up a new app, remove APP_ID from .env"
    );
  } else {
    APP_ID = await createAppDefinition();
    fs.appendFileSync(path.join(__dirname, "..", ".env"), `APP_ID=${APP_ID}\n`);
  }

  // Install App into space/environment
  await installApp(APP_ID, {
    // Here you are able to pass installation-specific configuration variables
    defaultValue: "This is the default value set by your app",
  });

  // Create an App Key
  if (fs.existsSync(path.join(__dirname, "..", PRIVATE_APP_KEY as string))) {
    console.log(
      "Found an existing private key under %s, re-using it.",
      PRIVATE_APP_KEY
    );
  } else {
    await createAppKey(APP_ID);
  }

  // Create an example Content Type
  if (process.env.CONTENT_TYPE_ID) {
    console.log(
      "Found an existing CONTENT_TYPE_ID in .env, re-using it. If you want to set up a new content type, remove CONTENT_TYPE_ID from .env"
    );
  } else {
    const CONTENT_TYPE_ID = await createContentType();
    fs.appendFileSync(
      path.join(__dirname, "..", ".env"),
      `CONTENT_TYPE_ID=${CONTENT_TYPE_ID}\n`
    );
  }

  // Add event webhook
  await createAppEvent(APP_ID);

  console.log(`Created new APP APP_ID=${APP_ID}`);
}

main().catch((e) => {
  console.error(e);
});

// ---------------------------------------
// Helper functions
// ---------------------------------------

const isOk = (status: number) => {
  return status < 400 && status > 99;
};

async function createAppDefinition() {
  const body = {
    name: "Default field values",
    src: `${HOSTED_APP_URL}/frontend`,
    locations: [
      {
        location: "app-config",
      },
    ],
  };

  const response = await nodeFetch(
    `${BASE_URL}/organizations/${ORG_ID}/app_definitions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.contentful.management.v1+json",
        Authorization: `Bearer ${CMA_TOKEN}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (isOk(response.status)) {
    const j = await response.json();
    console.log(`Created app definition. APP_ID is ${j.sys.id}`);
    return j.sys.id;
  } else {
    throw new Error(
      "App definition creation failed: " + (await response.text())
    );
  }
}

async function installApp(APP_ID: string, parameters: any) {
  const response = await nodeFetch(
    `${BASE_URL}/spaces/${SPACE_ID}/environments/${ENVIRONMENT_ID}/app_installations/${APP_ID}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/vnd.contentful.management.v1+json",
        Authorization: `Bearer ${CMA_TOKEN}`,
      },
      body: JSON.stringify({
        parameters,
      }),
    }
  );

  if (isOk(response.status)) {
    console.log(`Installed app!`);
  } else {
    throw new Error("App installation failed: " + (await response.text()));
  }
}

async function createAppKey(APP_ID: string) {
  const body = {
    generate: true,
  };

  const response = await nodeFetch(
    `${BASE_URL}/organizations/${ORG_ID}/app_definitions/${APP_ID}/keys`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CMA_TOKEN}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!isOk(response.status)) {
    throw new Error("Key creation failed: " + (await response.text()));
  }

  const { generated, jwk } = await response.json();
  const { privateKey } = generated;

  fs.writeFileSync(
    path.join(__dirname, "..", PRIVATE_APP_KEY as string),
    privateKey
  );
  console.log(
    `New key pair created for app ${APP_ID} and stored under "./keys"`
  );
  return { jwk, privateKey };
}

async function createContentType() {
  const body = {
    name: "ExampleWithDefaultTitle",
    displayField: "title",
    fields: [
      {
        id: "title",
        name: "Title",
        required: true,
        localized: true,
        type: "Symbol",
      },
    ],
  };

  const response = await nodeFetch(
    `${BASE_URL}/spaces/${SPACE_ID}/environments/${ENVIRONMENT_ID}/content_types/${body.name}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/vnd.contentful.management.v1+json",
        Authorization: `Bearer ${CMA_TOKEN}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (isOk(response.status)) {
    console.log("Set up example content type!");
  } else {
    throw new Error("Content type setup failed: " + (await response.text()));
  }

  const responseBody = await response.json();

  const publishResponse = await nodeFetch(
    `${BASE_URL}/spaces/${SPACE_ID}/environments/${ENVIRONMENT_ID}/content_types/${responseBody.sys.id}/published`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/vnd.contentful.management.v1+json",
        Authorization: `Bearer ${CMA_TOKEN}`,
        "X-Contentful-Version": responseBody.sys.version,
      },
      body: "{}",
    }
  );

  if (isOk(publishResponse.status)) {
    console.log("Published example content type!");
    return responseBody.sys.id;
  } else {
    throw new Error("Publish content type failed: " + responseBody);
  }
}

async function createAppEvent(APP_ID: string) {
  const body = {
    targetUrl: `${HOSTED_APP_URL}/event-handler`,
    topics: ["Entry.create"],
  };

  const response = await nodeFetch(
    `${BASE_URL}/organizations/${ORG_ID}/app_definitions/${APP_ID}/event_subscription`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/vnd.contentful.management.v1+json",
        Authorization: `Bearer ${CMA_TOKEN}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (isOk(response.status)) {
    console.log("Set up App Event!");
  } else {
    throw new Error("App event setup failed: " + (await response.text()));
  }
}
