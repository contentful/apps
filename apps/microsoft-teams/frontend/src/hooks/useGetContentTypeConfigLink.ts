import { useEffect, useCallback, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK } from '@contentful/app-sdk';

/**
 * This hook is used to get the link to the page in the Contentful web app where a user can configure content types
 * This takes into account EU data residency by using the correct hostname
 *
 * @returns contentTypeConfigLink
 */
const useGetContentTypeConfigLink = () => {
  const [contentTypeConfigLink, setContentTypeConfigLink] = useState<string>('');
  const sdk = useSDK<ConfigAppSDK>();

  const getLink = useCallback(() => {
    const space = sdk.ids.space;
    const environment = sdk.ids.environment;

    const link =
      environment === 'master'
        ? `https://${sdk.hostnames.webapp}/spaces/${space}/content_types`
        : `https://${sdk.hostnames.webapp}/spaces/${space}/environments/${environment}/content_types`;

    setContentTypeConfigLink(link);
  }, [sdk.ids]);

  useEffect(() => {
    getLink();
  }, [sdk, getLink]);

  return contentTypeConfigLink;
};

export default useGetContentTypeConfigLink;
