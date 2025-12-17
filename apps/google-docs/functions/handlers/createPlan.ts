import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { buildContentTypeGraph } from '../agents/planAgent/plan.agent';
import { fetchContentTypes } from '../service/contentTypeService';
import { initContentfulManagementClient } from '../service/initCMAClient';
import { ContentTypeProps } from 'contentful-management';

export type CreatePlanParameters = {
  contentTypeIds: string[];
};

interface AppInstallationParameters {
  openAiApiKey: string;
}

/**
 * App Action: Create Plan
 *
 * Analyzes selected content types and builds a nested relationship graph
 * showing which content types reference which others.
 *
 * Returns a simple JSON structure for UI visualization.
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
    'Building relationship graph for content types:',
    contentTypes.map((ct: ContentTypeProps) => ct.name).join(', ')
  );

  // Build the content type relationship graph
  const graph = await buildContentTypeGraph({
    openAiApiKey,
    contentTypes,
  });

  console.log('Content type relationship graph completed:', graph.summary);

  return {
    success: true,
    graph: graph.graph,
    summary: graph.summary,
  };
};
