const {
  getBuildHooksFromAppInstallationParams,
  fireBuildHook,
  extractAppContextDetails,
  validateAppEvent,
} = require('../helpers/build-hook');

const appEventHandler = async (req, res) => {
  try {
    validateAppEvent(req.body);
    const appContextDetails = extractAppContextDetails(req);

    const buildHookIds = await getBuildHooksFromAppInstallationParams(appContextDetails);

    if (!buildHookIds || buildHookIds.length === 0) {
      res.status(500);
      res.json({ message: 'Missing build hook' });
      return;
    }

    // fire all build hooks as there might be multiple
    await Promise.all(buildHookIds.map(fireBuildHook));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(err.status);
    res.json({
      message: err.message,
      status: err.status,
      info: 'Firing multiple build hooks failed',
    });
  }
};

module.exports = appEventHandler;
