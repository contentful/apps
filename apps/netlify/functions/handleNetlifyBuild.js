import { fireBuildHook, getBuildHookIdFromSiteName, validateParams } from './lib/build-hook';

/**
 * Fires the Netlify build hooks App Action is called
 *
 * @param {Object} event - Contains the name of the site hosted in netlify.
 * @param {Object} context - Provides access to the CMA client and other context information
 * @returns {Object} The response from your App Action
 */
export const handler = async (event, context) => {
  validateParams(context.appInstallationParameters);

  const buildHookId = getBuildHookIdFromSiteName(
    event.body?.siteName,
    context.appInstallationParameters
  );

  if (!buildHookId) {
    throw new Error('Cannot find build hook');
  }

  await fireBuildHook(buildHookId);
  return { success: true };
};
