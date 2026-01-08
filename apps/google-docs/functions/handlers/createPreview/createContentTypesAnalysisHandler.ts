import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { createContentTypeAnalysisWithAgent as analyzeContentTypesAgent } from '../../agents/contentTypeParserAgent/contentTypeParser.agent';
import { fetchContentTypes } from '../../service/contentTypeService';
import { initContentfulManagementClient } from '../../service/initCMAClient';

export type CreateContentTypesAnalysisParameters = {
  contentTypeIds: string[];
};

interface AppInstallationParameters {
  openAiApiKey: string;
}

export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  CreateContentTypesAnalysisParameters
> = async (
  event: AppActionRequest<'Custom', CreateContentTypesAnalysisParameters>,
  context: FunctionEventContext
) => {
  const { contentTypeIds } = event.body;
  const { openAiApiKey } = context.appInstallationParameters as AppInstallationParameters;

  if (!contentTypeIds || contentTypeIds.length === 0) {
    throw new Error('At least one content type ID is required');
  }

  const cma = initContentfulManagementClient(context);
  const contentTypes = await fetchContentTypes(cma, new Set<string>(contentTypeIds));

  const contentTypeParserAgentResult = await analyzeContentTypesAgent({
    contentTypes,
    openAiApiKey,
  });

  console.log('Content type analysis completed', contentTypeParserAgentResult);
  return {
    success: true,
    analysis: contentTypeParserAgentResult,
  };
};
