import { useEffect, useState } from 'react';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { FieldAppSDK } from '@contentful/app-sdk';
import { ResourceField } from 'components/App/Field/ResourceField';
import ResourceFieldProvider from 'providers/ResourceFieldProvider';
import { ExternalResource } from 'types';
import { config } from 'config';
import fetchWithSignedRequest from 'helpers/signedRequests';

const MultipleResources = () => {
  const [logoUrl, setLogoUrl] = useState<string>('');

  const sdk = useSDK<FieldAppSDK>();
  const cma = useCMA();

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(`${config.backendApiUrl}/api/config.json`);

        const res = await fetchWithSignedRequest(url, sdk.ids.app!, cma, sdk, 'GET');

        if (!res.ok) {
          throw new Error(res.statusText);
        }

        const data = await res.json();

        setLogoUrl(data.logoUrl);
      } catch (error: any) {
        console.error(error.message);
      }
    })();
  }, [sdk, cma]);

  const handleAddResource = async (): Promise<any[]> => {
    const resources = await sdk.dialogs.openCurrentApp({
      allowHeightOverflow: true,
      position: 'center',
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEscapePress: true,
      parameters: sdk.parameters.instance,
      width: 1400,
    });

    if (resources?.length) {
      const resourceArray = sdk.field.getValue();
      const newResources = resources.map((resource: ExternalResource) => {
        return {
          sys: {
            urn: resource.id,
            type: 'ResourceLink',
            linkType: sdk.parameters.instance.linkType,
          },
        };
      });

      if (resourceArray) {
        sdk.field.setValue([...resourceArray, ...newResources]);
      } else {
        sdk.field.setValue([...newResources]);
      }
    }

    return Array.isArray(resources) ? resources : [];
  };

  const handleRemove = (index: number) => {
    const resourceArray = [...sdk.field.getValue()];
    resourceArray.splice(index, 1);

    const newValue = resourceArray.length > 0 ? resourceArray : undefined;
    sdk.field.setValue(newValue);
  };

  const handleMoveToTop = (index: number) => {
    const resourceArray = sdk.field.getValue();

    const newValue = [...resourceArray];
    newValue.unshift(newValue.splice(index, 1)[0]);
    sdk.field.setValue(newValue);
  };

  const handleMoveToBottom = (index: number) => {
    const resourceArray = sdk.field.getValue();

    const newValue = [...resourceArray];
    newValue.push(newValue.splice(index, 1)[0]);
    sdk.field.setValue(newValue);
  };

  return (
    <ResourceFieldProvider
      isMultiple={true}
      handleAddResource={handleAddResource}
      handleRemove={handleRemove}
      handleMoveToBottom={handleMoveToBottom}
      handleMoveToTop={handleMoveToTop}
      logoUrl={logoUrl}>
      <ResourceField />
    </ResourceFieldProvider>
  );
};

export default MultipleResources;
