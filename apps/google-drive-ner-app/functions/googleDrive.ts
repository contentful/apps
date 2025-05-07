import { schema } from './googleDriveGraphqlSchema';
import {
  EventHandler,
  MappingHandler,
  QueryHandler,
  ResourcesLookupHandler,
  ResourcesSearchHandler,
} from './types';
import { withBadge, withUrn } from './utils';

import { createYoga } from 'graphql-yoga';

const yoga = createYoga({ schema, graphiql: false });

const resourceTypeMappingHandler: MappingHandler = (event) => {
  const mappings = event.resourceTypes.map(({ resourceTypeId }) => ({
    resourceTypeId,
    graphQLOutputType: 'FileResult',
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
  const result = await response.json();
  console.log('Instrospection Response:', JSON.stringify(result, null, 2));

  return result;
};

const searchHandler: ResourcesSearchHandler = async (event, context) => {
  const { query } = event;

  console.log('searchHandler', { query });

  const response = await yoga.fetch(
    'http://this-does-not-matter.com/graphql',
    {
      body: JSON.stringify({
        query: /* GraphQL */ `
          query searchFiles($query: String!) {
            file(search: $query) {
              items {
                id
                title
                image
              }
            }
          }
        `,
        variables: { query },
      }),
      method: 'POST',
      headers: { Accept: 'application/json', 'content-type': 'application/json' },
    },
    context
  );
  const json = await response.json();
  console.log('Google Drive API Response:', json);

  const items = json.files.map((file: any) => ({
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

  const response = await yoga.fetch('http://this-does-not-matter.com/graphql', {
    body: JSON.stringify({
      query: /* GraphQL */ `
        query lookupFiles($ids: [ID!]!) {
          file(ids: $ids) {
            items {
              id
              title
              image
            }
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

  const items = json.files
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
