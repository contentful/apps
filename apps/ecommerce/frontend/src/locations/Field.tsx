import { useEffect, useState } from 'react';
import { EntityStatus, EntryCard } from '@contentful/f36-components';
import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';

interface ResourceLink {
  type: 'ResourceLink';
  linkType: 'Ecommerce::Product';
  urn: string;
  provider: 'Shopify';
}
interface EcommerceProductData {
  sys: ResourceLink;
  name: string;
  description: string;
  image?: string;
  status?: EntityStatus;
  extras?: {};
}

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [value, setValue] = useState<ResourceLink>(sdk.field.getValue());
  const [hydratedValue, setHydratedValue] = useState<EcommerceProductData>({
    sys: {
      type: 'ResourceLink',
      linkType: 'Ecommerce::Product',
      urn: '',
      provider: 'Shopify',
    },
    name: '',
    description: '',
  });

  useEffect(() => {
    // TODO: replace this with dynamic data resolver
    setHydratedValue({
      sys: value,
      name: 'Metallica T Shirt',
      description: 'An awesome men‘s T-shirt with metallica on it',
      image: 'https://placekitten.com/100/100',
      status: 'new',
      extras: {
        sku: 'abc123',
      },
    });
  }, [value]);

  useEffect(() => {
    sdk.field.onValueChanged((value) => {
      setValue(value);
    });
  }, [sdk.field]);

  return (
    <>
      <EntryCard
        title={hydratedValue.name}
        contentType={`${value.linkType} (Source: ${value.provider})`}
        status={hydratedValue.status}
        thumbnailElement={<img src={hydratedValue.image} alt={hydratedValue.name} />}>
        {hydratedValue.description}
      </EntryCard>
      <pre>
        <code>{JSON.stringify(value, null, 2)}</code>
      </pre>
    </>
  );
};

export default Field;
