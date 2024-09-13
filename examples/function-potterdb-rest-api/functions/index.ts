import type { FunctionEventHandler as EventHandler } from '@contentful/node-apps-toolkit';
import { createSchema, createYoga } from 'graphql-yoga';
import { GraphQLError } from 'graphql';

/*
 * We re-create a basic subset of the actual payloads in order to showcase how to wrap a REST API.
 * this schema will be use to handle upcomming graphql queries
 */
const typeDefs = `
type Character {
  slug: String!
  name: String
  nationality: String
  image: String
  house: String
  wiki: String
  species: String
  gender: String
  aliasNames: [String!]
  familyMembers: [String!]
  titles: [String!]
}

type Query {
  character(slug: String!): Character
}`;

const schema = createSchema({
  typeDefs,
  resolvers: {
    Query: {
      character: async (_parent, { slug }, _context) => {
        /**
         * We grab the query argument `slug` and use it to fetch the character from the PotterDB API.
         */
        const response = await fetch(`https://api.potterdb.com/v1/characters/${slug}`);

        if (!response.ok) {
          throw new GraphQLError(`PotterDB returned a non-200 status code: ${response.status}`);
        }

        const character = await response.json();
        const {
          name,
          alias_names: aliasNames,
          family_members: familyMembers,
          house,
          image,
          titles,
          wiki,
        } = character.data.attributes;

        /**
         * The PotterDB API returns all the character information, so we grab the subset of it
         * that matches with the defined graphql schema.
         *
         */

        return {
          slug,
          name,
          aliasNames,
          familyMembers,
          house,
          image,
          titles,
          wiki,
        };
      },
    },
  },
});
const yoga = createYoga({ schema, graphiql: false });

const fieldMappingHandler: EventHandler<'graphql.field.mapping'> = (event, context) => {
  const fields = event.fields.map(({ contentTypeId, field }) => {
    return {
      contentTypeId,
      fieldId: field.id,
      graphQLOutputType: 'Character',
      graphQLQueryField: 'character',
      graphQLQueryArguments: { slug: '' },
    };
  });

  return {
    namespace: 'PotterDB',
    fields,
  };
};

const queryHandler: EventHandler<'graphql.query'> = async (event, context) => {
  const { query, operationName, variables } = event;
  const body = JSON.stringify({
    query,
    operationName,
    variables,
  });

  const request = {
    body,
    method: 'post',
    headers: {
      accept: 'application/graphql-response+json',
      'content-type': 'application/json',
    },
  };

  /**
   * We take the graphql query from the event and prepare a request for the yoga server.
   * The yoga server will then execute the query using the schema and the resolver we defined above.
   */

  const response = await yoga.fetch('http://this-does-not-matter.com/graphql', request, context);

  return response.json();
};

export const handler: EventHandler = (event, context) => {
  if (event.type === 'graphql.field.mapping') {
    return fieldMappingHandler(event, context);
  }
  if (event.type === 'graphql.query') {
    return queryHandler(event, context);
  }
  throw new Error('Unknown Event');
};
