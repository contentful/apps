import { FunctionEventKey, FunctionEventMap, FunctionEventContext } from '@contentful/functions-types'

export type FunctionEventHandler<K extends FunctionEventKey = FunctionEventKey, P extends Record<string, any> = Record<string, any>> = (event: FunctionEventMap[K]['request'], context: FunctionEventContext<P>) => Promise<FunctionEventMap[K]['response']> | FunctionEventMap[K]['response'];

type InstallationParameters = {
  apiEndpoint: string;
  url: string;
};

type EventHandler = FunctionEventHandler<FunctionEventKey, InstallationParameters>;
type QueryHandler = FunctionEventHandler<'graphql.query', InstallationParameters>;
type MappingHandler = FunctionEventHandler<'graphql.resourcetype.mapping', InstallationParameters>;
type ResourcesSearchHandler = FunctionEventHandler<'resources.search'>;
type ResourcesLookupHandler = FunctionEventHandler<'resources.lookup'>;

const resourceTypeMappingHandler: MappingHandler = (event) => {
  const mappings = event.resourceTypes.map(({ resourceTypeId }) => ({
    resourceTypeId,
    graphQLOutputType: 'Product',
    graphQLQueryField: 'product',
    graphQLQueryArguments: { id: '' },
  }))

  return {
    resourceTypes: mappings
  }
}

const queryHandler: QueryHandler = async (event, context) => {
  // Installation parameters are defined in the app definition
  // and set per installation.
  const { apiEndpoint } = context.appInstallationParameters;

  let mockShopUrl = apiEndpoint;
  if (!mockShopUrl) {
    mockShopUrl = 'https://mock.shop/api';
    console.warn(`No API url configured, falling back to '${mockShopUrl}'`);
  }

  // Make a request to the third party API.
  // The expected return type aligns with the
  // one outlined in the GraphQL specs:
  // https://spec.graphql.org/October2021/#sec-Response
  const response = await fetch(mockShopUrl, {
    body: JSON.stringify({
      query: event.query,
      operationName: event.operationName,
      variables: event.variables,
    }),
    method: 'POST',
    headers: { Accept: 'application/json', 'content-type': 'application/json' },
  });

  return response.json();
};

const searchHandler: ResourcesSearchHandler = async (event, context) => {
  const { query, resourceType } = event
  if (resourceType !== 'MockShop:Product') {
    throw new Error(`Resource type ${resourceType} not supported`);
  }

  const response = await fetch('https://mock.shop/api', {
    body: JSON.stringify({
      query: /* GraphQL */`
        query searchProducts($query: String!) {
          search(query: $query, first: 3, types: PRODUCT) {
            edges {
              node {
                ... on Product {
                  id
                  title
                  featuredImage {
                    url
                    altText
                  }
                }
              }
            }
          }
        }
      `,
      variables: { query },
    }),
    method: 'POST',
    headers: { Accept: 'application/json', 'content-type': 'application/json' },
  });
  const result = await response.json()
  // @ts-ignore
  const items = result.data.search.edges.map(({ node }) => ({
    ...node,
    urn: node.id,
    badge: { variant: 'primary', label: 'it works' },
  }));

  return {
    items,
    pages: {},
  }
}

const loookupHandler: ResourcesLookupHandler = async (event, context) => {
  const { urns } = event.lookupBy

  const response = await fetch('https://mock.shop/api', {
    body: JSON.stringify({
      query: /* GraphQL */`
        query searchProducts($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product {
              id
              title
              featuredImage {
                url
                altText
              }
            }
          }
        }
      `,
      variables: { ids: urns },
    }),
    method: 'POST',
    headers: { Accept: 'application/json', 'content-type': 'application/json' },
  });

  const result = await response.json()
 
  const items = result.data.nodes.map((node) => ({
    ...node,
    urn: node.id,
    badge: { variant: 'primary', label: 'it works' },
  }));

  return {
    items,
    pages: {},
  }
}

export const handler: EventHandler = (event, context) => {
  if (event.type === 'resources.search') {
    return searchHandler(event, context);
  }

  if (event.type === 'resources.lookup') {
    return loookupHandler(event, context);
  }

  if (event.type === 'graphql.resourcetype.mapping') {
    return resourceTypeMappingHandler(event, context);
  }

  if (event.type === 'graphql.query') {
    return queryHandler(event, context);
  }

  throw new Error('Unknown Event');
};
