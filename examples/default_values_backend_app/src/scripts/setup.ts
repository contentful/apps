const nodeFetch = require("node-fetch");
const { getPublicKey, getKeyId, isOk } = require("../utils");
const fs = require("fs");
const path = require("path");
import dotenv from "dotenv";
dotenv.config();
const { ORG_ID, SPACE_ID, ENVIRONMENT_ID, APP_LOCATION, BASE_URL } = process.env;

// ---------------------------------------
// Main setup flow
// ---------------------------------------

async function main() {
  try {
    if (!process.env.CMA_TOKEN) {
      throw new Error("no CMA_TOKEN defined");
    }

    const APP_ID = await createAppDefinition();
    await installApp(APP_ID);
    await createAppKey(APP_ID);
    const contentTypeId = await createContentType();
    await createWebHook(APP_ID, contentTypeId);

    fs.appendFileSync(path.join(__dirname, "../..", ".env"), `APP_ID=${APP_ID}`);

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
    console.log("Key creation failed: " + (await response.text()));
  }
}

async function installApp(APP_ID: string) {
  const body = {};

  const response = await nodeFetch(
    `${BASE_URL}/spaces/${SPACE_ID}/environments/${ENVIRONMENT_ID}/app_installations/${APP_ID}`,
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
    console.log(`Installed app!`);
  } else {
    console.log("App installation failed: " + (await response.text()));
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
    return console.log("Content type setup failed: " + (await response.text()));
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
    return console.log("Publish content type failed: " + responseBody);
  }
}

async function createWebHook(APP_ID: string, contentTypeId: string) {
  const pubKey = getPublicKey();
  const keyId = getKeyId();

  const body = {
    url: `${APP_LOCATION}/create`,
    name: "on content create",
    topics: ["Entry.create"],
    filters: [
      {
        equals: [
          {
            doc: "sys.contentType.sys.id",
          },
          contentTypeId,
        ],
      },
    ],
  };

  const response = await nodeFetch(`${BASE_URL}/spaces/${SPACE_ID}/webhook_definitions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/vnd.contentful.management.v1+json",
      Authorization: `Bearer ${process.env.CMA_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (isOk(response.status)) {
    console.log("Set up webhook!");
  } else {
    console.log("Webhook setup failed: " + (await response.text()));
  }
}
