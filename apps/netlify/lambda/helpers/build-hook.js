'use strict';

const { getManagementToken } = require('@contentful/node-apps-toolkit');
const nodeFetch = require('node-fetch');
const get = require('lodash.get');

const privateKey = process.env['APP_IDENTITY_PRIVATE_KEY'] || '';
const baseUrl = 'https://api.contentful.com/';
const buildBaseURL = 'https://api.netlify.com/build_hooks/';

const getBuildHooksFromAppInstallationParams = async (
  appContextDetails = {
    environmentId: '',
    spaceId: '',
    appInstallationId: '',
    buildHookId: '',
    contentTypeId: '',
  },
  getToken = getManagementToken,
  fetch = nodeFetch
) => {
  const { spaceId, environmentId, appInstallationId, buildHookId, contentTypeId } =
    appContextDetails;

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

  if (buildHookId && !appInstallationBuildHooks.includes(buildHookId)) {
    throw new Error('Invalid build hook');
  }

  if (contentTypeId) {
    return appInstallationBuildHooks;
  }

  return buildHookId ? [buildHookId] : [];
};

const fireBuildHook = async (buildHookId) => {
  const buildHookUrl = `${buildBaseURL}/${buildHookId}`;
  return nodeFetch(buildHookUrl, { method: 'POST' });
};

const extractAppContextDetails = (body) => {
  const [spaceId, environmentId, contentTypeId, appInstallationId, buildHookId] = [
    get(body, 'sys.space.sys.id'),
    get(body, 'sys.environment.sys.id'),
    get(body, 'sys.contentType.sys.id') || '',
    get(body, 'sys.appDefinition.sys.id') || '',
    get(body, 'body.buildHookId') || '',
  ];

  return {
    spaceId,
    environmentId,
    contentTypeId,
    appInstallationId,
    buildHookId,
  };
};

module.exports = {
  fireBuildHook,
  getBuildHooksFromAppInstallationParams,
  extractAppContextDetails,
};
