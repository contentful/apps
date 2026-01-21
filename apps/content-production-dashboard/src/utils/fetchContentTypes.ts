import { PageAppSDK } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';

export interface FetchContentTypesResult {
  contentTypes: Map<string, ContentTypeProps>;
  fetchedAt: Date;
}

export async function fetchContentTypes(
  sdk: PageAppSDK,
  contentTypeIds?: string[]
): Promise<FetchContentTypesResult> {
  const allContentTypes: ContentTypeProps[] = [];

  if (contentTypeIds && contentTypeIds.length > 0) {
    const fetchPromises = contentTypeIds.map((id) =>
      sdk.cma.contentType
        .get({
          contentTypeId: id,
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
        })
        .catch((error) => {
          console.error(`Error fetching content type ${id}:`, error);
          return null;
        })
    );

    const results = await Promise.all(fetchPromises);
    allContentTypes.push(...results.filter((ct): ct is ContentTypeProps => ct !== null));
  } else {
    // Otherwise, fetch all content types
    let skip = 0;
    const limit = 1000;
    let areMoreContentTypes = true;

    while (areMoreContentTypes) {
      const response = await sdk.cma.contentType.getMany({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        query: { skip, limit },
      });

      if (response.items) {
        allContentTypes.push(...(response.items as ContentTypeProps[]));
        areMoreContentTypes = response.items.length === limit;
      } else {
        areMoreContentTypes = false;
      }
      skip += limit;
    }
  }

  const contentTypes = new Map<string, ContentTypeProps>();
  allContentTypes.forEach((contentType) => {
    contentTypes.set(contentType.sys.id, contentType);
  });

  return {
    contentTypes,
    fetchedAt: new Date(),
  };
}
