import { FunctionEventHandler, FunctionTypeEnum } from '@contentful/node-apps-toolkit';

export type InstallationParameters = Record<string, any>;

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

export type SearchResultData = {
  data: {
    search: {
      edges: {
        node: Product;
      }[];
    };
  };
};

export type ProductLookupData = {
  data: {
    nodes: (Product | null)[];
  };
};
