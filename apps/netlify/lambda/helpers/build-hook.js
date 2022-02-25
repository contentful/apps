const { getManagementToken } = require('@contentful/node-apps-toolkit');
const nodeFetch = require('node-fetch');
const get = require('lodash.get');

const privateKey = process.env['APP_IDENTITY_PRIVATE_KEY'] || '';
const baseUrl = 'https://api.contentful.com/';
const buildBaseURL = 'https://api.netlify.com/build_hooks/';
const validEventTypes = ['Entry', 'Asset', 'DeletedEntry', 'DeletedAsset'];

const validateParams = (installation) => {
  const missingParams = get(installation, 'parameters.buildHookIds') === undefined;

  if (missingParams) {
    throw new Error('Missing build hook parameters in app installation');
  }
};

const filterHookIdsFromCT = (ct, installParams) => {
  return installParams.buildHookIds.split(',').filter((hookId) => {
    return (
      installParams.events &&
      installParams.events[hookId] &&
      (installParams.events[hookId] === '*' || installParams.events[hookId].includes(ct))
    );
  });
};

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

  if (!buildHookId && !contentTypeId) {
    throw new Error('Invalid request, requires action call or publish/unpublish event');
  }

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
  validateParams(parsedRes);

  const appInstallationBuildHooks = parsedRes.parameters.buildHookIds.split(',');

  if (buildHookId) {
    return appInstallationBuildHooks.includes(buildHookId) ? [buildHookId] : [];
  }

  if (contentTypeId) {
    return filterHookIdsFromCT(contentTypeId, parsedRes.parameters);
  }
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

const validateAppEvent = (body) => {
  const entityType = get(body, 'sys.type');

  if (!validEventTypes.includes(entityType)) {
    throw new Error('Unsupported entity type');
  }
};

module.exports = {
  fireBuildHook,
  getBuildHooksFromAppInstallationParams,
  extractAppContextDetails,
  validateAppEvent,
};
