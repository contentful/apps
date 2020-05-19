const nodeFetch = require("node-fetch");
const { getPublicKey, getKeyId, isOk } = require("../utils");
const fs = require("fs");
const path = require("path");
import dotenv from "dotenv";
dotenv.config();
const { ORG_ID, SPACE_ID, ENVIRONMENT_ID, HOSTED_APP_URL, BASE_URL } = process.env;

/* The code in this file uses the information that you should have added to the
 * .env file to set up your enviornment for the backend App to work correctly.
 */

// ---------------------------------------
// Main setup flow
// ---------------------------------------

async function main() {
  try {
    if (!process.env.CMA_TOKEN) {
      throw new Error("no CMA_TOKEN defined");
    }

    let APP_ID;
    if (process.env.APP_ID) {
      APP_ID = process.env.APP_ID;
      console.log(
        "Found an existing APP_ID in .env, re-using it. If you want to set up a new app, remove APP_ID from .env"
      );
    } else {
      APP_ID = await createAppDefinition();
      fs.appendFileSync(path.join(__dirname, "../..", ".env"), `APP_ID=${APP_ID}\n`);
    }

    await installApp(APP_ID);
    await createAppKey(APP_ID);

    if (process.env.CONTENT_TYPE_ID) {
      console.log(
        "Found an existing CONTENT_TYPE_ID in .env, re-using it. If you want to set up a new content type, remove CONTENT_TYPE_ID from .env"
      );
    } else {
      const CONTENT_TYPE_ID = await createContentType();
      fs.appendFileSync(
        path.join(__dirname, "../..", ".env"),
        `CONTENT_TYPE_ID=${CONTENT_TYPE_ID}\n`
      );
    }

    await createAppEvent(APP_ID);

    console.log(`Created new APP APP_ID=${APP_ID}`);
  } catch (e) {
    console.log(e);
  }
}

main().catch(e => {
  console.log(e);
});

// ---------------------------------------
// Helper functions
// ---------------------------------------

async function createAppDefinition() {
  const body = {
    name: "Backend demo app",
    src: "http://localhost:3666",
    locations: [
      {
        location: "app-config",
      },
    ],
  };

  const response = await nodeFetch(`${BASE_URL}/organizations/${ORG_ID}/app_definitions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/vnd.contentful.management.v1+json",
      Authorization: `Bearer ${process.env.CMA_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (isOk(response.status)) {
    const j = await response.json();
    console.log(`Created app definition. APP_ID is ${j.sys.id}`);
    return j.sys.id;
  } else {
    throw new Error("App definition creation failed: " + (await response.text()));
  }
}

async function createAppKey(APP_ID: string) {
  const pubKey = getPublicKey();
  const keyId = getKeyId();

  const body = {
    jwk: {
      kty: "RSA",
      use: "sig",
      alg: "RS256",
      x5c: [pubKey.toString("base64")],
      kid: keyId,
      x5t: keyId,
    },
  };

  const response = await nodeFetch(
    `${BASE_URL}/organizations/${ORG_ID}/app_definitions/${APP_ID}/keys`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CMA_TOKEN}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (isOk(response.status)) {
    console.log(`New public key ${keyId} created for app ${APP_ID}`);
  } else {
    throw new Error("Key creation failed: " + (await response.text()));
  }
}

async function installApp(APP_ID: string) {
  const response = await nodeFetch(
    `${BASE_URL}/spaces/${SPACE_ID}/environments/${ENVIRONMENT_ID}/app_installations/${APP_ID}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/vnd.contentful.management.v1+json",
        Authorization: `Bearer ${process.env.CMA_TOKEN}`,
      },
      body: JSON.stringify({}),
    }
  );

  if (isOk(response.status)) {
    console.log(`Installed app!`);
  } else {
    throw new Error("App installation failed: " + (await response.text()));
  }
}

async function createContentType() {
  const body = {
    name: "example",
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
    `${BASE_URL}/spaces/${SPACE_ID}/environments/${ENVIRONMENT_ID}/content_types`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.contentful.management.v1+json",
        Authorization: `Bearer ${process.env.CMA_TOKEN}`,
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
        Authorization: `Bearer ${process.env.CMA_TOKEN}`,
        "X-Contentful-Version": responseBody.sys.version,
      },
      body: {},
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
    targetUrl: `${HOSTED_APP_URL}/create`,
    topics: ["Entry.create"],
  };

  const response = await nodeFetch(
    `${BASE_URL}/organizations/${ORG_ID}/app_definitions/${APP_ID}/event_subscription`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/vnd.contentful.management.v1+json",
        Authorization: `Bearer ${process.env.CMA_TOKEN}`,
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
