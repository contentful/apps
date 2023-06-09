import { useEffect, useState } from 'react';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useCMA, useSDK, useAutoResizer } from '@contentful/react-apps-toolkit';
import fetchWithSignedRequest from 'helpers/signedRequests';
import { contentfulContextHeaders } from 'helpers/contentfulContext';
import { config } from 'config';
import DialogHeader from '../DialogHeader/DialogHeader';
import DialogBody from '../DialogBody/DialogBody';
import { getResourceProviderAndType } from 'helpers/resourceProviderUtils';
import { DialogInvocationParameters, ExternalResource, FieldType } from 'types';

const ResourceSelectionDialog = () => {
  const [externalResources, setExternalResources] = useState<ExternalResource[]>([]);
  const [selectedResources, setSelectedResources] = useState<ExternalResource[]>([]);

  const sdk = useSDK<DialogAppSDK>();
  const cma = useCMA();
  useAutoResizer();

  const { fieldType, linkType } = sdk.parameters.invocation as DialogInvocationParameters;
  const { resourceProvider, resourceType } = getResourceProviderAndType(linkType);

  const headerText =
    fieldType === FieldType.Single ? `Select a ${resourceType}` : `Select ${resourceType}s`;
  const resourceCountText = `${externalResources.length} ${resourceType}s${
    selectedResources.length ? `, ${selectedResources.length} selected` : ''
  }`;

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

  const handleSelectProduct = (resource: ExternalResource) => {
    const foundResource = selectedResources.find((item) => {
      return item.id === resource.id;
    });

    if (foundResource) {
      setSelectedResources(selectedResources.filter((item) => item.id !== foundResource.id));
    } else {
      if (fieldType === FieldType.Single) {
        setSelectedResources([resource]);
      } else {
        setSelectedResources([...selectedResources, resource]);
      }
    }
  };

  const handleSave = () => {
    sdk.close(selectedResources);
  };

  return (
    <>
      <DialogHeader
        onSave={handleSave}
        headerText={headerText}
        resourceCountText={resourceCountText}
      />
      <DialogBody
        externalResources={externalResources}
        resourceProvider={resourceProvider}
        resourceType={resourceType}
        onSelect={handleSelectProduct}
        selectedResources={selectedResources}
      />
    </>
  );
};

export default ResourceSelectionDialog;
