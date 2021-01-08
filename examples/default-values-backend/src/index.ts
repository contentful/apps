/*
 * This file is the application backend that would run on your servers.
 * It is a simple Hapi server that listens for calls
 * from a webhook, and then uses an AppToken to interact
 * with the Content Management API (CMA).
 */

import * as Hapi from "@hapi/hapi";
import fetch from "node-fetch";
import { getManagementToken } from "@contentful/node-apps-toolkit";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const { APP_ID, CONTENT_TYPE_ID, BASE_URL, PRIVATE_APP_KEY } = process.env;
if (!APP_ID || !PRIVATE_APP_KEY) {
  throw new Error(
    "APP ID or private key not specified. Make sure to run app setup first."
  );
}

// -------------------
// MAIN SERVER
// -------------------

const startServer = async () => {
  const server = Hapi.server({
    port: 3543,
    host: "localhost",
    routes: {
      files: {
        relativeTo: path.join(__dirname, "../../dist"),
      },
    },
  });

  await server.register(require("@hapi/inert"));

  // Here we attach the webook handler to our server
  server.route({
    method: "POST",
    path: "/event-handler",
    handler: addDefaultDataOnEntryCreation,
  });

  // Here we register a very simple frontend to allow changing settings
  // The files for this are under ../public
  server.route({
    method: "GET",
    path: "/frontend",
    handler: function (request, h: any) {
      return h.file("index.html");
    },
  });
  server.route({
    method: "GET",
    path: "/{param*}",
    handler: {
      directory: {
        path: "./",
      },
    },
  });

  await server.start();

  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.error("[Unhandled Rejection]");

  console.log(err);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("[Uncaught Exception]");
  console.error(error);

  process.exit(1);
});

startServer();

// -------------------
// HANDLER FOR WEBHOOK
// -------------------

// This route is listening to a webhook that is setup to be called
// whenever an Entry of our example content type is created
const addDefaultDataOnEntryCreation = async (
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) => {
  try {
    const payload = request.payload as {
      sys: {
        id: string;
        version: string;
        space: { sys: { id: string } };
        environment: { sys: { id: string } };
        contentType: { sys: { id: string } };
      };
    };

    // First we extract the Entry id and version from the payload
    const { id, version, contentType, space, environment } = payload.sys;
    console.log(`Received webhook request because Entry ${id} was created`);

    if (contentType.sys.id !== CONTENT_TYPE_ID) {
      // If the content type does not match the one we created in setup, we just
      // ignore the event
      console.log(
        `Entry's content type: ${contentType.sys.id} did not match the content type created for the App, ignoring`
      );
      return h.response("success").code(204);
    }

    // We generate an AppToken based on our RSA keypair
    const spaceId = space.sys.id;
    const environmentId = environment.sys.id;
    const privateKey = fs.readFileSync(
      path.join(__dirname, "../../", PRIVATE_APP_KEY),
      { encoding: "utf8" }
    );
    const appAccessToken = await getManagementToken(privateKey, {
      appInstallationId: APP_ID,
      spaceId,
      environmentId,
    });

    // We get the app installation to read out the custom parameters set in the app settings
    const appInstallation = await fetch(
      `${BASE_URL}/spaces/${spaceId}/environments/${environmentId}/app_installations/${APP_ID}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${appAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    ).then((r) => r.json());

    const defaultValue =
      appInstallation?.parameters?.defaultValue || "Default value";

    // We make a request to contentful's CMA to update the Entry with our defaul values
    const res = await fetch(
      `${BASE_URL}/spaces/${spaceId}/environments/${environmentId}/entries/${id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${appAccessToken}`,
          "X-Contentful-Content-Type": contentType.sys.id,
          "Content-Type": "application/json",
          "X-Contentful-Version": version,
        },
        body: JSON.stringify({
          fields: { title: { "en-US": defaultValue } },
        }),
      }
    );
    if (res.status === 200) {
      console.log(`Set default values for Entry ${id}`);
      return h.response("success").code(204);
    } else {
      throw new Error("failed to set default values" + (await res.text()));
    }
  } catch (e) {
    console.error(e);
    throw new Error(e);
  }
};
