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
  file(search: String!): File
}`;

const schema = createSchema({
  typeDefs,
  resolvers: {
    Query: {
      file: async (_parent, { search }, _context) => {
        /**
         * We grab the query argument `slug` and use it to fetch the character from the PotterDB API.
         */
        const response = await fetch(`https://api.potterdb.com/v1/characters/${search}`);

        if (!response.ok) {
          throw new GraphQLError(`PotterDB returned a non-200 status code: ${response.status}`);
        }

        const file = await response.json();
        const { name, id, iconLink } = file.data.attributes;

        /**
         * The PotterDB API returns all the character information, so we grab the subset of it
         * that matches with the defined graphql schema.
         *
         */

        return {
          name,
          id,
          iconLink,
        };
      },
    },
  },
});

const yoga = createYoga({ schema, graphiql: false });
