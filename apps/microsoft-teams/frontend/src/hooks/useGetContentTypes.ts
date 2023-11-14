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
  const sdk = useSDK<ConfigAppSDK>();

  const getAllContentTypes = useCallback(async () => {
    try {
      // TODO: Implement pagination for content types
      const contentTypesResponse = await sdk.cma.contentType.getMany({});
      setAllContentTypes(contentTypesResponse.items || []);
    } catch (error) {
      console.error(error);
      throw new Error('Unable to get content types');
    }
  }, [sdk.cma.contentType]);

  useEffect(() => {
    getAllContentTypes();
  }, [sdk, getAllContentTypes]);

  return allContentTypes;
};

export default useGetContentTypes;
