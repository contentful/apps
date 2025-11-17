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
    // 70pkp58oElHwzUNTSlriuG
    const response = await cma.contentType.getMany({});
    // console.log('response', response);
    const filteredContentTypes = response.items.filter((item) => {
      console.log('item in content types', item.sys.id);
      if (contentTypeIds.has(item.sys.id)) return item;
    });
    console.log('filtered content types', filteredContentTypes);
    return filteredContentTypes;
  } catch (error) {
    throw new Error(`Failed to fetch content types ${contentTypeIds}: ${error}`);
  }
};
