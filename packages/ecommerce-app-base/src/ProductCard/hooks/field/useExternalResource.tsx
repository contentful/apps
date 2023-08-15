import { useCallback, useEffect, useState } from 'react';
import type { ExternalResourceLink } from '../../types';
import type { FieldAppSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import fetchWithSignedRequest from './../../helpers/signedRequests';
import { getResourceProviderAndType } from '../../helpers/resourceProviderUtils';
import { contentfulContextHeaders } from '../../helpers/contentfulContext';

const useExternalResource = (resource?: ExternalResourceLink) => {
  const sdk = useSDK<FieldAppSDK>();
  const cma = useCMA();

  // TODO: Fix this externalResource type in the config mapping refactor
  const [externalResource, setExternalResource] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [error, setError] = useState<string>();
  const [errorStatus, setErrorStatus] = useState<number>();
  const [errorMessage, setErrorMessage] = useState<string>();

  const hydrateExternalResource = useCallback(
    async (resource: ExternalResourceLink) => {
      const encodedLinkType = encodeURIComponent(resource.sys.linkType);
      const encodedUrn = encodeURIComponent(resource.sys.urn);
      // TODO: Fix the app id in the url
      const url = new URL(
        'some url to be configured'
        //`${config.proxyUrl}/api/integrations/123/resourcesTypes/${encodedLinkType}/resources/${encodedUrn}`
      );

      const data = await fetchWithSignedRequest(url, sdk.ids.app!, cma, sdk, 'GET', {
        ...contentfulContextHeaders(sdk),
      });

      return data;
    },
    [sdk, cma]
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
