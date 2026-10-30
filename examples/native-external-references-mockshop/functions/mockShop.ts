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
  const hasQuery = Boolean(query?.trim());
  const mockShopUrl = getMockShopUrl(context);

  const response = await fetch(mockShopUrl, {
    body: JSON.stringify({
      query: hasQuery
        ? /* GraphQL */ `
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
          `
        : /* GraphQL */ `
            query browseProducts {
              products(first: 3) {
                edges {
                  node {
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
          `,
      variables: hasQuery ? { query } : {},
    }),
    method: 'POST',
    headers: { Accept: 'application/json', 'content-type': 'application/json' },
  });
  const result = (await response.json()) as SearchResultData;

  const products = 'search' in result.data ? result.data.search : result.data.products;
  const items = products.edges.map((edge) => ({
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

  if (urns.length === 0) {
    return { items: [], pages: {} };
  }

  const mockShopUrl = getMockShopUrl(context);

  const isContentDeliveryApi = ['cda', 'cpa'].includes(
    context.originalRequest?.headers['contentful-api']
  );

  const productFields = isContentDeliveryApi
    ? /* GraphQL */ `
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
      `
    : /* GraphQL */ `
        id
        title
        featuredImage {
          url
          altText
        }
      `;

  // Mock Shop resolves product(id:) but currently returns no nodes for product IDs.
  // Aliases keep all lookups in one request, with URNs passed safely as variables.
  const query = /* GraphQL */ `
    query lookupProducts(${urns.map((_, index) => `$id${index}: ID!`).join(', ')}) {
      ${urns
        .map((_, index) => `product${index}: product(id: $id${index}) { ${productFields} }`)
        .join('\n')}
    }
  `;

  const response = await fetch(mockShopUrl, {
    body: JSON.stringify({
      query,
      variables: Object.fromEntries(urns.map((urn, index) => [`id${index}`, urn])),
    }),
    method: 'POST',
    headers: { Accept: 'application/json', 'content-type': 'application/json' },
  });

  const result = (await response.json()) as ProductLookupData;

  const items = urns
    .map((_, index) => {
      const node = result.data[`product${index}`];
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
  if (event.type === 'resources.search') {
    return searchHandler(event, context);
  }

  if (event.type === 'resources.lookup') {
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
