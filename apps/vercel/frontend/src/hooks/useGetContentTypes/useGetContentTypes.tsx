import { useEffect, useCallback, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';
import { CONTENT_TYPE_LIMIT } from '@constants/contentTypeLimit';

/**
 * This hook is used to get all the content types for the space
 *
 * @returns allContentTypes
 */

const useGetContentTypes = () => {
  const [allContentTypes, setAllContentTypes] = useState<ContentTypeProps[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error>();

  const sdk = useSDK<ConfigAppSDK>();

  const getAllContentTypes = useCallback(async () => {
    try {
      setLoading(true);

      const contentTypesSuperset: ContentTypeProps[] = [];
      let skip = 0;
      let needToFetchNextBatch = true;

      while (needToFetchNextBatch) {
        const contentTypesResponse = await sdk.cma.contentType.getMany({
          query: {
            limit: CONTENT_TYPE_LIMIT,
            skip,
            order: 'name',
          },
        });

        const totalNumOfContentTypes = contentTypesResponse.total;
        contentTypesSuperset.push(...contentTypesResponse.items);

        if (contentTypesSuperset.length >= totalNumOfContentTypes) {
          // we have fetched all possible content types, exit while
          needToFetchNextBatch = false;
        } else {
          // we need to fetch the next batch of content types, re-execute while
          skip += CONTENT_TYPE_LIMIT;
        }
      }

      setAllContentTypes(contentTypesSuperset);
    } catch (error) {
      const err = new Error('Unable to get content types');
      setError(err);
      console.error(error);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    getAllContentTypes();
  }, [sdk, getAllContentTypes]);

  return { contentTypes: allContentTypes, loading, error };
};

export default useGetContentTypes;
