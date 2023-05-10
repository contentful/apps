import { useCallback, useEffect, useState } from 'react';
import type { ExternalResourceLink, HydratedResourceData } from '../types';
import type { FieldAppSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import fetchWithSignedRequest from '../helpers/signedRequests';
import { config } from '../config';

const useExternalResource = (resource?: ExternalResourceLink) => {
  const sdk = useSDK<FieldAppSDK>();
  const cma = useCMA();

  const [hydratedResourceData, setHydratedResourceData] = useState<HydratedResourceData>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [error, setError] = useState<string>();
  const [errorStatus, setErrorStatus] = useState<number>();
  const [errorMessage, setErrorMessage] = useState<string>();

  const hydrateExternalResource = useCallback(
    async (resource: ExternalResourceLink) => {
      const url = new URL(`${config.backendApiUrl}/api/resource`);
      const data = await fetchWithSignedRequest(
        url,
        sdk.ids.app!,
        cma,
        'POST',
        {
          'x-contentful-data-provider': resource.sys?.provider?.toLowerCase(),
        },
        resource
      );

      return data;
    },
    [cma, sdk.ids.app]
  );

  useEffect(() => {
    if (!resource) return;

    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);

        const res = await hydrateExternalResource(resource);
        if (!isMounted) return;

        if (!res.ok) {
          setErrorStatus(res.status);
          throw new Error(res.statusText);
        }

        setError(undefined);
        setErrorStatus(undefined);

        const data = await res.json();

        setHydratedResourceData(data);
      } catch (error: any) {
        console.error(errorStatus, error.message);
        setError(
          `Error fetching external resource${resource.sys?.urn ? ` "${resource.sys.urn}"` : ''}${
            resource.sys?.provider ? ` from ${resource.sys.provider}` : ''
          }.`
        );
        setErrorMessage(error.message);
      }

      setIsLoading(false);
    })();

    return () => {
      isMounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  return {
    hydratedResourceData,
    isLoading,
    error,
    errorStatus,
    errorMessage,
  };
};

export default useExternalResource;
