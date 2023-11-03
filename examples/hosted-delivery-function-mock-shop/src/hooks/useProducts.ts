import { useQuery } from "@tanstack/react-query";
import request from "graphql-request";
import { useSDK } from "@contentful/react-apps-toolkit";
import { ConfigAppSDK } from "@contentful/app-sdk";

import type { ProductCollection, Products } from "../typings";
import * as queries from "./queries";

export type HookResult = {
  products?: Products;
  isLoading: boolean;
};

export function useProducts(): HookResult {
  const sdk = useSDK<ConfigAppSDK>();
  const {apiEndpoint} = sdk.parameters.installation
  const { isLoading, data: products } = useQuery<Products>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await request<ProductCollection>(apiEndpoint, queries.productsQuery);
      return res.products.edges.map((edge) => edge.node);  
    },
    retry: false,
  });

  return { products, isLoading };
}
