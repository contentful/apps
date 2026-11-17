const BUILD_HOOKS_BASE_URL = 'https://api.netlify.com/build_hooks';
const ASSET_TYPES = ['Asset', 'DeletedAsset'];
const VALID_EVENT_TYPES = ['Entry', 'DeletedEntry', ...ASSET_TYPES];

const validateParams = (parameters) => {
  if (!parameters?.buildHookIds || typeof parameters.buildHookIds !== 'string') {
    throw new Error('Missing build hook parameters in app installation');
  }
};

const filterHookIdsFromCT = ({ contentTypeId, isAsset }, parameters) => {
  // for old params
  if (!parameters.events) {
    return [];
  }

  return parameters.buildHookIds.split(',').filter((hookId) => {
    const hookEvents = parameters.events[hookId];
    if (!(hookEvents && (hookEvents.cts || hookEvents.assets))) {
      return false;
    }

    // either we have an asset which we always publish or check if CT is supported
    return isAsset
      ? hookEvents.assets
      : hookEvents.cts === '*' || hookEvents.cts.includes(contentTypeId);
  });
};

const getBuildHookIdFromSiteName = (siteName, parameters) => {
  const buildHookIndex = parameters.siteNames.split(',').indexOf(siteName);
  // build hooks are ordered in the same way as siteName
  return buildHookIndex > -1 ? parameters.buildHookIds.split(',')[buildHookIndex] : null;
};

const fireBuildHook = async (buildHookId) => {
  const res = await fetch(`${BUILD_HOOKS_BASE_URL}/${buildHookId}`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Netlify build hook responded with status ${res.status}`);
  }
};

const validateAppEvent = (body) => {
  if (!VALID_EVENT_TYPES.includes(body?.sys?.type)) {
    throw new Error('Unsupported entity type');
  }
};

const getEventDetails = (body) => ({
  contentTypeId: body?.sys?.contentType?.sys?.id || '',
  isAsset: ASSET_TYPES.includes(body?.sys?.type),
});

export {
  getBuildHookIdFromSiteName,
  validateParams,
  filterHookIdsFromCT,
  fireBuildHook,
  validateAppEvent,
  getEventDetails,
};
