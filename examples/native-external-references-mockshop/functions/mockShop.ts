import {
  EventHandler,
  MappingHandler,
  ProductLookupData,
  QueryHandler,
  ResourcesLookupHandler,
  ResourcesSearchHandler,
  SearchResultData,
} from './types';
import { getMockShopUrl, withBadge, withUrn } from './utils';

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
  /* Installation parameters are defined in the app definition
   * and set per installation */

  const mockShopUrl = getMockShopUrl(context);

  /* Make a request to the third party API.
   * The expected return type aligns with the
   * one outlined in the GraphQL specs:
   * https://spec.graphql.org/October2021/#sec-Response
   */
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
  const { query } = event;
  const mockShopUrl = getMockShopUrl(context);

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

  const items = result.data.search.edges.map((edge) => ({
    ...withBadge(edge.node),
    ...withUrn(edge.node),
  }));
  return {
    items,
    pages: {},
  };
};

const lookupHandler: ResourcesLookupHandler = async (event, context) => {
  const { urns } = event.lookupBy;

  const mockShopUrl = getMockShopUrl(context);

  const isContentDeliveryApi = ['cda', 'cpa'].includes(
    // @ts-ignore - context.originalRequest is not in the types yet
    context.originalRequest?.headers['contentful-api']
  );

  const query = isContentDeliveryApi
    ? /* GraphQL */ `
        query lookupProducts($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product {
              id
              title
              description
              compareAtPriceRange {
                maxVariantPrice {
                  amount
                  currencyCode
                }
              }
              adjacentVariants {
                availableForSale
                barcode
                currentlyNotInStock
                image {
                  url
                }
              }
              featuredImage {
                id
                url
                altText
                width
                height
              }
            }
          }
        }
      `
    : /* GraphQL */ `
        query lookupProducts($ids: [ID!]!) {
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
      `;

  const response = await fetch(mockShopUrl, {
    body: JSON.stringify({
      query,
      variables: { ids: urns },
    }),
    method: 'POST',
    headers: { Accept: 'application/json', 'content-type': 'application/json' },
  });

  const result = (await response.json()) as ProductLookupData;

  const items = result.data.nodes
    .map((node) => {
      if (node === null) {
        console.error('Null node encountered');
        return null;
      }
      return {
        ...withBadge(node),
        ...withUrn(node),
      };
    })
    .filter((item) => !!item);

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
  if (event.type === 'resources.search' && 'cma' in context) {
    return searchHandler(event, context);
  }

  if (event.type === 'resources.lookup' && 'cma' in context) {
    return lookupHandler(event, context);
  }

  if (event.type === 'graphql.resourcetype.mapping') {
    return resourceTypeMappingHandler(event, context);
  }

  if (event.type === 'graphql.query') {
    return queryHandler(event, context);
  }

  throw new Error('Bad Request: Unknown Event');
};
