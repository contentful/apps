import { BaseAppSDK, CMAClient } from '@contentful/app-sdk';
import { useCallback, useMemo } from 'react';
import { Product, SAPParameters, Response } from '../interfaces';
import { isHAAEnabled } from '../helpers/isHAAEnabled';
import { fetchBaseSitesHAA, fetchBaseSites } from '../api/fetchBaseSites';
import { fetchProductPreviews, fetchProductPreviewsHAA } from '../api/fetchProductPreviews';
import {
  fetchProductList,
  fetchProductListHAA,
  FetchProductListParams,
} from '../api/fetchProductList';

interface SAPAPI {
  fetchBaseSites: () => Promise<string[]>;
  fetchProductPreviews: (skus: string[]) => Promise<Product[]>;
  fetchProductList: (params: Omit<FetchProductListParams, 'parameters'>) => Promise<Response>;
}

/**
 * This hook is used to get the API wrapper.
 *
 * @returns SAPAPI
 */
const useAPI = (sapParameters: SAPParameters, ids: BaseAppSDK['ids'], cma: CMAClient): SAPAPI => {
  const isAppHAAApp = useMemo(() => {
    return isHAAEnabled(ids);
  }, [ids]);

  const fetchBaseSitesWrapper = useCallback(async () => {
    if (isAppHAAApp) {
      return fetchBaseSitesHAA(ids, cma);
    }
    return fetchBaseSites(sapParameters);
  }, [cma, ids, isAppHAAApp, sapParameters]);

  const fetchProductPreviewsWrapper = useCallback(
    async (skus: string[]) => {
      if (isAppHAAApp) {
        return fetchProductPreviewsHAA(skus, ids, cma);
      }
      return fetchProductPreviews(skus, sapParameters);
    },
    [cma, ids, isAppHAAApp, sapParameters]
  );

  const fetchProductListWrapper = useCallback(
    async (fetchParams: Omit<FetchProductListParams, 'parameters'>) => {
      if (isAppHAAApp) {
        return fetchProductListHAA({ ...fetchParams, ids, cma });
      }
      return fetchProductList({ ...fetchParams, parameters: sapParameters });
    },
    [cma, ids, isAppHAAApp, sapParameters]
  );

  return useMemo(
    () => ({
      fetchBaseSites: fetchBaseSitesWrapper,
      fetchProductPreviews: fetchProductPreviewsWrapper,
      fetchProductList: fetchProductListWrapper,
    }),
    [fetchBaseSitesWrapper, fetchProductPreviewsWrapper, fetchProductListWrapper]
  );
};

export default useAPI;
