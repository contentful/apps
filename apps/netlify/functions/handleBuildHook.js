import { fireBuildHook, getBuildHookIds } from "./lib/build-hook";

/**
 * This handler is invoked when your App Action is called
 *
 * @param {Object} event - Contains the name of the site hosted in netlify.
 * @param {Object} context - Provides access to the CMA client and other context information
 * @returns {Object} The response from your App Action
 */
export const handler = async (event, context) => {
  {
    // actions are for building only one site
    const [buildHookId] = getBuildHookIds(
      { siteName: event.body?.siteName },
      context.appInstallationParameters
    );

    if (!buildHookId) {
      throw new Error('Cannot find build hook');
    }

    await fireBuildHook(buildHookId);
    return { success: true };
  }
};
