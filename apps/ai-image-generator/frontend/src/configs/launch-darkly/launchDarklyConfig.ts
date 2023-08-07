const launchDarklyConfig = {
  clientSideID: `${import.meta.env.VITE_LAUNCHDARKLY_CLIENT_ID}`,
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
