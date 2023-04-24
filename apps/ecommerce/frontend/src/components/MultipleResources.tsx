import { useEffect, useState } from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { EcommerceProductData, ResourceLink } from '../types';
import ResourceCard from './ResourceCard';

const MultipleResources = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [value, setValue] = useState<ResourceLink[]>(sdk.field.getValue());
  const [data, setData] = useState<EcommerceProductData[]>({});

  useEffect(() => {
    sdk.field.onValueChanged((value) => {
      setValue(value);
    });
  }, [sdk.field, setValue]);

  useEffect(() => {
    // TODO: replace this with dynamic data resolver
    if (value) {
      setData(
        Object.values(value).map((resource) => ({
          sys: resource,
          name: 'Metallica T Shirt',
          description: 'An awesome men‘s T-shirt with metallica on it',
          image: 'https://placekitten.com/100/100',
          status: 'new',
          extras: {
            sku: 'abc123',
          },
        }))
      );
    }
  }, [value]);

  return (
    <>
      {data.map((resource: EcommerceProductData) => (
        <ResourceCard value={resource.sys} data={resource} />
      ))}
    </>
  );
};

export default MultipleResources;
