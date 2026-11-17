import {
  fireBuildHook,
  validateAppEvent,
  getEventDetails,
  validateParams,
  getBuildHookIdFromSiteName,
  filterHookIdsFromCT,
} from './lib/build-hook';

/**
 * Fires the Netlify build hooks configured for an Entry/Asset event
 *
 * @param {Object} event - The app event to be handled
 * @param {Object} context - Provides the app installation parameters
 * @returns None
 */
export const handler = async (event, context) => {
  validateAppEvent(event.body);

  const { contentTypeId, isAsset } = getEventDetails(event.body);

  if (!contentTypeId && !isAsset) {
    throw new Error('Invalid request, requires action call or publish/unpublish event');
  }

  validateParams(context.appInstallationParameters);

  const buildHookIds = filterHookIdsFromCT(
    { contentTypeId, isAsset },
    context.appInstallationParameters
  );

  if (buildHookIds.length === 0) {
    throw new Error('Missing build hook');
  }

  // fire all build hooks as there might be multiple
  await Promise.all(buildHookIds.map(fireBuildHook));
};
