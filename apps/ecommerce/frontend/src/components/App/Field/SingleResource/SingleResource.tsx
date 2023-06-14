import { useEffect, useState } from 'react';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { FieldAppSDK } from '@contentful/app-sdk';
import { ResourceField } from 'components/App/Field/ResourceField';
import ResourceFieldProvider from 'providers/ResourceFieldProvider';
import { config } from 'config';
import fetchWithSignedRequest from 'helpers/signedRequests';

const SingleResource = () => {
  const [logoUrl, setLogoUrl] = useState<string>('');

  const sdk = useSDK<FieldAppSDK>();
  const cma = useCMA();

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(`${config.proxyUrl}/api/config.json`);

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

  const handleRemove = () => {
    sdk.field.setValue(undefined);
  };

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
      sdk.field.setValue({
        sys: {
          urn: resources[0].id,
          type: 'ResourceLink',
          linkType: sdk.parameters.instance.linkType,
        },
      });
    }

    return Array.isArray(resources) ? resources : [];
  };

  return (
    <ResourceFieldProvider
      isMultiple={false}
      handleAddResource={handleAddResource}
      handleRemove={handleRemove}
      logoUrl={logoUrl}>
      <ResourceField />
    </ResourceFieldProvider>
  );
};

export default SingleResource;
