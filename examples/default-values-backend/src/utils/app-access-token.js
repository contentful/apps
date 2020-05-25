const fetch = require("node-fetch");
import dotenv from "dotenv";
dotenv.config();
const { BASE_URL } = process.env;

const getAppAccessToken = async (appToken, spaceId, environmentId, appId) => {
  const response = await fetch(
    `${BASE_URL}/spaces/${spaceId}/environments/${environmentId}/app_installations/${appId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appToken}`,
      },
    }
  );

  if (response.status !== 201) {
    throw new Error(await response.text());
  }

  const body = await response.json();
  console.log(
    `Successfully retrieved app access token for app ${appId} in space ${spaceId} and environment ${environmentId}`
  );
  return body.token;
};

module.exports = {
  getAppAccessToken,
};
