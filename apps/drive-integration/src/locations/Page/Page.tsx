import { useGoogleDocsAgentFlags } from '../../hooks/useGoogleDocsAgentFlags';
import { PageAsyncRuns } from './PageAsyncRuns';
import { PageLegacy } from './PageLegacy';

const Page = () => {
  const flags = useGoogleDocsAgentFlags();
  return flags['google-docs-async-runs'] ? <PageAsyncRuns /> : <PageLegacy />;
};

export default Page;
