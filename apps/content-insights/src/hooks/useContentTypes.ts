import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useQuery } from '@tanstack/react-query';
import { ContentTypeProps } from 'contentful-management';
import { fetchContentTypes, FetchContentTypesResult } from '../utils/fetchContentTypes';

export interface UseContentTypesResult {
  contentTypes: Map<string, ContentTypeProps>;
  isFetchingContentTypes: boolean;
  fetchingContentTypesError: Error | null;
  fetchedAt: Date | undefined;
  refetchContentTypes: () => void;
}

export function useContentTypes(contentTypeIds?: string[]): UseContentTypesResult {
  const sdk = useSDK<PageAppSDK>();

  const { data, isFetching, error, refetch } = useQuery<FetchContentTypesResult, Error>({
    queryKey: ['contentTypes', sdk.ids.space, sdk.ids.environment, contentTypeIds],
    queryFn: () => fetchContentTypes(sdk, contentTypeIds),
  });

  return {
    contentTypes: data?.contentTypes || new Map(),
    isFetchingContentTypes: isFetching,
    fetchingContentTypesError: error,
    fetchedAt: data?.fetchedAt,
    refetchContentTypes: () => {
      refetch();
    },
  };
}
