'use strict';

const get = require('lodash.get');
const { getBuildHooksFromAppInstallationParams, fireBuildHook } = require('../helpers/build-hook');

const actionHandler = async (req, res, next) => {
  try {
    const appActionCall = req.body;
    const [spaceId, environmentId, appInstallationId, buildHookId] = [
      get(appActionCall, 'sys.space.sys.id'),
      get(appActionCall, 'sys.environment.sys.id'),
      get(appActionCall, 'sys.appDefinition.sys.id'),
      get(appActionCall, 'body.buildHookId'),
    ];

    // actions are for building only one site
    const [validBuildHookId] = await getBuildHooksFromAppInstallationParams({
      spaceId,
      environmentId,
      appInstallationId,
      buildHookId,
    });

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
