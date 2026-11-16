import { getBuildHookIds, fireBuildHook, validateAppEvent, getEventDetails } from './lib/build-hook';

/**
 * Fires the Netlify build hooks configured for an Entry/Asset event
 *
 * @param {Object} event - The app event to be handled
 * @param {Object} context - Provides the app installation parameters
 * @returns None
 */
export const handler = async (event, context) => {
  validateAppEvent(event.body);

  const buildHookIds = getBuildHookIds(
    getEventDetails(event.body),
    context.appInstallationParameters
  );

  if (buildHookIds.length === 0) {
    throw new Error('Missing build hook');
  }

  // fire all build hooks as there might be multiple
  await Promise.all(buildHookIds.map(fireBuildHook));
};
