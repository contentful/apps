import { PlainClientAPI } from 'contentful-management';
import { ConfigAppSDK, CMAClient } from '@contentful/app-sdk';

export const getContentTypesWithoutLivePreview = async (
  cma: PlainClientAPI | CMAClient,
  sdk: ConfigAppSDK,
  excludedContentTypesIds: string[] = []
): Promise<any[]> => {
  try {
    let allContentTypes: any[] = [];
    let skip = 0;
    const limit = 1000;
    let areMoreContentTypes = true;

    while (areMoreContentTypes) {
      const response = await cma.contentType.getMany({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        query: { skip, limit },
      });
      if (response.items) {
        allContentTypes = allContentTypes.concat(response.items);
        areMoreContentTypes = response.items.length === limit;
      } else {
        areMoreContentTypes = false;
      }
      skip += limit;
    }

    const contentTypesWithoutLivePreview = allContentTypes.filter((contentType) => {
      const isExcluded = excludedContentTypesIds.includes(contentType.sys.id);
      const hasSlugField = contentType.fields?.some((field: any) => field.id === 'slug');

      return !isExcluded && !hasSlugField;
    });

    return contentTypesWithoutLivePreview;
  } catch (error) {
    console.error('Error fetching content types without live preview:', error);
    return [];
  }
};
