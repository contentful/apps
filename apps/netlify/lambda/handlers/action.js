'use strict';

const {
  getBuildHooksFromAppInstallationParams,
  fireBuildHook,
  extractAppContextDetails,
} = require('../helpers/build-hook');

const actionHandler = async (req, res, next) => {
  try {
    const appContextDetails = extractAppContextDetails(req.body);

    // actions are for building only one site
    const [validBuildHookId] = await getBuildHooksFromAppInstallationParams(appContextDetails);

    if (!validBuildHookId) {
      console.log('Cannot find build hook');
      res.status(404);
      res.json({ sucess: false });
    }

    await fireBuildHook(validBuildHookId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports = actionHandler;
