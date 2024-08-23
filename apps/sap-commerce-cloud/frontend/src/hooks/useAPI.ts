import { BaseAppSDK, CMAClient } from '@contentful/app-sdk';
import { useCallback, useMemo } from 'react';
import { SAPParameters } from '../interfaces';
import { isHAAEnabled } from '../helpers/isHAAEnabled';
import { fetchBaseSitesHAA, fetchBaseSites } from '../api/fetchBaseSites';

interface SAPAPI {
  fetchBaseSites: () => Promise<string[]>;
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
  return {
    fetchBaseSites: fetchuseBaseSitesWrapper,
  };
};

export default useAPI;
