'use strict';

const {
  getBuildHooksFromAppInstallationParams,
  fireBuildHook,
  extractAppContextDetails,
  validateAppEvent,
} = require('../helpers/build-hook');

const appInstallationId = process.env['APP_DEFINITION_ID'] || '';

const appEventHandler = async (req, res) => {
  try {
    validateAppEvent(req.body);
    const appContextDetails = extractAppContextDetails(req.body);

    const buildHookIds = await getBuildHooksFromAppInstallationParams({
      ...appContextDetails,
      appInstallationId,
    });

    if (!buildHookIds || buildHookIds.length === 0) {
      res.status(404);
      res.json({ messagge: 'missing build hook' });
    }

    // fire all build hooks as there might be multiple
    await Promise.all(buildHookIds.map(fireBuildHook));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400);
    res.json({ message: err.message });
  }
};

module.exports = appEventHandler;
