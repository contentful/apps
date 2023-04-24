import { useEffect, useState } from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import ResourceCard from './ResourceCard';
import { EcommerceProductData, ResourceLink } from '../types';

const SingleResource = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [value, setValue] = useState<ResourceLink>(sdk.field.getValue());
  const [data, setData] = useState<EcommerceProductData>({});

  useEffect(() => {
    // TODO: replace this with dynamic data resolver
    if (value) {
      setData({
        sys: value,
        name: 'Metallica T Shirt',
        description: 'An awesome men‘s T-shirt with metallica on it',
        image: 'https://placekitten.com/100/100',
        status: 'new',
        extras: {
          sku: 'abc123',
        },
      });
    }
  }, [value]);

  useEffect(() => {
    sdk.field.onValueChanged((value) => {
      setValue(value);
    });
  }, [sdk.field, setValue]);

  return (
    <>
      <ResourceCard value={value} data={data} />
      <pre>
        <code>{JSON.stringify(value, null, 2)}</code>
      </pre>
    </>
  );
};

export default SingleResource;
