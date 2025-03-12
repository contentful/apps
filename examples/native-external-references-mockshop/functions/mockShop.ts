import { FunctionEventContext } from '@contentful/functions-types';
import {
  EventHandler,
  MappingHandler,
  ProductEdge,
  ProductLookupData,
  QueryHandler,
  ResourcesLookupHandler,
  ResourcesSearchHandler,
  SearchResultData,
} from './types';

const getMockShopUrl = (context: FunctionEventContext<Record<string, any>>) => {
  const { apiEndpoint } = context.appInstallationParameters;
  let mockShopUrl = apiEndpoint;
  if (!mockShopUrl) {
    mockShopUrl = 'https://mock.shop/api';
    console.warn(`No API url configured, falling back to '${mockShopUrl}'`);
  }
  return mockShopUrl;
};

function withUrn(node: ProductEdge['node']) {
  return {
    ...node,
    urn: node.id,
  };
}

function withBadge(node: ProductEdge['node']) {
  return {
    ...node,
    badge: { variant: 'primary', label: 'it works' },
  };
}

const resourceTypeMappingHandler: MappingHandler = (event) => {
  const mappings = event.resourceTypes.map(({ resourceTypeId }) => ({
    resourceTypeId,
    graphQLOutputType: 'Product',
    graphQLQueryField: 'product',
    graphQLQueryArguments: { id: '/urn' },
  }));

  return {
    resourceTypes: mappings,
  };
};

const queryHandler: QueryHandler = async (event, context) => {
  // Installation parameters are defined in the app definition
  // and set per installation.

  const mockShopUrl = getMockShopUrl(context);

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
  const { query, resourceType } = event;
  const mockShopUrl = getMockShopUrl(context);

  if (resourceType !== 'MockShop:Product') {
    throw new Error(`Resource type ${resourceType} not supported`);
  }

  const response = await fetch(mockShopUrl, {
    body: JSON.stringify({
      query: /* GraphQL */ `
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
  const result = (await response.json()) as SearchResultData;

  const items = result.data.search.edges.map((node) => ({
    ...withBadge(node),
    ...withUrn(node),
  }));
  return {
    items,
    pages: {},
  };
};

const loookupHandler: ResourcesLookupHandler = async (event, context) => {
  const { urns } = event.lookupBy;

  const mockShopUrl = getMockShopUrl(context);

  const response = await fetch(mockShopUrl, {
    body: JSON.stringify({
      query: /* GraphQL */ `
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

  const result = (await response.json()) as ProductLookupData;

  const items = result.data.nodes.map((node) => ({
    ...withBadge(node),
    ...withUrn(node),
  }));

  return {
    items,
    pages: {},
  };
};

/*
 * The handler function is the entry point for the function which calls
 * the appropriate handler based on the event type
 */

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

  throw new Error('Bad Request: Unknown Event');
};
