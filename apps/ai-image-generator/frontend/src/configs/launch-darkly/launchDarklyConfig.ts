const launchDarklyConfig = {
  // TO DO: Add as env variable.
  clientSideID: '',
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
