import { useEffect, useState } from 'react';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useCMA, useSDK, useAutoResizer } from '@contentful/react-apps-toolkit';
import fetchWithSignedRequest from 'helpers/signedRequests';
import { contentfulContextHeaders } from 'helpers/contentfulContext';
import { config } from 'config';
import DialogHeader from './DialogHeader';
import DialogBody from './DialogBody';
import { ExternalResource } from 'types';
import { getResourceProviderAndType } from 'helpers/resourceProviderUtils';
import { DialogInvocationParameters } from 'types';

const ResourceSelectionDialog = () => {
  const [externalResources, setExternalResources] = useState<ExternalResource[]>([]);

  const sdk = useSDK<DialogAppSDK>();
  const cma = useCMA();
  useAutoResizer();

  const { fieldType, linkType } = sdk.parameters.invocation as DialogInvocationParameters;
  const { resourceProvider, resourceType } = getResourceProviderAndType(linkType);

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(`${config.backendApiUrl}/api/resources`);

        const res = await fetchWithSignedRequest(url, sdk.ids.app!, cma, sdk, 'POST', {
          ...contentfulContextHeaders(sdk),
        });

        if (!res.ok) {
          throw new Error(res.statusText);
        }

        const data = await res.json();

        setExternalResources(data);
      } catch (error: any) {
        console.error(error.message);
      }
    })();
  }, [sdk, cma]);

  return (
    <>
      <DialogHeader
        fieldType={fieldType}
        resourceType={resourceType}
        total={externalResources.length}
      />
      <DialogBody
        externalResources={externalResources}
        resourceProvider={resourceProvider}
        resourceType={resourceType}
      />
    </>
  );
};

export default ResourceSelectionDialog;
