const { getManagementToken } = require('@contentful/node-apps-toolkit');
const nodeFetch = require('node-fetch');
const get = require('lodash.get');

const privateKey = process.env['APP_IDENTITY_PRIVATE_KEY'] || '';
const appInstallationId = (process.env['APP_DEFINITION_ID'] || '').trim();
const baseUrl = 'https://api.contentful.com/';
const buildBaseURL = 'https://api.netlify.com/build_hooks/';
const validEventTypes = ['Entry', 'Asset', 'DeletedEntry', 'DeletedAsset'];

const validateParams = (installation) => {
  const validParams =
    get(installation, 'parameters.buildHookIds') &&
    typeof get(installation, 'parameters.buildHookIds') === 'string';

  if (!validParams) {
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

const getBuildHookIdFromSiteName = (siteName, params) => {
  const buildHookIndex = params.siteNames.split(',').indexOf(siteName);
  // build hooks are ordered in the same way as siteName
  return buildHookIndex > -1 ? [params.buildHookIds.split(',')[buildHookIndex]] : [];
};

const getBuildHooksFromAppInstallationParams = async (
  appContextDetails = {
    environmentId: '',
    spaceId: '',
    siteName: '',
    contentTypeId: '',
    appInstallationId,
  },
  getToken = getManagementToken,
  fetch = nodeFetch
) => {
  const { spaceId, environmentId, siteName, contentTypeId } = appContextDetails;

  if (!siteName && !contentTypeId) {
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

  if (siteName) {
    return getBuildHookIdFromSiteName(siteName, parsedRes.parameters);
  }

  if (contentTypeId) {
    return filterHookIdsFromCT(contentTypeId, parsedRes.parameters);
  }
};

const fireBuildHook = async (buildHookId) => {
  const buildHookUrl = `${buildBaseURL}/${buildHookId}`;
  return nodeFetch(buildHookUrl, { method: 'POST' });
};

const extractAppContextDetails = (req) => {
  const [spaceId, environmentId, contentTypeId, siteName] = [
    get(req.body, 'sys.space.sys.id') || get(req.headers, 'x-contentful-space-id'),
    get(req.body, 'sys.environment.sys.id') || get(req.headers, 'x-contentful-environment-id'),
    get(req.body, 'sys.contentType.sys.id') || '',
    get(req.body, 'siteName') || '',
  ];

  return {
    spaceId,
    environmentId,
    contentTypeId,
    siteName,
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
