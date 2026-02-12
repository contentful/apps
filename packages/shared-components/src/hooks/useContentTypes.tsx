import { KnownAppSDK } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';
import { useEffect, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';

export function useContentTypes(contentTypeIds?: string[]): {
  contentTypes: ContentTypeProps[];
  isLoading: boolean;
} {
  const sdk = useSDK<KnownAppSDK>();
  const allContentTypes: ContentTypeProps[] = [];
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchContentTypes = async () => {
      setIsLoading(true);
      if (contentTypeIds && contentTypeIds.length > 0) {
        const fetchPromises = contentTypeIds.map((id) =>
          sdk.cma.contentType
            .get({
              contentTypeId: id,
              query: {
                fields: ['name', 'displayField'],
              },
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

      setContentTypes(allContentTypes);
      setIsLoading(false);
    };

    fetchContentTypes();
  }, [contentTypeIds]);

  return { contentTypes, isLoading };
}
