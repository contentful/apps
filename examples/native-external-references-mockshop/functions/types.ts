import {
  FunctionEventKey,
  FunctionEventMap,
  FunctionEventContext,
} from '@contentful/functions-types';

export type FunctionEventHandler<
  FunctionEvent extends FunctionEventKey = FunctionEventKey,
  ContextParameters extends Record<string, any> = Record<string, any>
> = (
  event: FunctionEventMap[FunctionEvent]['request'],
  context: FunctionEventContext<ContextParameters>
) =>
  | Promise<FunctionEventMap[FunctionEvent]['response']>
  | FunctionEventMap[FunctionEvent]['response'];

type InstallationParameters = {
  apiEndpoint: string;
  url: string;
};

export type EventHandler = FunctionEventHandler<FunctionEventKey, InstallationParameters>;
export type QueryHandler = FunctionEventHandler<'graphql.query', InstallationParameters>;
export type MappingHandler = FunctionEventHandler<
  'graphql.resourcetype.mapping',
  InstallationParameters
>;
export type ResourcesSearchHandler = FunctionEventHandler<'resources.search'>;
export type ResourcesLookupHandler = FunctionEventHandler<'resources.lookup'>;

export type ProductEdge = {
  node: {
    id: string;
    title: string;
    featuredImage?: {
      url: string;
      altText?: string;
    };
  };
};

export type SearchResultData = {
  data: {
    search: {
      edges: ProductEdge['node'][];
    };
  };
};

export type ProductLookupData = {
  data: {
    nodes: ProductEdge['node'][];
  };
};
