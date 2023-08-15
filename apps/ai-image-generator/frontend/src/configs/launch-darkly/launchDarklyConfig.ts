const launchDarklyConfig = {
  // TO DO: Add as env variable
  clientSideID: '588a047044b03e0b3211298e',
  deferInitialization: false,
  flags: {
    aiigFlagV2: true,
  },
  options: {
    bootstrap: localStorage,
  },
};

export type launchDarklyConfigType = { aiigFlagV2: boolean };

export default launchDarklyConfig;
