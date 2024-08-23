import { BaseAppSDK, CMAClient } from '@contentful/app-sdk';
import { useCallback, useMemo } from 'react';
import { Product, SAPParameters } from '../interfaces';
import { isHAAEnabled } from '../helpers/isHAAEnabled';
import { fetchBaseSitesHAA, fetchBaseSites } from '../api/fetchBaseSites';
import { fetchProductPreviews, fetchProductPreviewsHAA } from '../api/fetchProductPreviews';

interface SAPAPI {
  fetchBaseSites: () => Promise<string[]>;
  fetchProductPreviews: (skus: string[]) => Promise<Product[]>;
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
        return fetchProductPreviewsHAA(skus, parameters, ids, cma);
      }
      return fetchProductPreviews(skus, parameters);
    },
    [cma, ids, isAppHAAApp, parameters]
  );
  return {
    fetchBaseSites: fetchuseBaseSitesWrapper,
    fetchProductPreviews: fetchuseProductPreviewsWrapper,
  };
};

export default useAPI;
