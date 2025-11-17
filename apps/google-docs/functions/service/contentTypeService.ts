import { PlainClientAPI } from 'contentful-management';

/*
 * Fetch a content type by ID
 * @param cma Content Management API client
 * @param contentTypeIds Array of content type IDs
 * @returns array of Content type json objects
 */
export const fetchContentTypes = async (
  cma: PlainClientAPI,
  contentTypeIds: Array<string>
): Promise<any> => {
  try {
    const response = await cma.contentType.getMany({ query: { ids: contentTypeIds as string[] } });
    return response;
  } catch (error) {
    throw new Error(`Failed to fetch content types ${contentTypeIds}: ${error}`);
  }
};
