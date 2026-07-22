import { useFlags } from 'launchdarkly-react-client-sdk';

interface GoogleDocsAgentLDFlags {
  googleDocsAgentImprovements: boolean;
}

interface GoogleDocsAgentFlags {
  'google-docs-agent-improvements': boolean;
}

export const useGoogleDocsAgentFlags = (): GoogleDocsAgentFlags => {
  const flags = useFlags<GoogleDocsAgentLDFlags>();
  return {
    'google-docs-agent-improvements': flags.googleDocsAgentImprovements ?? false,
  };
};
