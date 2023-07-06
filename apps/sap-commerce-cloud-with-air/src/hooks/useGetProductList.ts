import { useState, useEffect } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { DialogAppSDK } from '@contentful/app-sdk';
import { productTransformer } from '../api/dataTransformers';
import { apiKey } from '../config';
import { Product } from '../interfaces';

export function useGetProductList(query: string, page: number) {
  const [loading, setLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const sdk = useSDK<DialogAppSDK>();

  const { apiEndpoint, baseSites } = sdk.parameters.installation;

  useEffect(() => {
    async function fetchProductList() {
      setLoading(true);

      try {
        const req = await sdk.cma.appActionCall.createWithResponse(
          {
            appActionId: 'fetchProductList',
            environmentId: sdk.ids.environment,
            spaceId: sdk.ids.space,
            appDefinitionId: sdk.ids.app!,
          },
          {
            parameters: {
              sapApiEndpoint: `${apiEndpoint}/occ/v2/${baseSites}/products/search?query=${query}&fields=FULL&currentPage=${page}`,
              apiKey,
            },
          }
        );

        const res = JSON.parse(req.response.body);

        if (res.body) {
          const transformedProducts = res.body.products.map(
            productTransformer(sdk.parameters.installation)
          );
          setProducts(transformedProducts);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching product list:', error);
      }
    }

    fetchProductList();
  }, [sdk, apiEndpoint, baseSites, page, query]);

  return { products, loading };
}
