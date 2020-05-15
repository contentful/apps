const fetch = require("node-fetch");

const getAppAccessToken = async (appToken, spaceId, environmentId, appId) => {
  const response = await fetch(
    `https://api.flinkly.com/spaces/${spaceId}/environments/${environmentId}/app_installations/${appId}/access_tokens`,
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
