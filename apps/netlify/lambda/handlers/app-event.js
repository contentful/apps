'use strict';

const get = require('lodash.get');
const { getBuildHooksFromAppInstallationParams, fireBuildHook } = require('../helpers/build-hook');

const appInstallationId = process.env['APP_DEFINITION_ID'] || '';

const appEventHandler = async (req, res, next) => {
  try {
    const [spaceId, environmentId, contentTypeId] = [
      get(req.body, 'sys.space.sys.id'),
      get(req.body, 'sys.environment.sys.id'),
      get(req.body, 'sys.contentType.sys.id'),
    ];

    const buildHookIds = await getBuildHooksFromAppInstallationParams({
      spaceId,
      environmentId,
      contentTypeId,
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
