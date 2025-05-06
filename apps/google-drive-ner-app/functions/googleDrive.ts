import {
  EventHandler,
  MappingHandler,
  ProductLookupData,
  QueryHandler,
  ResourcesLookupHandler,
  ResourcesSearchHandler,
  SearchResultData,
} from './types';
import { withBadge, withUrn } from './utils';

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
  thumbnailLink: String!
}

type Query {
  file(search: String, ids: [ID!], id: ID!): [File!]!
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
          ? `https://www.googleapis.com/drive/v3/files?q=name%20contains%20'${search}'&fields=files(id,name,thumbnailLink)`
          : `https://www.googleapis.com/drive/v3/files/${ids}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new GraphQLError(
            `Google Drive API returned a non-200 status code: ${response.status}`
          );
        }

        const json = await response.json();
        console.log('Google Drive API Response:', json);

        /**
         * The PotterDB API returns all the character information, so we grab the subset of it
         * that matches with the defined graphql schema.
         *
         */
        return json.data.files.map((file: any) => ({
          id: file.id,
          title: file.name,
          image: file.thumbnailLink,
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
  console.log('resourceTypeMappingHandler', { mappings });
  return {
    resourceTypes: mappings,
  };
};

const queryHandler: QueryHandler = async (event, context) => {
  /* Installation parameters are defined in the app definition
   * and set per installation */

  /* Make a request to the third party API.
   * The expected return type aligns with the
   * one outlined in the GraphQL specs:
   * https://spec.graphql.org/October2021/#sec-Response
   */
  console.log('query handler ran');
  const response = await yoga.fetch(
    'http://this-does-not-matter.com/graphql',
    {
      body: JSON.stringify({
        query: event.query,
        operationName: event.operationName,
        variables: event.variables,
      }),
      method: 'POST',
      headers: { accept: 'application/graphql-response+json', 'content-type': 'application/json' },
    },
    context
  );
  console.log({ event, context, response });
  return response.json();
};

const searchHandler: ResourcesSearchHandler = async (event, context) => {
  const { query } = event;
  const response = await fetch('http://this-does-not-matter.com/graphql', {
    body: JSON.stringify({
      query: /* GraphQL */ `
        query searchFiles($query: String!) {
          file(search: $query) {
            id
            name
            thumbnailLink
          }
        }
      `,
      variables: { query },
    }),
    method: 'POST',
    headers: { Accept: 'application/json', 'content-type': 'application/json' },
  });
  const json = await response.json();
  console.log('Google Drive API Response:', json);

  const items = json.data.files.map((file: any) => ({
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

  const response = await fetch('http://this-does-not-matter.com/graphql', {
    body: JSON.stringify({
      query: /* GraphQL */ `
        query lookupFiles($ids: [ID!]!) {
          file(ids: $ids) {
            id
            name
            thumbnailLink
          }
        }
      `,
      variables: { ids: urns },
    }),
    method: 'POST',
    headers: { Accept: 'application/json', 'content-type': 'application/json' },
  });

  const json = await response.json();
  console.log('Google Drive API Response:', json);

  const items = json.data.files
    .map((file: any) => {
      if (file === null) {
        console.error('Null file encountered');
        return null;
      }
      return {
        ...withBadge(file),
        ...withUrn(file),
      };
    })
    .filter((file: any) => !!file);

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
