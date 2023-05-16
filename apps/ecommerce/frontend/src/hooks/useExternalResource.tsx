import { useCallback, useEffect, useState } from 'react';
import type { ExternalResourceLink, ExternalResource } from 'types';
import type { FieldAppSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import fetchWithSignedRequest from 'helpers/signedRequests';
import { config } from 'config';
import { getResourceProviderAndType } from 'helpers/resourceProviderUtils';

const useExternalResource = (resource?: ExternalResourceLink) => {
  const sdk = useSDK<FieldAppSDK>();
  const cma = useCMA();

  const [externalResource, setExternalResource] = useState<ExternalResource>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [error, setError] = useState<string>();
  const [errorStatus, setErrorStatus] = useState<number>();
  const [errorMessage, setErrorMessage] = useState<string>();

  const hydrateExternalResource = useCallback(
    async (resource: ExternalResourceLink) => {
      const url = new URL(`${config.backendApiUrl}/api/resource`);
      const { resourceProvider } = getResourceProviderAndType(resource);

      const data = await fetchWithSignedRequest(
        url,
        sdk.ids.app!,
        cma,
        'POST',
        {
          'x-contentful-data-provider': resourceProvider.toLowerCase(),
          'X-Contentful-Data-Provider-BaseURL': sdk.parameters.instance.baseUrl,
        },
        resource
      );

      return data;
    },
    [cma, sdk.ids.app, sdk.parameters.instance.baseUrl]
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

        setExternalResource(data);
      } catch (error: any) {
        console.error(errorStatus, error.message);

        const { resourceProvider, resourceType } = getResourceProviderAndType(resource);
        setError(
          `Error fetching ${resourceType ? resourceType : 'external resource'}${
            resource.sys?.urn ? ` "${resource.sys.urn}"` : ''
          }${resourceProvider ? ` from ${resourceProvider}` : ''}.`
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
    externalResource,
    isLoading,
    error,
    errorStatus,
    errorMessage,
  };
};

export default useExternalResource;
