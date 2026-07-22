import { useGoogleDocsAgentFlags } from '../../hooks/useGoogleDocsAgentFlags';
import { PageAsyncRuns } from './PageAsyncRuns';
import { PageLegacy } from './PageLegacy';

const Page = () => {
  const flags = useGoogleDocsAgentFlags();
  return flags['google-docs-agent-improvements'] ? <PageAsyncRuns /> : <PageLegacy />;
};

export default Page;
