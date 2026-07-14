import { useFlags } from 'launchdarkly-react-client-sdk';

interface GoogleDocsAgentFlags {
  'google-docs-agent-improvements': boolean;
}

export const useGoogleDocsAgentFlags = (): GoogleDocsAgentFlags => {
  const flags = useFlags<GoogleDocsAgentFlags>();
  return {
    'google-docs-agent-improvements': flags['google-docs-agent-improvements'] ?? false,
  };
};
