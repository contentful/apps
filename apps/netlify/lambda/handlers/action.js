const {
  getBuildHooksFromAppInstallationParams,
  fireBuildHook,
  extractAppContextDetails,
} = require('../helpers/build-hook');

const actionHandler = async (req, res) => {
  try {
    const appContextDetails = extractAppContextDetails(req);

    // actions are for building only one site
    const [validBuildHookId] = await getBuildHooksFromAppInstallationParams(appContextDetails);

    if (!validBuildHookId) {
      res.status(500);
      res.json({ message: 'Cannot find build hook' });
      return;
    }

    await fireBuildHook(validBuildHookId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(err.status);
    res.json({
      message: err.message,
      status: err.status,
      info: 'Firing single build hooks failed',
    });
  }
};

module.exports = actionHandler;
