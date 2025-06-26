/**
 * Helper functions for Contentful operations
 */

/**
 * Fetch all content types from the Contentful space
 * @param cma Content Management API client
 * @returns Array of content types
 */
export const getContentTypes = async (cma: any): Promise<any[]> => {
  try {
    const response = await cma.contentType.getMany({});
    return response.items || [];
  } catch (error) {
    console.error('Error fetching content types:', error);
    return [];
  }
};
