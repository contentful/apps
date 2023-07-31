const ldConfig = {
  clientSideID: `${import.meta.env.VITE_LAUNCHDARKLY_CLIENT_ID}`,
  deferInitialization: false,
  flags: {
    'integrations-ai-content-generator-v-1': true,
  },
  options: {
    bootstrap: localStorage,
  },
};

type ldConfigType = { integrationsAiContentGeneratorV1: boolean };

export default ldConfig;

export type { ldConfigType };
