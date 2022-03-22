const { getManagementToken } = require('@contentful/node-apps-toolkit');
const nodeFetch = require('node-fetch');
const get = require('lodash.get');

const privateKey = process.env['APP_IDENTITY_PRIVATE_KEY'] || '';
const appInstallationId = (process.env['APP_DEFINITION_ID'] || '').trim();
const baseUrl = 'https://api.contentful.com/';
const buildBaseURL = 'https://api.netlify.com/build_hooks/';
const assetTypes = ['Asset', 'DeletedAsset'];
const validEventTypes = ['Entry', 'DeletedEntry', ...assetTypes];

const validateParams = (installation) => {
  const validParams =
    get(installation, 'parameters.buildHookIds') &&
    typeof get(installation, 'parameters.buildHookIds') === 'string';

  if (!validParams) {
    throw new Error('Missing build hook parameters in app installation');
  }
};

const filterHookIdsFromCT = (eventData, installParams) => {
  // for old params;
  if (!installParams.events) {
    return [];
  }

  return installParams.buildHookIds.split(',').filter((hookId) => {
    const isUnsupportedParams = !(
      installParams.events[hookId] &&
      (installParams.events[hookId].cts || installParams.events[hookId].assets)
    );
    if (isUnsupportedParams) {
      return false;
    }

    // either we have an asset which we always publish or check if CT is supported
    return eventData.isAsset
      ? installParams.events[hookId].assets
      : installParams.events[hookId].cts === '*' ||
          installParams.events[hookId].cts.includes(eventData.contentTypeId);
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
    isAsset: false,
    appInstallationId,
  },
  getToken = getManagementToken,
  fetch = nodeFetch
) => {
  const { spaceId, environmentId, siteName, contentTypeId, isAsset } = appContextDetails;

  if (!siteName && !contentTypeId && !isAsset) {
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

  if (contentTypeId || isAsset) {
    return filterHookIdsFromCT({ contentTypeId, isAsset }, parsedRes.parameters);
  }
};

const fireBuildHook = async (buildHookId) => {
  const buildHookUrl = `${buildBaseURL}/${buildHookId}`;
  return nodeFetch(buildHookUrl, { method: 'POST' });
};

const extractAppContextDetails = (req) => {
  const [spaceId, environmentId, contentTypeId, siteName, isAsset] = [
    get(req.body, 'sys.space.sys.id') || get(req.headers, 'x-contentful-space-id'),
    get(req.body, 'sys.environment.sys.id') || get(req.headers, 'x-contentful-environment-id'),
    get(req.body, 'sys.contentType.sys.id') || '',
    get(req.body, 'siteName') || '',
    assetTypes.includes(get(req.body, 'sys.type')),
  ];

  return {
    spaceId,
    environmentId,
    contentTypeId,
    siteName,
    isAsset,
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
