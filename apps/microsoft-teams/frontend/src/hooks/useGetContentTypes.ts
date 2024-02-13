import { useEffect, useCallback, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';

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
      // TODO: Implement pagination for content types
      const contentTypesResponse = await sdk.cma.contentType.getMany({});
      setAllContentTypes(contentTypesResponse.items || []);
    } catch (error) {
      const err = new Error('Unable to get content types');
      setError(err);
      console.error(error);
    }

    setLoading(false);
  }, [sdk.cma.contentType]);

  useEffect(() => {
    getAllContentTypes();
  }, [sdk, getAllContentTypes]);

  return { contentTypes: allContentTypes, loading, error };
};

export default useGetContentTypes;
