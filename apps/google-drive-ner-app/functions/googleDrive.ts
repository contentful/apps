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

import { createSchema, createYoga } from 'graphql-yoga';
import { GraphQLError } from 'graphql';

/*
 * We re-create a basic subset of the actual payloads in order to showcase how to wrap a REST API.
 * this schema will be use to handle upcoming graphql queries
 *
 * Source: https://developers.google.com/workspace/drive/api/reference/rest/v3/files
 */
const typeDefs = `
type File {
  id: String!
  name: String!
  iconLink: String!
}

type Query {
  file(search: String, ids: [ID!]): [File!]!
}`;

const schema = createSchema({
  typeDefs,
  resolvers: {
    Query: {
      file: async (_parent, { search, ids }, _context) => {
        if (!search && !ids) {
          throw new GraphQLError('Either search or ids must be provided');
        }

        const url = search
          ? `https://www.googleapis.com/drive/v3/files?q=${search}`
          : `https://www.googleapis.com/drive/v3/files/${ids}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new GraphQLError(
            `Google Drive API returned a non-200 status code: ${response.status}`
          );
        }

        const file = await response.json();

        console.log('GOOGLE DRIVE SEARCHFILES:', file);
        const { files } = file.data;

        /**
         * The PotterDB API returns all the character information, so we grab the subset of it
         * that matches with the defined graphql schema.
         *
         */
        return files.map((file) => ({
          id: file.id,
          title: file.name,
          iconLink: file.iconLink,
        }));
      },
    },
  },
});

const yoga = createYoga({ schema, graphiql: false });

const resourceTypeMappingHandler: MappingHandler = (event) => {
  const mappings = event.resourceTypes.map(({ resourceTypeId }) => ({
    resourceTypeId,
    graphQLOutputType: 'File',
    graphQLQueryField: 'file',
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
  const response = await yoga.fetch(
    mockShopUrl,
    {
      body: JSON.stringify({
        query: event.query,
        operationName: event.operationName,
        variables: event.variables,
      }),
      method: 'POST',
      headers: { Accept: 'application/json', 'content-type': 'application/json' },
    },
    context
  );

  return response.json();
};

const searchHandler: ResourcesSearchHandler = async (event, context) => {
  const { query } = event;
  const mockShopUrl = getMockShopUrl(context);
  const response = await fetch(mockShopUrl, {
    body: JSON.stringify({
      query: /* GraphQL */ `
        query searchFiles($query: String!) {
          file(search: $query) {
            id
            name
            iconLink
          }
        }
      `,
      variables: { query },
    }),
    method: 'POST',
    headers: { Accept: 'application/json', 'content-type': 'application/json' },
  });
  const result = (await response.json()) as any;

  const items = result.files.map((file) => ({
    ...withBadge(file),
    ...withUrn(file),
  }));
  return {
    items,
    pages: {},
  };
};

const lookupHandler: ResourcesLookupHandler = async (event, context) => {
  const { urns } = event.lookupBy;

  const mockShopUrl = getMockShopUrl(context);

  const response = await fetch(mockShopUrl, {
    body: JSON.stringify({
      query: /* GraphQL */ `
        query lookupFiles($ids: [ID!]!) {
          file(ids: $ids) {
            id
            name
            iconLink
          }
        }
      `,
      variables: { ids: urns },
    }),
    method: 'POST',
    headers: { Accept: 'application/json', 'content-type': 'application/json' },
  });

  const result = (await response.json()) as any;

  const items = result.data.files
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
