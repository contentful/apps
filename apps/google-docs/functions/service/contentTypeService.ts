import { PlainClientAPI } from 'contentful-management';

/*
 * Fetch a content type by ID
 * @param cma Content Management API client
 * @param contentTypeIds Array of content type IDs
 * @returns array of Content type json objects
 */
export const fetchContentTypes = async (
  cma: PlainClientAPI,
  contentTypeIds: Set<string>
): Promise<any> => {
  try {
    console.log('content type ids', [...contentTypeIds]);
    const response = await cma.contentType.getMany({});
    const filteredContentTypes = response.items.filter((item) => contentTypeIds.has(item.sys.id));
    return filteredContentTypes;
  } catch (error) {
    throw new Error(`Failed to fetch content types ${contentTypeIds}: ${error}`);
  }
};
