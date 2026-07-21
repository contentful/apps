import { useFlags } from 'launchdarkly-react-client-sdk';

interface GoogleDocsAgentFlags {
  'google-docs-agent-improvements': boolean;
  'google-docs-async-runs': boolean;
}

export const useGoogleDocsAgentFlags = (): GoogleDocsAgentFlags => {
  const flags = useFlags<GoogleDocsAgentFlags>();
  return {
    'google-docs-agent-improvements': flags['google-docs-agent-improvements'] ?? false,
    'google-docs-async-runs': flags['google-docs-async-runs'] ?? false,
  };
};
