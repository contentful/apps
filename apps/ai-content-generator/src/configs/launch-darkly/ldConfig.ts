const ldConfig = {
  clientSideID: `${import.meta.env.VITE_LAUNCHDARKLY_CLIENT_ID}`,
  deferInitialization: false,
  flags: {
    'integrations-ai-content-generator-v-2': true,
  },
  options: {
    bootstrap: localStorage,
  },
};

type ldConfigType = { integrationsAiContentGeneratorV2: boolean };

export default ldConfig;

export type { ldConfigType };
