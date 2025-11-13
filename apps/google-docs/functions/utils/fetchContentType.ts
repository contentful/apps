import { ContentTypeProps, createClient, PlainClientAPI } from 'contentful-management';
import { FunctionEventContext } from '@contentful/node-apps-toolkit';

/**
 * Initialize a Contentful Management API client from function context
 * @param context - Function event context from Contentful
 * @returns PlainClientAPI instance
 */
export function getCMAClient(context: FunctionEventContext): PlainClientAPI {
  if (!context.cmaClientOptions) {
    throw new Error(
      'CMA client options not available in this function type. See: https://www.contentful.com/developers/docs/extensibility/app-framework/functions/#using-the-cma'
    );
  }
  return createClient(context.cmaClientOptions, {
    type: 'plain',
    defaults: {
      spaceId: context.spaceId,
      environmentId: context.environmentId,
    },
  });
}

/*
 * Fetch a content type by ID
 * @param cma Content Management API client
 * @param contentTypeIds Array of content type IDs
 * @returns array of Content type json objects
 */
export const fetchContentTypes = async (cma: any, contentTypeIds: Array<string>): Promise<any> => {
  try {
    const response = await cma.contentType.getMany({ contentTypeIds });
    return response;
  } catch (error) {
    throw new Error(`Failed to fetch content types ${contentTypeIds}: ${error}`);
  }
};
