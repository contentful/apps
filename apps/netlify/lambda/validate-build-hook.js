'use strict';

const { getManagementToken } = require('@contentful/node-apps-toolkit');
const nodeFetch = require('node-fetch');

const privateKey = process.env['APP_IDENTITY_PRIVATE_KEY'] || '';
const baseUrl = 'https://api.contentful.com/';

const getBuildHookFromAppInstallationParams = async (
  appActionCall,
  getToken = getManagementToken,
  fetch = nodeFetch
) => {
  const [spaceId, environmentId, appInstallationId, buildHookId] = [
    appActionCall.sys.space.sys.id,
    appActionCall.sys.environment.sys.id,
    appActionCall.sys.appDefinition.sys.id,
    appActionCall.body.buildHookId,
  ];

  const token = await getToken(privateKey, {
    spaceId,
    environmentId,
    appInstallationId,
  });

  const rawResult = await fetch(
    `${baseUrl}/spaces/${spaceId}/environments/${environmentId}/app_installations/${appInstallationId}`,
    {
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application-json',
      },
    }
  );
  const parsedRes = await rawResult.json();

  if (!parsedRes.parameters || !parsedRes.parameters.buildHookIds) {
    throw new Error('Missing build hook parameters in app installation');
  }

  const appInstallationBuildHooks = parsedRes.parameters.buildHookIds.split(',');

  if (!appInstallationBuildHooks.includes(buildHookId)) {
    throw new Error('Invalid build hook');
  }

  return buildHookId;
};

module.exports = getBuildHookFromAppInstallationParams;
