import { useEffect, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  detectSpaceDisposition,
  type SpaceDisposition,
  type ProbeCma,
} from '../utils/spaceType';

/**
 * Detects the current space's disposition (exo / classic / empty) via the App
 * SDK CMA client, so the config screen can conditionally render ExO permission
 * rows. Starts loading with an 'unknown' disposition and resolves after the
 * probe. Never throws — probe errors resolve to 'unknown' (fail closed).
 */
export const useSpaceType = (): { disposition: SpaceDisposition; isLoading: boolean } => {
  const sdk = useSDK<ConfigAppSDK>();
  const cma = sdk.cma;
  const [disposition, setDisposition] = useState<SpaceDisposition>('unknown');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await detectSpaceDisposition(cma as unknown as ProbeCma);
      if (!cancelled) {
        setDisposition(result);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cma]);

  return { disposition, isLoading };
};
