import { useState, useEffect } from 'react';
import { Product } from '../interfaces';

export function useGetProductPreviews(skus: string[]): { loading: boolean; products: Product[] } {
  const [loading, setLoading] = useState<boolean>(false);
  //   const sdk = useSDK<DialogAppSDK>();
  //   const { apiEndpoint, baseSites } = sdk.parameters.installation;

  useEffect(() => {
    async function fetchProductPreviews() {
      setLoading(true);
    }

    fetchProductPreviews();
  }, [skus]);

  return { loading, products: [] };
}
