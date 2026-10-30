import { FunctionEventHandler, FunctionTypeEnum } from '@contentful/node-apps-toolkit';

export type InstallationParameters = {
  apiEndpoint: string;
  url: string;
};

export type EventHandler = FunctionEventHandler<FunctionTypeEnum, InstallationParameters>;
export type QueryHandler = FunctionEventHandler<
  FunctionTypeEnum.GraphqlQuery,
  InstallationParameters
>;
export type MappingHandler = FunctionEventHandler<
  FunctionTypeEnum.GraphqlResourceTypeMapping,
  InstallationParameters
>;
export type ResourcesSearchHandler = FunctionEventHandler<FunctionTypeEnum.ResourcesSearch>;
export type ResourcesLookupHandler = FunctionEventHandler<FunctionTypeEnum.ResourcesLookup>;

export type Product = {
  id: string;
  title: string;
  featuredImage?: {
    url: string;
    altText?: string;
  };
};

type ProductConnection = {
  edges: {
    node: Product;
  }[];
};

export type SearchResultData = {
  data: { search: ProductConnection } | { products: ProductConnection };
};

export type ProductLookupData = {
  data: Record<string, Product | null>;
};
