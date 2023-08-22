import { useEffect, useCallback, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';

/**
 * This hook is used to get the content types for the space
 * It will get the content types from Contentful and return them
 *
 * @returns contentTypes
 */
const useGetContentTypes = () => {
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const sdk = useSDK<ConfigAppSDK>();

  const getAllContentTypes = useCallback(async () => {
    try {
      const contentTypesResponse = await sdk.cma.contentType.getMany({});
      setContentTypes(contentTypesResponse.items || []);
    } catch (error) {
      console.error(error);
    }
  }, [sdk.cma.contentType]);

  useEffect(() => {
    getAllContentTypes();
  }, [sdk, getAllContentTypes]);

  return contentTypes;
};

export default useGetContentTypes;
