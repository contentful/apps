import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { analyzeContentTypeRelationships } from './agents/planAgent/plan.agent';
import { fetchContentTypes } from './service/contentTypeService';
import { initContentfulManagementClient } from './service/initCMAClient';

export type CreatePlanParameters = {
  contentTypeIds: string[];
};

interface AppInstallationParameters {
  openAiApiKey: string;
}

/**
 * App Action: Create Plan
 *
 * This is the first step in the two-step flow for creating entries from a Google Doc.
 * It analyzes the selected content types to understand their relationships.
 *
 * The relationship analysis is returned to the UI for visualization, showing:
 * - What content types have been selected
 * - How they relate to each other (which fields reference which content types)
 * - A visual map of the content model
 *
 * After the user reviews the plan and uploads a document, the createEntries action
 * will use this structure to create the actual entries.
 */
export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  CreatePlanParameters
> = async (
  event: AppActionRequest<'Custom', CreatePlanParameters>,
  context: FunctionEventContext
) => {
  const { contentTypeIds } = event.body;
  const { openAiApiKey } = context.appInstallationParameters as AppInstallationParameters;

  if (!contentTypeIds || contentTypeIds.length === 0) {
    throw new Error('At least one content type ID is required');
  }

  const cma = initContentfulManagementClient(context);
  const contentTypes = await fetchContentTypes(cma, new Set<string>(contentTypeIds));

  console.log(
    'Analyzing relationships for content types:',
    contentTypes.map((ct) => ct.name).join(', ')
  );

  // Analyze the content type relationships
  const analysis = await analyzeContentTypeRelationships({
    openAiApiKey,
    contentTypes,
  });

  console.log('Content type relationship analysis completed:', analysis.summary);

  return {
    success: true,
    analysis,
    response: {
      summary: analysis.summary,
      totalContentTypes: analysis.totalContentTypes,
      totalRelationships: analysis.totalRelationships,
      contentTypes: analysis.contentTypes,
      relationships: analysis.relationships,
    },
  };
};
