'use strict';

const {
  getBuildHooksFromAppInstallationParams,
  fireBuildHook,
  extractAppContextDetails,
} = require('../helpers/build-hook');

const appInstallationId = process.env['APP_DEFINITION_ID'] || '';

const appEventHandler = async (req, res, next) => {
  try {
    const appContextDetails = extractAppContextDetails(req.body);

    const buildHookIds = await getBuildHooksFromAppInstallationParams({
      ...appContextDetails,
      appInstallationId,
    });

    if (!buildHookIds || buildHookIds.length == 0) {
      console.log('Cannot find build hook');
      res.status(404);
      res.json({ sucess: false });
    }

    // fire all build hooks as there might be multiple
    await Promise.all(buildHookIds.map(fireBuildHook));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports = appEventHandler;
