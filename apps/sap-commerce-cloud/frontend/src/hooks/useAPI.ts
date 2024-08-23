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
  fetchProductList: (params: FetchProductListParams) => Promise<Response>;
}

/**
 * This hook is used to get the API wrapper.
 *
 * @returns SAPAPI
 */
const useAPI = (parameters: SAPParameters, ids: BaseAppSDK['ids'], cma: CMAClient): SAPAPI => {
  const isAppHAAApp = useMemo(() => {
    return isHAAEnabled(ids);
  }, [ids]);

  const fetchuseBaseSitesWrapper = useCallback(async () => {
    if (isAppHAAApp) {
      return fetchBaseSitesHAA(ids, cma);
    }
    return fetchBaseSites(parameters);
  }, [cma, ids, isAppHAAApp, parameters]);

  const fetchuseProductPreviewsWrapper = useCallback(
    async (skus: string[]) => {
      if (isAppHAAApp) {
        return fetchProductPreviewsHAA(skus, ids, cma);
      }
      return fetchProductPreviews(skus, parameters);
    },
    [cma, ids, isAppHAAApp, parameters]
  );
  const fetchuseProductListWrapper = useCallback(
    async (params: FetchProductListParams) => {
      if (isAppHAAApp) {
        return fetchProductListHAA({ ...params, ids, cma });
      }
      return fetchProductList(params);
    },
    [cma, ids, isAppHAAApp]
  );

  return {
    fetchBaseSites: fetchuseBaseSitesWrapper,
    fetchProductPreviews: fetchuseProductPreviewsWrapper,
    fetchProductList: fetchuseProductListWrapper,
  };
};

export default useAPI;
