import { PlainClientAPI } from 'contentful-management';

/*
 * Fetches the user selected content types that the user wants the AI to create entries for
 * @param cma Content Management API client
 * @param contentTypeIds Array of content type IDs
 * @returns array of Content type json objects
 */
export const fetchContentTypes = async (
  cma: PlainClientAPI,
  contentTypeIds: Set<string>
): Promise<any> => {
  try {
    const response = await cma.contentType.getMany({});
    const selectedContentTypes = response.items.filter((item) => contentTypeIds.has(item.sys.id));
    return selectedContentTypes;
  } catch (error) {
    throw new Error(`Failed to fetch content types ${contentTypeIds}: ${error}`);
  }
};
