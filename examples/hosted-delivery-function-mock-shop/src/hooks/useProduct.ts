import { useQuery } from '@tanstack/react-query';
import request from 'graphql-request';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

import type { Product } from '../typings';
import { productQuery } from './queries';

type HookResult = {
  product?: Product;
  isLoading: boolean;
};

export function useProduct(productId: string = ''): HookResult {
  const sdk = useSDK<ConfigAppSDK>();
  const { apiEndpoint } = sdk.parameters.installation;
  const { isLoading, data: product } = useQuery<Product>({
    queryKey: ['product', productId],
    queryFn: () =>
      request<{ product: Product }>(apiEndpoint, productQuery, {
        productId,
      }).then((res) => res.product),
    enabled: !!productId,
  });

  return { product, isLoading };
}
